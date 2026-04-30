/**
 * VideoCallUI.tsx
 * Full-screen call overlay shown when callStatus is 'calling' or 'connected'.
 * Renders:
 *  - Remote video (large)
 *  - Local video (PiP corner)
 *  - Control bar (mute, camera, end call)
 *  - Call timer and status badge
 *  - Handles rejected/ended states with toast-style message
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Coins, MessageSquareText, Send, Star, TimerReset, X } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { getStoredAuthUser } from '../../services/auth';
import { submitBookingReview } from '../../services/booking';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function getStarFillClass(star: number, rating: number) {
    return star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300';
}

const STATUS_LABELS: Record<string, string> = {
    calling: 'Ringing…',
    connected: 'Connected',
    ended: 'Call ended',
    incoming: '',
    idle: '',
};

// ─── Remote Video Player ──────────────────────────────────────────────────────

function RemoteVideoPlayer({ uid }: { uid: string | number }) {
    const { remoteUsers } = useCall();
    const containerRef = useRef<HTMLDivElement>(null);
    const user = remoteUsers.find((u) => u.uid === uid);

    useEffect(() => {
        if (user?.videoTrack && containerRef.current) {
            user.videoTrack.play(containerRef.current);
        }
        return () => {
            user?.videoTrack?.stop();
        };
    }, [user?.videoTrack]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', background: '#111', borderRadius: 0 }}
        />
    );
}

// ─── Local Video Player ───────────────────────────────────────────────────────

function LocalVideoPlayer() {
    const { localVideoTrack, isCameraOff } = useCall();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (localVideoTrack && containerRef.current && !isCameraOff) {
            localVideoTrack.play(containerRef.current);
        }
        return () => {
            localVideoTrack?.stop();
        };
    }, [localVideoTrack, isCameraOff]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={styles.localVideoWrapper}>
            {isCameraOff ? (
                <div style={styles.cameraOffPlaceholder}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M17 10L21 7v10l-4-3m-13 0V7a2 2 0 012-2h9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="3" y1="3" x2="21" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>Camera off</span>
                </div>
            ) : (
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            )}
        </div>
    );
}

// ─── Main VideoCallUI ─────────────────────────────────────────────────────────

export function VideoCallUI() {
    const {
        callStatus,
        remoteUsers,
        isMuted,
        isCameraOff,
        isMinimized,
        callDurationSeconds,
        endCall,
        toggleMute,
        toggleCamera,
        toggleMinimize,
        waitingForOther,
        sessionResult,
        clearSessionResult,
    } = useCall();
    const [showSummary, setShowSummary] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [summaryRemainingSeconds, setSummaryRemainingSeconds] = useState(0);
    const summaryCountdownTimerRef = useRef<number | null>(null);
    const currentUser = getStoredAuthUser();
    const isStudent = currentUser?.profession === 'student';
    const showStudentReview = isStudent;

    const clearSummaryCountdownTimer = useCallback(() => {
        if (summaryCountdownTimerRef.current) {
            window.clearInterval(summaryCountdownTimerRef.current);
            summaryCountdownTimerRef.current = null;
        }
    }, []);

    const handleCloseSummary = useCallback(() => {
        clearSummaryCountdownTimer();
        setSummaryRemainingSeconds(0);
        setShowSummary(false);
        clearSessionResult();
    }, [clearSessionResult, clearSummaryCountdownTimer]);

    // Show credit summary when session completes
    useEffect(() => {
        if (sessionResult) {
            setShowSummary(true);
            setSummaryRemainingSeconds(60);
            setReviewSubmitted(false);
            setReviewError(null);
            setReviewText('');
            setReviewRating(5);
        }
    }, [sessionResult]);

    useEffect(() => {
        if (!showSummary) {
            clearSummaryCountdownTimer();
            setSummaryRemainingSeconds(0);
            return;
        }

        clearSummaryCountdownTimer();
        setSummaryRemainingSeconds(60);

        summaryCountdownTimerRef.current = window.setInterval(() => {
            setSummaryRemainingSeconds((secondsLeft) => {
                if (secondsLeft <= 1) {
                    clearSummaryCountdownTimer();
                    handleCloseSummary();
                    return 0;
                }

                return secondsLeft - 1;
            });
        }, 1000);

        return () => {
            clearSummaryCountdownTimer();
        };
    }, [showSummary, clearSummaryCountdownTimer, handleCloseSummary]);

    const handleSubmitReview = async () => {
        if (!sessionResult?.bookingId || !isStudent || reviewSubmitting) {
            return;
        }

        setReviewSubmitting(true);
        setReviewError(null);

        try {
            await submitBookingReview(sessionResult.bookingId, {
                rating: reviewRating,
                text: reviewText,
            });
            setReviewSubmitted(true);
        } catch (error) {
            setReviewError(error instanceof Error ? error.message : 'Failed to submit review.');
        } finally {
            setReviewSubmitting(false);
        }
    };
    if ((callStatus === 'idle' || callStatus === 'incoming') && !showSummary) return null;

    // If minimized, show small floating window
    if (isMinimized) {
        return (
            <div style={styles.minimizedWindow}>
                <div style={styles.minimizedContent}>
                    <span style={styles.minimizedStatus}>
                        {callStatus === 'calling' ? 'Ringing...' : 'In Call'}
                    </span>
                    <button
                        onClick={toggleMinimize}
                        style={styles.minimizedExpandBtn}
                        title="Expand call"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4h6v2H6v4H4V4zm14 0v6h-2v-4h-4V4h6zm-14 14h6v2H4v-6h2v4zm10 0h4v-4h2v6h-6v-2z" fill="white" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    const isConnected = callStatus === 'connected';
    const firstRemote = remoteUsers[0];

    return (
        <>
            {/* Global CSS animations injected once */}
            <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

            <div style={styles.overlay}>
                {/* ── Remote video ───────────────────────────────────────────────── */}
                <div style={styles.remoteVideo}>
                    {isConnected && firstRemote ? (
                        <RemoteVideoPlayer uid={firstRemote.uid} />
                    ) : (
                        <div style={styles.waitingScreen}>
                            <div style={styles.pulseRing} />
                            <div style={styles.pulseRing2} />
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                                <path d="M20 20c0-4.418-3.582-8-8-8s-8 3.582-8 8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <p style={styles.waitingText}>
                                {waitingForOther || (callStatus === 'calling' ? 'Waiting for teacher to accept…' : 'Connecting…')}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Local video PiP ────────────────────────────────────────────── */}
                <LocalVideoPlayer />

                {/* ── Status bar (top) ──────────────────────────────────────────── */}
                <div style={styles.statusBar}>
                    <span style={styles.statusBadge} data-status={callStatus}>
                        <span style={{
                            ...styles.statusDot,
                            background: callStatus === 'connected' ? '#22c55e'
                                : callStatus === 'calling' ? '#f59e0b'
                                    : '#ef4444',
                        }} />
                        {STATUS_LABELS[callStatus]}
                    </span>

                    {isConnected && (
                        <span style={styles.timer}>{formatDuration(callDurationSeconds)}</span>
                    )}
                </div>

                {/* ── Control bar (bottom) ──────────────────────────────────────── */}
                <div style={styles.controlBar}>
                    {/* Mute */}
                    <button
                        style={{ ...styles.ctrlBtn, background: isMuted ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.15)' }}
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            /* Muted mic icon */
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v3m0 0H9m3 0h3M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="3" y1="3" x2="21" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        ) : (
                            /* Active mic icon */
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v3m0 0H9m3 0h3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>

                    {/* Camera */}
                    <button
                        style={{ ...styles.ctrlBtn, background: isCameraOff ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.15)' }}
                        onClick={toggleCamera}
                        title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                    >
                        {isCameraOff ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M17 10L21 7v10l-4-3M3 7a2 2 0 012-2h9a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="3" y1="3" x2="21" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M17 10L21 7v10l-4-3M3 7a2 2 0 012-2h9a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>

                    {/* Minimize */}
                    <button
                        style={{ ...styles.ctrlBtn }}
                        onClick={toggleMinimize}
                        title="Minimize call"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M9 6H5v2h4V6zm6 0h4v2h-4V6zM5 12h4v2H5v-2zm10 0h4v2h-4v-2z" fill="white" />
                        </svg>
                    </button>

                    {/* End Call */}
                    <button style={styles.endCallBtn} onClick={endCall} title="End call">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" fill="white" />
                            <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* ── Ended / rejected banner ────────────────────────────────────── */}
                {callStatus === 'ended' && !showSummary && (
                    <div style={styles.endedBanner}>Call ended</div>
                )}

                {/* ── Session credit summary overlay ─────────────────────────────── */}
                {showSummary && sessionResult && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, rgba(8,15,30,0.92), rgba(10,14,25,0.96))', backdropFilter: 'blur(16px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10003, animation: 'fadeIn 0.3s ease',
                        padding: 20,
                    }}>
                        <div style={{
                            width: '100%', maxWidth: 760,
                            borderRadius: 28,
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                            display: 'grid',
                            gridTemplateColumns: showStudentReview ? '1.1fr 0.95fr' : '1fr',
                        }}>
                            <div style={{
                                padding: 28,
                                background: 'linear-gradient(180deg, rgba(122,184,186,0.18), rgba(255,255,255,0.02))',
                                borderRight: showStudentReview ? '1px solid rgba(255,255,255,0.10)' : 'none',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 14,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(34,197,94,0.16)', color: '#86efac',
                                    }}>
                                        <BadgeCheck size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                                            Session complete
                                        </h3>
                                        <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>
                                            Credits updated automatically after the call ended.
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                    gap: 12,
                                    marginBottom: 18,
                                }}>
                                    <div style={{ ...summaryCardStyle, background: 'linear-gradient(180deg, rgba(245,158,11,0.16), rgba(245,158,11,0.08))' }}>
                                        <div style={summaryLabelStyle}>Credits used</div>
                                        <div style={{ ...summaryValueStyle, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Coins size={20} />
                                            {sessionResult.creditsUsed}
                                        </div>
                                    </div>
                                    <div style={{ ...summaryCardStyle, background: 'linear-gradient(180deg, rgba(16,185,129,0.16), rgba(16,185,129,0.08))' }}>
                                        <div style={summaryLabelStyle}>Credits earned</div>
                                        <div style={{ ...summaryValueStyle, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <BadgeCheck size={20} />
                                            {sessionResult.teacherCreditsTotal}
                                        </div>
                                    </div>
                                    <div style={{ ...summaryCardStyle, background: 'linear-gradient(180deg, rgba(122,184,186,0.16), rgba(122,184,186,0.08))' }}>
                                        <div style={summaryLabelStyle}>Duration</div>
                                        <div style={{ ...summaryValueStyle, color: '#7ab8ba', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <TimerReset size={20} />
                                            {sessionResult.actualDurationMinutes}m
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    borderRadius: 18,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: 16,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <TimerReset size={18} color="#cbd5e1" />
                                        <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>What happened in this call</div>
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 1.6 }}>
                                        <div>• Credits are charged after the session completes.</div>
                                        <div>• Teacher earnings are recorded in the summary above.</div>
                                        <div>• You can leave a rating and review on the right.</div>
                                    </div>
                                </div>

                                {reviewError && (
                                    <div style={errorBannerStyle}>{reviewError}</div>
                                )}
                            </div>

                            {showStudentReview && (
                            <div style={{ padding: 28, background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                                    <div>
                                        <div style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                                            Rate this session
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                                            Share your experience so others can discover great teaching.
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '8px 10px',
                                        borderRadius: 999,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'rgba(255,255,255,0.75)',
                                        fontSize: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}>
                                        <MessageSquareText size={14} />
                                        Optional review
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            disabled={reviewSubmitted || reviewSubmitting || !isStudent}
                                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                width: 46,
                                                height: 46,
                                                borderRadius: 14,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: reviewSubmitted || reviewSubmitting || !isStudent ? 'default' : 'pointer',
                                                transition: 'transform 0.15s ease, background 0.2s ease, border-color 0.2s ease',
                                                color: star <= reviewRating ? '#fbbf24' : 'rgba(255,255,255,0.28)',
                                            }}
                                        >
                                            <Star size={22} className={getStarFillClass(star, reviewRating)} />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={reviewText}
                                    onChange={(event) => setReviewText(event.target.value)}
                                    maxLength={1000}
                                    disabled={reviewSubmitted || reviewSubmitting || !isStudent}
                                    placeholder={isStudent ? 'Write a short review about the tutor and the session…' : 'Only students can submit reviews.'}
                                    style={{
                                        width: '100%',
                                        minHeight: 130,
                                        resize: 'vertical',
                                        borderRadius: 18,
                                        border: '1px solid rgba(255,255,255,0.10)',
                                        background: 'rgba(0,0,0,0.24)',
                                        color: 'white',
                                        padding: '14px 15px',
                                        fontSize: 13,
                                        fontFamily: 'Inter, sans-serif',
                                        outline: 'none',
                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                                    }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 14 }}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                                        {reviewSubmitted
                                            ? 'Review submitted successfully.'
                                            : isStudent
                                                ? 'Tap a star, write feedback, then submit.'
                                                : 'Review can be submitted by the student after the call.'}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {showStudentReview && !reviewSubmitted && (
                                            <button
                                                type="button"
                                                onClick={() => { void handleSubmitReview(); }}
                                                disabled={reviewSubmitting || !isStudent}
                                                style={{
                                                    background: reviewSubmitting || !isStudent
                                                        ? 'rgba(255,255,255,0.10)'
                                                        : 'linear-gradient(135deg,#7ab8ba,#5a9fa1)',
                                                    color: 'white',
                                                    border: '1px solid rgba(255,255,255,0.10)',
                                                    borderRadius: 14,
                                                    padding: '11px 16px',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    cursor: reviewSubmitting || !isStudent ? 'not-allowed' : 'pointer',
                                                    opacity: reviewSubmitting || !isStudent ? 0.75 : 1,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <Send size={15} />
                                                {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                                            </button>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                                                Auto-closes in {formatDuration(summaryRemainingSeconds)}
                                            </div>
                                            <button
                                                onClick={handleCloseSummary}
                                                style={{
                                                    background: 'rgba(255,255,255,0.08)',
                                                    color: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
                                                    padding: '10px 16px', fontSize: 13, fontWeight: 600,
                                                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                                }}
                                            >
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                    <X size={14} />
                                                    {reviewSubmitted ? 'Close' : 'Skip for now'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease',
    },
    remoteVideo: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#111827',
    },
    waitingScreen: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    pulseRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(99,102,241,0.15)',
        animation: 'pulse 2s ease-in-out infinite',
    },
    pulseRing2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(99,102,241,0.1)',
        animation: 'pulse 2s ease-in-out 0.6s infinite',
    },
    waitingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        marginTop: 56,
        fontFamily: 'Inter, sans-serif',
    },
    localVideoWrapper: {
        position: 'absolute',
        top: 80,
        right: 16,
        width: 140,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#1f2937',
        border: '2px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 10001,
    },
    cameraOffPlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111827',
    },
    statusBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        zIndex: 10002,
    },
    statusBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        borderRadius: 20,
        padding: '4px 12px',
        color: 'white',
        fontSize: 13,
        fontFamily: 'Inter, sans-serif',
        border: '1px solid rgba(255,255,255,0.12)',
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        display: 'inline-block',
    },
    timer: {
        color: 'white',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 15,
        fontFamily: 'Inter, monospace',
        background: 'rgba(255,255,255,0.08)',
        padding: '4px 12px',
        borderRadius: 20,
        backdropFilter: 'blur(8px)',
    },
    controlBar: {
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'rgba(15,15,25,0.75)',
        backdropFilter: 'blur(16px)',
        borderRadius: 40,
        padding: '12px 24px',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 10002,
        animation: 'slideUp 0.3s ease',
    },
    ctrlBtn: {
        width: 52,
        height: 52,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s ease, transform 0.15s ease',
    },
    endCallBtn: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        marginLeft: 8,
    },
    endedBanner: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0,0,0,0.75)',
        color: 'white',
        padding: '16px 32px',
        borderRadius: 12,
        fontSize: 20,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        backdropFilter: 'blur(12px)',
        zIndex: 10003,
    },
    minimizedWindow: {
        position: 'fixed',
        bottom: 32,
        right: 32,
        width: 240,
        background: 'rgba(15,15,25,0.95)',
        backdropFilter: 'blur(16px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 9999,
        padding: '12px 16px',
    },
    minimizedContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    minimizedStatus: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
    },
    minimizedExpandBtn: {
        background: 'rgba(99,102,241,0.6)',
        border: 'none',
        color: 'white',
        width: 32,
        height: 32,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s ease',
    },
};

const summaryCardStyle: React.CSSProperties = {
    borderRadius: 18,
    padding: '16px 14px',
    border: '1px solid rgba(255,255,255,0.10)',
    minHeight: 92,
};

const summaryLabelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Inter, sans-serif',
};

const summaryValueStyle: React.CSSProperties = {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1,
    fontFamily: 'Inter, sans-serif',
};

const errorBannerStyle: React.CSSProperties = {
    marginTop: 14,
    padding: '10px 12px',
    borderRadius: 14,
    color: '#fecaca',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.22)',
    fontSize: 12,
};

