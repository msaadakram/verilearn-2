/**
 * CallContext.tsx — Global call state + Socket.io signaling + Session lifecycle
 *
 * Manages the entire lifecycle of a video call:
 *  idle → calling (student) / incoming (teacher) → connected → ended → idle
 *
 * Session lifecycle (credit tracking):
 *  When a call starts with an activeBookingId, emits session-join/session-end
 *  events so the backend can track actual duration and transfer credits.
 *
 * The Agora RTC operations are delegated to services/agora.ts.
 * Socket.io signaling works via the backend's call events.
 */
'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import {
    joinCall as agoraJoinCall,
    leaveCall as agoraLeaveCall,
    onRemoteUserPublished,
    onRemoteUserUnpublished,
    toggleMute as agoraToggleMute,
    toggleCamera as agoraToggleCamera,
    RemoteUser,
} from '../services/agora';
import { AUTH_SESSION_CHANGED_EVENT, getStoredAuthSession, getStoredAuthUser, updateStoredAuthUser } from '../services/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

export interface IncomingCallData {
    channel: string;
    studentId: string;
    teacherId: string;
    callerName: string;
    callerAvatar: string;
}

export interface SessionCompletedData {
    bookingId: string;
    creditsUsed: number;
    actualDurationMinutes: number;
    studentCreditsRemaining: number;
    teacherCreditsTotal: number;
    teacherSessionStats?: {
        successfulSessions: number;
        tier: 'Bronze' | 'Gold' | 'Diamond';
    };
    endedBy: string;
}

export interface CallContextType {
    callStatus: CallStatus;
    incomingCall: IncomingCallData | null;
    localVideoTrack: ICameraVideoTrack | null;
    localAudioTrack: IMicrophoneAudioTrack | null;
    remoteUsers: RemoteUser[];
    isMuted: boolean;
    isCameraOff: boolean;
    isMinimized: boolean;
    callDurationSeconds: number;
    otherUserId: string | null;
    currentChannel: string | null;
    /** Active booking linked to the current call */
    activeBookingId: string | null;
    /** Session completion data (credits transferred) */
    sessionResult: SessionCompletedData | null;
    /** Whether we're waiting for the other user to join the session */
    waitingForOther: string | null;
    /** Student calls this to initiate a call to a teacher */
    initiateCall: (teacherId: string, bookingId?: string) => void;
    /** Join an existing scheduled session directly */
    joinSessionCall: (channel: string, bookingId: string) => Promise<void>;
    /** Teacher calls this to accept an incoming call */
    acceptCall: () => Promise<void>;
    /** Teacher calls this to reject an incoming call */
    rejectCall: () => void;
    /** Either party ends the call */
    endCall: () => Promise<void>;
    /** Toggle microphone mute */
    toggleMute: () => Promise<void>;
    /** Toggle camera on/off */
    toggleCamera: () => Promise<void>;
    /** Toggle minimize call UI */
    toggleMinimize: () => void;
    /** Set the active booking ID to link a call to a session */
    setActiveBookingId: (id: string | null) => void;
    /** Clear session result */
    clearSessionResult: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CallContext = createContext<CallContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

/** Derive a stable numeric Agora UID from a MongoDB ObjectId string */
function uidFromId(id: string): number {
    // Use the last 8 hex chars → parse as 32-bit integer
    return parseInt(id.slice(-8), 16) || Math.floor(Math.random() * 1_000_000);
}

/** Fetch a short-lived Agora token from our secure backend */
async function fetchAgoraToken(
    channel: string,
    uid: number,
    authToken: string,
): Promise<string> {
    const res = await fetch(
        `${API_BASE}/api/call/token?channel=${encodeURIComponent(channel)}&uid=${uid}`,
        { headers: { Authorization: `Bearer ${authToken}` } },
    );
    if (!res.ok) throw new Error('Failed to fetch Agora token');
    const data = await res.json() as { token: string };
    return data.token;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CallProvider({ children }: { children: React.ReactNode }) {
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [callDurationSeconds, setCallDurationSeconds] = useState(0);
    const [otherUserId, setOtherUserId] = useState<string | null>(null);
    const [currentChannel, setCurrentChannel] = useState<string | null>(null);

    // Session lifecycle
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
    const [sessionResult, setSessionResult] = useState<SessionCompletedData | null>(null);
    const [waitingForOther, setWaitingForOther] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const incomingAutoRejectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ringingAudioRef = useRef<HTMLAudioElement | null>(null);
    const activeBookingIdRef = useRef<string | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        activeBookingIdRef.current = activeBookingId;
    }, [activeBookingId]);

    // ── Timer management ────────────────────────────────────────────────────────

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setCallDurationSeconds(0);
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        setCallDurationSeconds(0);
        timerRef.current = setInterval(() => {
            setCallDurationSeconds((s) => s + 1);
        }, 1000);
    }, [stopTimer]);

    // ── Ringing sound management ────────────────────────────────────────────────

    const playRingingSound = useCallback(() => {
        try {
            if (!ringingAudioRef.current) {
                const audio = new Audio('/whatsapp_ringtone.mp3');
                audio.loop = true;
                audio.volume = 0.8;
                ringingAudioRef.current = audio;
            }

            const playPromise = ringingAudioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn('[Call] Failed to play ringing sound:', err);
                });
            }

            setTimeout(() => {
                if (ringingAudioRef.current && !ringingAudioRef.current.paused) {
                    try {
                        ringingAudioRef.current.pause();
                    } catch (err) {
                        console.warn('[Call] Failed to stop ringing sound:', err);
                    }
                }
            }, 30000);
        } catch (err) {
            console.warn('[Call] Failed to play ringing sound:', err);
        }
    }, []);

    const stopRingingSound = useCallback(() => {
        if (ringingAudioRef.current) {
            try {
                ringingAudioRef.current.pause();
                ringingAudioRef.current.currentTime = 0;
            } catch (err) {
                console.warn('[Call] Failed to stop ringing sound:', err);
            }
        }
    }, []);

    // ── Toggle minimize ────────────────────────────────────────────────────────

    const toggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev);
    }, []);

    const clearSessionResult = useCallback(() => {
        setSessionResult(null);
    }, []);

    // ── Agora remote-user event registration ────────────────────────────────────

    useEffect(() => {
        onRemoteUserPublished((user) => {
            setRemoteUsers((prev) => {
                const existing = prev.find((u) => u.uid === user.uid);
                if (existing) {
                    return prev.map((u) =>
                        u.uid === user.uid
                            ? {
                                ...u,
                                videoTrack: user.videoTrack ?? u.videoTrack,
                                audioTrack: user.audioTrack ?? u.audioTrack,
                            }
                            : u,
                    );
                }
                return [...prev, user];
            });
        });

        onRemoteUserUnpublished((uid) => {
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== uid));
        });
    }, []);

    // ── Socket.io setup ─────────────────────────────────────────────────────────

    useEffect(() => {
        let socket: Socket | null = null;

        const disconnectSocket = () => {
            if (!socket) {
                socketRef.current = null;
                return;
            }

            socket.off('incoming-call');
            socket.off('call-accepted');
            socket.off('call-rejected');
            socket.off('call-ended');
            socket.off('call-error');
            socket.off('session-started');
            socket.off('session-waiting');
            socket.off('session-user-joined');
            socket.off('session-completed');
            socket.off('session-error');
            socket.disconnect();
            socket = null;
            socketRef.current = null;
        };

        const connectSocket = () => {
            disconnectSocket();

            const session = getStoredAuthSession();
            if (!session?.token) return;

            const user = session.user;
            const activeMode = user?.profession ?? 'student';

            socket = io(API_BASE, {
                auth: { token: session.token, activeMode },
                transports: ['websocket', 'polling'],
                reconnection: true,
            });

            socketRef.current = socket;

            // ── Teacher receives incoming call ────────────────────────────────────
            socket.on('incoming-call', (data: IncomingCallData) => {
                console.log('[Call] Incoming call from:', data.callerName);
                setIncomingCall(data);
                setCurrentChannel(data.channel);
                setOtherUserId(data.studentId);
                setCallStatus('incoming');
                playRingingSound();

                incomingAutoRejectRef.current = setTimeout(() => {
                    socket?.emit('call-rejected', {
                        channel: data.channel,
                        studentId: data.studentId,
                        reason: 'No answer.',
                    });
                    stopRingingSound();
                    setCallStatus('idle');
                    setIncomingCall(null);
                }, 30_000);
            });

            // ── Student: teacher accepted ────────────────────────────────────────
            socket.on('call-accepted', async (data: { channel: string; teacherId: string }) => {
                console.log('[Call] Call accepted, joining Agora channel:', data.channel);
                stopRingingSound();
                if (incomingAutoRejectRef.current) {
                    clearTimeout(incomingAutoRejectRef.current);
                }

                const s = getStoredAuthSession();
                if (!s?.token) return;

                const currentUser = s.user;
                if (!currentUser) return;

                const uid = uidFromId(currentUser.id);

                try {
                    const token = await fetchAgoraToken(data.channel, uid, s.token);
                    const tracks = await agoraJoinCall(AGORA_APP_ID, data.channel, token, uid);
                    setLocalVideoTrack(tracks.videoTrack);
                    setLocalAudioTrack(tracks.audioTrack);
                    setCallStatus('connected');
                    setCurrentChannel(data.channel);
                    startTimer();

                    // If linked to a booking, emit session-join
                    if (activeBookingIdRef.current) {
                        socket?.emit('session-join', { bookingId: activeBookingIdRef.current });
                    }
                } catch (err) {
                    console.error('[Call] Failed to join Agora channel:', err);
                    setCallStatus('idle');
                }
            });

            // ── Student: teacher rejected ─────────────────────────────────────────
            socket.on('call-rejected', (data: { reason: string }) => {
                console.log('[Call] Call rejected:', data.reason);
                stopRingingSound();
                if (incomingAutoRejectRef.current) {
                    clearTimeout(incomingAutoRejectRef.current);
                }
                setCallStatus('ended');
                setIncomingCall(null);
                setTimeout(() => setCallStatus('idle'), 3000);
            });

            // ── Either party: call ended remotely ────────────────────────────────
            socket.on('call-ended', async () => {
                console.log('[Call] Remote party ended call');
                stopRingingSound();
                await agoraLeaveCall();
                stopTimer();
                setLocalVideoTrack(null);
                setLocalAudioTrack(null);
                setRemoteUsers([]);
                setCallStatus('ended');
                setCurrentChannel(null);
                setOtherUserId(null);
                setWaitingForOther(null);
                setTimeout(() => setCallStatus('idle'), 3000);
            });

            // ── Error ───────────────────────────────────────────────────────────
            socket.on('call-error', (data: { message: string }) => {
                if (data.message === 'Only students can initiate calls.') {
                    console.warn('[Call] Call blocked:', data.message);
                    setCallStatus('idle');
                    return;
                }

                console.error('[Call] Socket error:', data.message);
                setCallStatus('idle');
            });

            // ── Session lifecycle events ──────────────────────────────────────────

            socket.on('session-started', (data: { bookingId: string; startTime: string }) => {
                console.log('[Session] Session started:', data.bookingId);
                setWaitingForOther(null);
            });

            socket.on('session-waiting', (data: { bookingId: string; waitingFor: string }) => {
                console.log('[Session] Waiting for:', data.waitingFor);
                setWaitingForOther(data.waitingFor);
            });

            socket.on('session-user-joined', (data: { bookingId: string; role: string }) => {
                console.log('[Session] Other user joined:', data.role);
                setWaitingForOther(null);
            });

            socket.on('session-completed', (data: SessionCompletedData) => {
                console.log('[Session] Session completed. Credits used:', data.creditsUsed);
                setSessionResult(data);

                // Update local user credits
                const currentUser = getStoredAuthUser();
                if (currentUser) {
                    const isStudent = currentUser.profession === 'student';
                    const newCredits = isStudent
                        ? data.studentCreditsRemaining
                        : data.teacherCreditsTotal;
                    updateStoredAuthUser({
                        ...currentUser,
                        learningCredits: newCredits,
                        ...(currentUser.profession === 'teacher' && data.teacherSessionStats
                            ? { teacherSessionStats: data.teacherSessionStats }
                            : {}),
                    });
                }
            });

            socket.on('session-error', (data: { message: string }) => {
                if (data.message === 'Session already completed.') {
                    console.warn('[Session] Duplicate end request ignored:', data.message);
                    return;
                }

                console.error('[Session] Error:', data.message);
            });
        };

        connectSocket();

        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, connectSocket);

        return () => {
            window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, connectSocket);
            disconnectSocket();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Public actions ──────────────────────────────────────────────────────────

    /** Student: initiate a call to a teacher */
    const initiateCall = useCallback((teacherId: string, bookingId?: string) => {
        const socket = socketRef.current;
        const user = getStoredAuthUser();
        if (!socket || !user) return;

        if (user.profession !== 'student') {
            console.warn('[Call] Only students can initiate calls');
            return;
        }

        if (bookingId) {
            setActiveBookingId(bookingId);
        }

        const channel = `call_${user.id}_${teacherId}`;
        setCurrentChannel(channel);
        setOtherUserId(teacherId);
        setCallStatus('calling');

        socket.emit('call-user', {
            teacherId,
            studentId: user.id,
            callerName: user.name,
            callerAvatar: user.avatarUrl ?? '',
        });
    }, []);

    /** Join a scheduled session directly (for both student and teacher) */
    const joinSessionCall = useCallback(async (channel: string, bookingId: string) => {
        const socket = socketRef.current;
        const session = getStoredAuthSession();
        const user = getStoredAuthUser();
        if (!socket || !session || !user) return;

        setActiveBookingId(bookingId);
        setCurrentChannel(channel);

        const uid = uidFromId(user.id);

        try {
            const token = await fetchAgoraToken(channel, uid, session.token);
            const tracks = await agoraJoinCall(AGORA_APP_ID, channel, token, uid);
            setLocalVideoTrack(tracks.videoTrack);
            setLocalAudioTrack(tracks.audioTrack);
            setCallStatus('connected');
            startTimer();

            // Emit session-join to trigger backend tracking and other user's UI
            socket.emit('session-join', { bookingId });

            // Set waiting text until the other person joins
            setWaitingForOther('Waiting for the other party to join...');
        } catch (err) {
            console.error('[Call] Failed to join session channel:', err);
            setCallStatus('idle');
            setCurrentChannel(null);
            setActiveBookingId(null);
        }
    }, [startTimer]);

    /** Teacher: accept incoming call and join Agora channel */
    const acceptCall = useCallback(async () => {
        const socket = socketRef.current;
        const session = getStoredAuthSession();
        const user = getStoredAuthUser();
        if (!socket || !session || !user || !incomingCall) return;

        if (incomingAutoRejectRef.current) {
            clearTimeout(incomingAutoRejectRef.current);
        }

        socket.emit('call-accepted', {
            channel: incomingCall.channel,
            studentId: incomingCall.studentId,
            teacherId: user.id,
        });

        const uid = uidFromId(user.id);

        try {
            const token = await fetchAgoraToken(incomingCall.channel, uid, session.token);
            const tracks = await agoraJoinCall(AGORA_APP_ID, incomingCall.channel, token, uid);
            setLocalVideoTrack(tracks.videoTrack);
            setLocalAudioTrack(tracks.audioTrack);
            setCallStatus('connected');
            setIncomingCall(null);
            startTimer();

            // If linked to a booking, emit session-join
            if (activeBookingIdRef.current) {
                socket.emit('session-join', { bookingId: activeBookingIdRef.current });
            }
        } catch (err) {
            console.error('[Call] Teacher failed to join channel:', err);
            setCallStatus('idle');
        }
    }, [incomingCall, startTimer, stopRingingSound]);

    /** Teacher: reject incoming call */
    const rejectCall = useCallback(() => {
        const socket = socketRef.current;
        if (!socket || !incomingCall) return;

        if (incomingAutoRejectRef.current) {
            clearTimeout(incomingAutoRejectRef.current);
        }

        socket.emit('call-rejected', {
            channel: incomingCall.channel,
            studentId: incomingCall.studentId,
            reason: 'Teacher declined the call.',
        });

        setCallStatus('idle');
        setIncomingCall(null);
        setCurrentChannel(null);
        setOtherUserId(null);
        setActiveBookingId(null);
    }, [incomingCall]);

    /** Either party: end the active call + trigger session end */
    const endCall = useCallback(async () => {
        const socket = socketRef.current;
        stopRingingSound();

        // End the session (credit transfer) if we have an active booking
        if (socket && activeBookingIdRef.current) {
            socket.emit('session-end', { bookingId: activeBookingIdRef.current });
        }

        if (socket && otherUserId && currentChannel) {
            socket.emit('end-call', {
                channel: currentChannel,
                otherUserId,
            });
        }

        await agoraLeaveCall();
        stopTimer();
        setLocalVideoTrack(null);
        setLocalAudioTrack(null);
        setRemoteUsers([]);
        setCallStatus('ended');
        setCurrentChannel(null);
        setOtherUserId(null);
        setIncomingCall(null);
        setWaitingForOther(null);
        setActiveBookingId(null);
        setTimeout(() => setCallStatus('idle'), 3000);
    }, [otherUserId, currentChannel, stopTimer, stopRingingSound]);

    /** Toggle microphone mute */
    const toggleMute = useCallback(async () => {
        const newState = await agoraToggleMute();
        setIsMuted(newState);
    }, []);

    /** Toggle camera on/off */
    const toggleCamera = useCallback(async () => {
        const newState = await agoraToggleCamera();
        setIsCameraOff(newState);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────────

    const value: CallContextType = {
        callStatus,
        incomingCall,
        localVideoTrack,
        localAudioTrack,
        remoteUsers,
        isMuted,
        isCameraOff,
        isMinimized,
        callDurationSeconds,
        otherUserId,
        currentChannel,
        activeBookingId,
        sessionResult,
        waitingForOther,
        initiateCall,
        joinSessionCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleMinimize,
        setActiveBookingId,
        clearSessionResult,
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCall(): CallContextType {
    const ctx = useContext(CallContext);
    if (!ctx) throw new Error('useCall must be used within <CallProvider>');
    return ctx;
}
