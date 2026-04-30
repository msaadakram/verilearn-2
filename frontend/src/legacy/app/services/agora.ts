/**
 * agora.ts — Agora RTC service layer
 *
 * Manages a single AgoraRTC client instance. All Agora interactions
 * (join, publish, subscribe, leave) go through this module.
 * Call state and UI concerns live in CallContext.tsx above this layer.
 */
import AgoraRTC, {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    IRemoteVideoTrack,
    IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocalTracks {
    videoTrack: ICameraVideoTrack | null;
    audioTrack: IMicrophoneAudioTrack | null;
}

export interface RemoteUser {
    uid: string | number;
    videoTrack: IRemoteVideoTrack | null;
    audioTrack: IRemoteAudioTrack | null;
}

export type RemoteUserPublishedCallback = (user: RemoteUser) => void;
export type RemoteUserUnpublishedCallback = (uid: string | number) => void;

// ─── State ────────────────────────────────────────────────────────────────────

let client: IAgoraRTCClient | null = null;
let localVideoTrack: ICameraVideoTrack | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let isMuted = false;
let isCameraOff = false;

// ─── Client initialisation ────────────────────────────────────────────────────

function getClient(): IAgoraRTCClient {
    if (!client) {
        client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }
    return client;
}

// ─── Event registration ───────────────────────────────────────────────────────

/**
 * Subscribe to remote user publishing events.
 * Call this BEFORE joining a channel so you don't miss the first publish.
 */
export function onRemoteUserPublished(callback: RemoteUserPublishedCallback) {
    const c = getClient();

    c.on('user-published', async (agoraUser, mediaType) => {
        await c.subscribe(agoraUser, mediaType);

        const remoteUser: RemoteUser = {
            uid: agoraUser.uid,
            videoTrack: mediaType === 'video' ? (agoraUser.videoTrack ?? null) : null,
            audioTrack: mediaType === 'audio' ? (agoraUser.audioTrack ?? null) : null,
        };

        // Auto-play audio immediately
        if (mediaType === 'audio' && agoraUser.audioTrack) {
            agoraUser.audioTrack.play();
        }

        callback(remoteUser);
    });
}

/**
 * Subscribe to remote user un-publishing / leaving events.
 */
export function onRemoteUserUnpublished(callback: RemoteUserUnpublishedCallback) {
    const c = getClient();

    c.on('user-unpublished', (agoraUser) => {
        callback(agoraUser.uid);
    });

    c.on('user-left', (agoraUser) => {
        callback(agoraUser.uid);
    });
}

// ─── Core call functions ──────────────────────────────────────────────────────

/**
 * Join an Agora channel, create and publish local audio+video tracks.
 * @param appId    - Agora App ID (from env, safe to expose)
 * @param channel  - Agora channel name (e.g. "call_studentId_teacherId")
 * @param token    - Short-lived token fetched from our secure backend
 * @param uid      - Numeric UID for this user in the Agora channel
 * @returns        - Local video and audio tracks
 */
export async function joinCall(
    appId: string,
    channel: string,
    token: string,
    uid: number,
): Promise<LocalTracks> {
    const c = getClient();

    // Join channel
    await c.join(appId, channel, token, uid);

    // Create local tracks
    [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { ANS: true, AEC: true },
        { encoderConfig: '480p_1' },
    );

    // Publish both tracks
    await c.publish([localAudioTrack, localVideoTrack]);

    isMuted = false;
    isCameraOff = false;

    return { videoTrack: localVideoTrack, audioTrack: localAudioTrack };
}

/**
 * Leave the channel, unpublish, and release all local media tracks.
 */
export async function leaveCall(): Promise<void> {
    try {
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            localAudioTrack = null;
        }

        if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.close();
            localVideoTrack = null;
        }

        if (client) {
            await client.leave();
        }
    } catch (err) {
        console.error('[Agora] Error leaving call:', err);
    }

    isMuted = false;
    isCameraOff = false;
}

/**
 * Toggle microphone mute state.
 * @returns new muted state (true = muted)
 */
export async function toggleMute(): Promise<boolean> {
    if (!localAudioTrack) return isMuted;

    isMuted = !isMuted;
    await localAudioTrack.setMuted(isMuted);
    return isMuted;
}

/**
 * Toggle camera on/off.
 * @returns new camera-off state (true = camera disabled)
 */
export async function toggleCamera(): Promise<boolean> {
    if (!localVideoTrack) return isCameraOff;

    isCameraOff = !isCameraOff;
    await localVideoTrack.setMuted(isCameraOff);
    return isCameraOff;
}

/** Returns current mute state */
export function getMuteState(): boolean {
    return isMuted;
}

/** Returns current camera state */
export function getCameraState(): boolean {
    return isCameraOff;
}
