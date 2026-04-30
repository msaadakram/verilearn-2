import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
    Calendar, Clock, Video, CheckCircle, XCircle,
    Loader2, AlertCircle, CalendarDays, ChevronRight, Coins, Timer,
} from 'lucide-react';
import { getStoredAuthUser } from '../services/auth';
import {
    getMyBookings, cancelBooking,
    type Booking, type BookingStatus,
} from '../services/booking';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCall } from '../context/CallContext';
import { BookingPagination } from '../components/BookingPagination';

const BOOKINGS_PER_PAGE = 10;

const STATUS_META: Record<BookingStatus, { label: string; bg: string; color: string }> = {
    pending: { label: 'Pending', bg: 'rgba(245,158,11,0.08)', color: '#d97706' },
    accepted: { label: 'Accepted', bg: 'rgba(59,130,246,0.08)', color: '#2563eb' },
    ongoing: { label: 'In Session', bg: 'rgba(16,185,129,0.08)', color: '#059669' },
    completed: { label: 'Completed', bg: 'rgba(107,114,128,0.08)', color: '#6b7280' },
    cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.08)', color: '#dc2626' },
    declined: { label: 'Declined', bg: 'rgba(239,68,68,0.08)', color: '#dc2626' },
};

const FILTER_OPTS: { label: string; value: BookingStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

function getParticipantName(p: Booking['teacherId'] | Booking['studentId']) {
    return typeof p === 'string' ? '—' : (p as { name: string }).name;
}
function getParticipantAvatar(p: Booking['teacherId'] | Booking['studentId']) {
    if (typeof p === 'string') return '';
    const obj = p as { avatarUrl?: string };
    return obj.avatarUrl || '';
}

/* ═══════════════════════════════════════════════════════════════════ */

function SessionCountdown({ booking }: { booking: Booking }) {
    const { joinSessionCall } = useCall();
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [canJoin, setCanJoin] = useState(false);

    useEffect(() => {
        const check = () => {
            const now = Date.now();
            const scheduled = new Date(`${booking.date}T${booking.time}`).getTime();
            const diff = scheduled - now;
            if (diff <= 5 * 60 * 1000) {
                setCanJoin(true);
                setTimeLeft(null);
            } else if (diff < 3600000) {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${mins}m ${secs}s`);
            } else {
                const hrs = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                setTimeLeft(`${hrs}h ${mins}m`);
            }
        };
        check();
        const interval = setInterval(check, 1000);
        return () => clearInterval(interval);
    }, [booking.date, booking.time]);

    if (canJoin) {
        return (
            <motion.button
                onClick={() => void joinSessionCall(booking.channelName, booking._id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white font-medium"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
            >
                <Video className="w-3.5 h-3.5" />
                Join Session
            </motion.button>
        );
    }

    return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Clock className="w-3 h-3" />
            {timeLeft ? `Starts in ${timeLeft}` : 'Upcoming'}
        </span>
    );
}

export function StudentBookings() {
    const currentUser = getStoredAuthUser();
    const isTeacher = currentUser?.profession === 'teacher';

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const loadBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getMyBookings();
            setBookings(res.bookings);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadBookings(); }, []);

    const filtered = useMemo(
        () => (filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)),
        [bookings, filter],
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / BOOKINGS_PER_PAGE));

    const pagedBookings = useMemo(() => {
        const start = (currentPage - 1) * BOOKINGS_PER_PAGE;
        return filtered.slice(start, start + BOOKINGS_PER_PAGE);
    }, [currentPage, filtered]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    async function handleCancel(bookingId: string) {
        setCancelling(bookingId);
        setCancelError(null);
        try {
            await cancelBooking(bookingId);
            setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
        } catch (err) {
            setCancelError(err instanceof Error ? err.message : 'Cancellation failed.');
        } finally {
            setCancelling(null);
        }
    }

    return (
        <div className="min-h-screen pt-[73px]"
            style={{ background: 'linear-gradient(160deg,#f0f9f9 0%,#f8fafc 50%,#f5f3ff 100%)' }}>

            {/* Decorative orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle,#7ab8ba 0%,transparent 70%)' }} />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle,#8b5cf6 0%,transparent 70%)' }} />
            </div>

            <div className="relative max-w-3xl mx-auto px-6 py-10" style={{ zIndex: 1 }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="rounded-3xl overflow-hidden mb-8 p-8 shadow-xl"
                    style={{ background: 'linear-gradient(135deg,#1a2332 0%,#273447 40%,#1a3a3c 100%)' }}
                >
                    {/* sparkle dots */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <motion.div key={i}
                                animate={{ opacity: [0, 1, 0], y: [0, -8, 0] }}
                                transition={{ duration: 3 + i * 0.6, repeat: Infinity, delay: i * 0.5 }}
                                className="absolute w-1 h-1 rounded-full bg-white"
                                style={{ left: `${15 + i * 14}%`, top: `${25 + (i % 3) * 25}%` }} />
                        ))}
                    </div>
                    <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(122,184,186,0.2)' }}>
                            <CalendarDays className="w-5 h-5 text-[#7ab8ba]" />
                        </div>
                        <div>
                            <h1 className="text-white text-2xl font-semibold">My Bookings</h1>
                            <p className="text-white/50 text-sm">Track and manage your scheduled sessions</p>
                        </div>
                    </div>
                </motion.div>

                {/* Filter pills */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex gap-2 flex-wrap mb-6"
                >
                    {FILTER_OPTS.map((opt) => {
                        const isActive = filter === opt.value;
                        return (
                            <motion.button
                                key={opt.value}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setFilter(opt.value as BookingStatus | 'all')}
                                className="px-4 py-1.5 rounded-full text-sm transition-all relative overflow-hidden"
                                style={
                                    isActive
                                        ? { background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)', color: '#fff', boxShadow: '0 4px 16px rgba(122,184,186,0.35)' }
                                        : { background: 'white', color: 'var(--muted-foreground)', border: '1px solid rgba(0,0,0,0.07)' }
                                }
                            >
                                {opt.label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                {cancelError && (
                    <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                        <XCircle className="w-4 h-4" />
                        {cancelError}
                    </div>
                )}

                {/* Bookings list */}
                {loading ? (
                    <div className="flex items-center justify-center py-24 gap-2 text-[var(--muted-foreground)]">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading bookings…
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 justify-center py-16 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                            style={{ background: 'rgba(122,184,186,0.1)' }}>
                            <CalendarDays className="w-8 h-8 text-[var(--primary)]" />
                        </div>
                        <h3 className="text-[var(--foreground)] mb-2">No bookings found</h3>
                        <p className="text-[var(--muted-foreground)] text-sm mb-6">
                            {filter === 'all' ? "You haven't booked any sessions yet." : `No ${filter} bookings.`}
                        </p>
                        {!isTeacher && (
                            <Link to="/student-dashboard">
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-6 py-2.5 rounded-xl text-white font-medium"
                                    style={{ background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)' }}
                                >
                                    Browse Tutors
                                </motion.button>
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                        className="space-y-4"
                    >
                        <AnimatePresence mode="popLayout">
                            {pagedBookings.map((b) => {
                                const meta = STATUS_META[b.status] || { label: b.status, bg: 'rgba(107,114,128,0.08)', color: '#6b7280' };
                                const teacher = b.teacherId;
                                const student = b.studentId;
                                const other = isTeacher ? student : teacher;
                                const canCancel = b.status === 'pending' || b.status === 'accepted';
                                const canJoin = b.status === 'accepted' || b.status === 'ongoing';

                                return (
                                    <motion.div
                                        key={b._id}
                                        layout
                                        variants={{
                                            hidden: { opacity: 0, y: 16 },
                                            visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
                                        }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border shadow-sm"
                                        style={{ borderColor: 'rgba(122,184,186,0.18)' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                                <ImageWithFallback
                                                    src={getParticipantAvatar(other)}
                                                    alt={getParticipantName(other)}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Top row: name + status badge */}
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-semibold text-[var(--foreground)] truncate">
                                                        {getParticipantName(other)}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                                                        style={{ background: meta.bg, color: meta.color }}>
                                                        {meta.label}
                                                    </span>
                                                </div>

                                                {/* Date + time + duration */}
                                                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)] mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {b.time}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Timer className="w-3.5 h-3.5" />
                                                        {b.sessionDuration} min
                                                    </span>
                                                </div>

                                                {/* Completed: show credits used */}
                                                {b.status === 'completed' && b.creditsUsed > 0 && (
                                                    <div className="flex items-center gap-3 mb-3 text-xs">
                                                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                                            style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706' }}>
                                                            <Coins className="w-3 h-3" />
                                                            {b.creditsUsed} credit{b.creditsUsed !== 1 ? 's' : ''}
                                                        </span>
                                                        {b.actualDuration > 0 && (
                                                            <span className="text-[var(--muted-foreground)]">
                                                                {b.actualDuration} min actual
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Channel name */}
                                                <div className="flex items-center gap-1.5 mb-4 text-xs text-[var(--muted-foreground)]">
                                                    <Video className="w-3.5 h-3.5 text-[#7ab8ba]" />
                                                    <span className="font-mono truncate">{b.channelName}</span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {canJoin && (
                                                        <SessionCountdown booking={b} />
                                                    )}

                                                    {b.status === 'pending' && (
                                                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs"
                                                            style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1px solid rgba(245,158,11,0.15)' }}>
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Awaiting teacher response
                                                        </span>
                                                    )}

                                                    {canCancel && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => handleCancel(b._id)}
                                                            disabled={cancelling === b._id}
                                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors disabled:opacity-60"
                                                            style={{ borderColor: 'rgba(239,68,68,0.25)', color: '#dc2626', background: 'rgba(239,68,68,0.04)' }}
                                                        >
                                                            {cancelling === b._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                            Cancel
                                                        </motion.button>
                                                    )}

                                                    {b.status === 'completed' && (
                                                        <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                            Session completed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0 mt-1" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        <BookingPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
