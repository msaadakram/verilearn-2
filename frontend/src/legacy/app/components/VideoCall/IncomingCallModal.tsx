/**
 * IncomingCallModal.tsx
 * Shown to the teacher when callStatus === 'incoming'.
 * Auto-dismissed after 30 seconds (matched by CallContext auto-reject timeout).
 */
import React, { useEffect, useState } from 'react';
import { useCall } from '../../context/CallContext';

export function IncomingCallModal() {
    const { callStatus, incomingCall, acceptCall, rejectCall } = useCall();
    const [countdown, setCountdown] = useState(30);

    // Countdown timer (visual only — auto-reject logic is in CallContext)
    useEffect(() => {
        if (callStatus !== 'incoming') {
            setCountdown(30);
            return;
        }

        const interval = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [callStatus]);

    if (callStatus !== 'incoming' || !incomingCall) return null;

    const initials = incomingCall.callerName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Ringing indicator */}
                <div style={styles.ringWrapper}>
                    <div style={styles.ringPulse} />
                    <div style={styles.ringPulse2} />
                    {incomingCall.callerAvatar ? (
                        <img
                            src={incomingCall.callerAvatar}
                            alt={incomingCall.callerName}
                            style={styles.avatar}
                        />
                    ) : (
                        <div style={styles.avatarFallback}>{initials}</div>
                    )}
                </div>

                <h2 style={styles.name}>{incomingCall.callerName}</h2>
                <p style={styles.subtext}>Incoming video call…</p>
                <p style={styles.countdown}>Auto-reject in {countdown}s</p>

                <div style={styles.buttonRow}>
                    {/* Reject */}
                    <button style={styles.rejectBtn} onClick={rejectCall} aria-label="Reject call">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
                                fill="white"
                            />
                            <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Accept */}
                    <button style={styles.acceptBtn} onClick={acceptCall} aria-label="Accept call">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
                                fill="white"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.25s ease',
    },
    modal: {
        background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
        borderRadius: 24,
        padding: '40px 32px',
        width: 320,
        textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
    },
    ringWrapper: {
        position: 'relative',
        width: 96,
        height: 96,
        margin: '0 auto 24px',
    },
    ringPulse: {
        position: 'absolute',
        inset: -12,
        borderRadius: '50%',
        background: 'rgba(34, 197, 94, 0.2)',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    ringPulse2: {
        position: 'absolute',
        inset: -6,
        borderRadius: '50%',
        background: 'rgba(34, 197, 94, 0.15)',
        animation: 'pulse 1.5s ease-in-out 0.5s infinite',
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: '50%',
        objectFit: 'cover',
        position: 'relative',
        zIndex: 1,
        border: '3px solid rgba(34, 197, 94, 0.6)',
    },
    avatarFallback: {
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        fontWeight: 700,
        color: 'white',
        position: 'relative',
        zIndex: 1,
        border: '3px solid rgba(34, 197, 94, 0.6)',
    },
    name: {
        color: 'white',
        fontSize: 22,
        fontWeight: 700,
        margin: '0 0 6px',
        fontFamily: 'Inter, sans-serif',
    },
    subtext: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        margin: '0 0 4px',
    },
    countdown: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        marginBottom: 32,
    },
    buttonRow: {
        display: 'flex',
        justifyContent: 'center',
        gap: 40,
    },
    rejectBtn: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    },
    acceptBtn: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    },
};
