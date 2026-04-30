import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
    Calendar, Clock, CheckCircle, XCircle, ChevronLeft,
    CalendarDays, AlertCircle, Loader2, Video, Send,
    Sparkles, MessageCircle, Coins, Timer,
} from 'lucide-react';
import { getStoredAuthUser, updateStoredAuthUser } from '../services/auth';
import {
    createBooking, getAvailableSlots,
    type Booking, type BookingType,
} from '../services/booking';

/* ── Helpers ───────────────────────────────────────────────────── */

const DAYS_AHEAD = 14;
const DURATION_OPTIONS = [30, 60, 90, 120];

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

function addDays(base: string, n: number) {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

function formatDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}

function formatTime24to12(time24: string | undefined | null) {
    if (!time24 || !time24.includes(':')) return time24 ?? '--:--';
    const [h, m] = time24.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return time24;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

/* ── Animation variants ─────────────────────────────────────── */
const slotVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

/* ═══════════════════════════════════════════════════════════════ */
export function BookSession() {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());

    const today = getTodayStr();
    const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));

    /* ── State: shared ── */
    const [bookingMode, setBookingMode] = useState<'slots' | 'request'>('slots');
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [bookedResult, setBookedResult] = useState<Booking | null>(null);
    const [estimatedCreditsResult, setEstimatedCreditsResult] = useState(0);

    /* ── State: slots mode ── */
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    /* ── State: request mode ── */
    const [requestDate, setRequestDate] = useState(today);
    const [requestTime, setRequestTime] = useState('09:00');
    const [requestMessage, setRequestMessage] = useState('');

    /* ── State: duration & credits ── */
    const [sessionDuration, setSessionDuration] = useState(30);
    const [teacherCreditRate, setTeacherCreditRate] = useState(30);

    const studentCredits = currentUser?.learningCredits ?? 0;
    const creditsRequired = useMemo(
        () => Math.ceil(sessionDuration / teacherCreditRate),
        [sessionDuration, teacherCreditRate],
    );
    const hasEnoughCredits = studentCredits >= creditsRequired;

    /* Load available slots whenever date changes */
    useEffect(() => {
        if (!teacherId || bookingMode !== 'slots') return;
        let mounted = true;
        setSlotsLoading(true);
        setSlotsError(null);
        setSelectedTime(null);

        getAvailableSlots(teacherId, selectedDate)
            .then((res) => {
                if (mounted) {
                    setSlots(res.availableSlots);
                    if (res.creditRate) setTeacherCreditRate(res.creditRate);
                }
            })
            .catch((err) => { if (mounted) setSlotsError(err instanceof Error ? err.message : 'Could not load slots.'); })
            .finally(() => { if (mounted) setSlotsLoading(false); });

        return () => { mounted = false; };
    }, [teacherId, selectedDate, bookingMode]);

    async function handleBook(type: BookingType) {
        if (!teacherId || !currentUser) return;

        const date = type === 'slot' ? selectedDate : requestDate;
        const time = type === 'slot' ? selectedTime : requestTime;
        if (!time) return;

        /* ── frontend past-time guard ── */
        const scheduledAt = new Date(`${date}T${time}:00`);
        if (scheduledAt.getTime() <= Date.now()) {
            setBookingError('This time is in the past. Please select a future time.');
            return;
        }

        setBooking(true);
        setBookingError(null);

        try {
            const res = await createBooking({
                teacherId,
                studentId: currentUser.id,
                date,
                time,
                sessionDuration,
                bookingType: type,
                message: type === 'request' ? requestMessage.trim() : undefined,
            });
            setBookedResult(res.booking);
            setEstimatedCreditsResult(res.estimatedCredits);

            if (!res.hasEnoughCredits) {
                setBookingError(`Low balance note: you have ${res.studentCredits} credit${res.studentCredits !== 1 ? 's' : ''} right now, but your request still goes through. Credits are deducted only after the session ends.`);
            }
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    }

    /* ── Success screen ── */
    if (bookedResult) {
        const isRequest = bookedResult.bookingType === 'request';
        return (
            <div className="min-h-screen pt-[73px] flex items-center justify-center px-4"
                style={{ background: 'linear-gradient(160deg,#f0f9f9 0%,#f8fafc 50%,#f5f3ff 100%)' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border"
                    style={{ borderColor: 'rgba(122,184,186,0.3)' }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{
                            background: isRequest
                                ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)'
                                : 'linear-gradient(135deg,#7ab8ba,#5a9fa1)'
                        }}
                    >
                        {isRequest
                            ? <Send className="w-10 h-10 text-white" />
                            : <CheckCircle className="w-10 h-10 text-white" />}
                    </motion.div>

                    <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
                        {isRequest ? 'Request Sent!' : 'Session Booked!'}
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-4">
                        {isRequest
                            ? <>Your request for <strong>{formatDate(bookedResult.date)}</strong> at <strong>{formatTime24to12(bookedResult.time)}</strong> has been sent. The teacher will accept or decline.</>
                            : <>Your session on <strong>{formatDate(bookedResult.date)}</strong> at <strong>{formatTime24to12(bookedResult.time)}</strong> is pending confirmation.</>}
                    </p>

                    {/* Credit summary */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="px-4 py-2 rounded-xl text-sm"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Coins className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                            <span className="text-amber-700 font-semibold">~{estimatedCreditsResult} credit{estimatedCreditsResult !== 1 ? 's' : ''} estimated</span>
                        </div>
                        <div className="px-4 py-2 rounded-xl text-sm"
                            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <Timer className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                            <span className="text-emerald-700 font-semibold">Charged after session</span>
                        </div>
                    </div>

                    {bookedResult.message && (
                        <div className="p-4 rounded-2xl mb-6 text-left text-sm"
                            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-1">
                                <MessageCircle className="w-3 h-3" /> Your message
                            </div>
                            <p className="text-[var(--foreground)]">{bookedResult.message}</p>
                        </div>
                    )}

                    <div className="p-4 rounded-2xl mb-6 text-left"
                        style={{ background: 'rgba(122,184,186,0.08)', border: '1px solid rgba(122,184,186,0.2)' }}>
                        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
                            <Video className="w-4 h-4 text-[#7ab8ba]" />
                            <span className="font-mono text-xs break-all">{bookedResult.channelName}</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">Video call channel — available once the teacher confirms.</p>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => navigate('/student-dashboard/bookings')}
                            className="flex-1 py-3 rounded-xl text-white font-medium"
                            style={{ background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)' }}>
                            View My Bookings
                        </button>
                        <button type="button" onClick={() => navigate('/student-dashboard')}
                            className="flex-1 py-3 rounded-xl border font-medium text-[var(--foreground)]"
                            style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                            Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ── Credit balance bar component ── */
    const CreditBar = () => (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border shadow-sm mb-6"
            style={{ borderColor: 'rgba(122,184,186,0.25)' }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(122,184,186,0.1)' }}>
                        <Coins className="w-5 h-5" style={{ color: '#7ab8ba' }} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-[var(--foreground)]">
                            {studentCredits} credit{studentCredits !== 1 ? 's' : ''} available
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                            Teacher rate: {teacherCreditRate} min per credit
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: '#7ab8ba' }}>
                        ~{creditsRequired}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">estimated cost</div>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(122,184,186,0.06)', color: '#5a9fa1' }}>
                <Timer className="w-3.5 h-3.5 flex-shrink-0" />
                Credits are charged after the session based on actual call duration.
            </div>
            {!hasEnoughCredits && (
                <div className="mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.06)', color: '#d97706' }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Low balance — you may need more credits for a full session.
                </div>
            )}
        </motion.div>
    );

    /* ── Duration selector component ── */
    const DurationSelector = () => (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border shadow-sm mb-6"
            style={{ borderColor: 'rgba(122,184,186,0.2)' }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Timer className="w-4 h-4 text-[#7ab8ba]" />
                <h2 className="font-semibold text-[var(--foreground)]">Session Duration</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((dur) => {
                    const isSelected = sessionDuration === dur;
                    const cost = Math.ceil(dur / teacherCreditRate);
                    return (
                        <motion.button
                            key={dur}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => setSessionDuration(dur)}
                            className="flex flex-col items-center py-3 rounded-xl text-sm font-medium transition-all"
                            style={isSelected
                                ? { background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)', color: '#fff', boxShadow: '0 4px 16px rgba(122,184,186,0.4)' }
                                : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                        >
                            <span className="text-base font-bold">{dur}</span>
                            <span className="text-[10px] opacity-80">min</span>
                            <span className="text-[10px] mt-1 opacity-70">
                                {cost} cr{cost !== 1 ? 's' : ''}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );

    /* ── Main booking form ── */
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

                {/* Back button */}
                <motion.button
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6 hover:text-[var(--foreground)] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-3xl overflow-hidden mb-8 p-8 shadow-xl"
                    style={{ background: 'linear-gradient(135deg,#1a2332 0%,#273447 40%,#1a3a3c 100%)' }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(122,184,186,0.2)' }}>
                            <CalendarDays className="w-5 h-5 text-[#7ab8ba]" />
                        </div>
                        <h1 className="text-white text-2xl font-semibold">Book a Session</h1>
                    </div>
                    <p className="text-white/60 text-sm">Choose duration, pick a time slot, and pay with credits.</p>
                </motion.div>

                {/* Credit balance */}
                <CreditBar />

                {/* Duration selector */}
                <DurationSelector />

                {/* ── Mode toggle ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex gap-2 mb-6"
                >
                    {([
                        { key: 'slots' as const, label: 'Available Slots', icon: Clock, color: '#7ab8ba' },
                        { key: 'request' as const, label: 'Request Custom Time', icon: Sparkles, color: '#8b5cf6' },
                    ] as const).map(({ key, label, icon: Icon, color }) => {
                        const active = bookingMode === key;
                        return (
                            <motion.button key={key}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => { setBookingMode(key); setBookingError(null); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all"
                                style={active
                                    ? { background: `linear-gradient(135deg,${color},${color}cc)`, color: '#fff', boxShadow: `0 4px 20px ${color}40` }
                                    : { background: 'white', color: 'var(--muted-foreground)', border: '1px solid rgba(0,0,0,0.07)' }}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                <AnimatePresence mode="wait">
                    {bookingMode === 'slots' ? (
                        <motion.div key="slots"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* ── Date picker strip ── */}
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border shadow-sm"
                                style={{ borderColor: 'rgba(122,184,186,0.2)' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-4 h-4 text-[#7ab8ba]" />
                                    <h2 className="font-semibold text-[var(--foreground)]">Select Date</h2>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {dates.map((d) => {
                                        const isSelected = d === selectedDate;
                                        const dateObj = new Date(d + 'T00:00:00');
                                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                                        const dayNum = dateObj.getDate();
                                        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                                        return (
                                            <motion.button key={d}
                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                                                onClick={() => setSelectedDate(d)}
                                                className="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl min-w-[64px] transition-all"
                                                style={isSelected
                                                    ? { background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)', color: '#fff', boxShadow: '0 4px 20px rgba(122,184,186,0.4)' }
                                                    : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                                            >
                                                <span className="text-[10px] font-medium opacity-70">{dayName}</span>
                                                <span className="text-lg font-semibold">{dayNum}</span>
                                                <span className="text-[10px] font-medium opacity-70">{monthName}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Time slots ── */}
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border shadow-sm"
                                style={{ borderColor: 'rgba(122,184,186,0.2)' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-[#7ab8ba]" />
                                    <h2 className="font-semibold text-[var(--foreground)]">Available Slots</h2>
                                    <span className="ml-auto text-xs text-[var(--muted-foreground)]">{formatDate(selectedDate)}</span>
                                </div>

                                {slotsLoading ? (
                                    <div className="flex items-center justify-center py-10 gap-2 text-[var(--muted-foreground)]">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Loading slots…</span>
                                    </div>
                                ) : slotsError ? (
                                    <div className="flex items-center gap-2 py-6 justify-center text-sm text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        {slotsError}
                                    </div>
                                ) : slots.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                            style={{ background: 'rgba(122,184,186,0.1)' }}>
                                            <CalendarDays className="w-6 h-6 text-[var(--muted-foreground)]" />
                                        </div>
                                        <p className="text-[var(--muted-foreground)] text-sm mb-2">No slots available for this date.</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">
                                            Try another day, or switch to <button type="button"
                                                onClick={() => setBookingMode('request')}
                                                className="underline text-[#8b5cf6] font-medium">Request Custom Time</button>.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        <AnimatePresence mode="popLayout">
                                            {slots.map((slot) => {
                                                const isSelected = slot === selectedTime;
                                                const isPast = selectedDate === new Date().toISOString().split('T')[0]
                                                    && new Date(`${selectedDate}T${slot}:00`).getTime() <= Date.now();
                                                return (
                                                    <motion.button key={slot}
                                                        variants={slotVariants}
                                                        initial="hidden" animate="visible"
                                                        exit={{ opacity: 0, scale: 0.85 }}
                                                        whileHover={isPast ? {} : { scale: 1.05 }} whileTap={isPast ? {} : { scale: 0.95 }}
                                                        onClick={() => !isPast && setSelectedTime(isSelected ? null : slot)}
                                                        disabled={isPast}
                                                        className="py-3 rounded-xl text-sm font-medium transition-all"
                                                        style={isPast
                                                            ? { background: 'rgba(239,68,68,0.06)', color: 'rgba(156,163,175,0.6)', textDecoration: 'line-through', cursor: 'not-allowed' }
                                                            : isSelected
                                                                ? { background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)', color: '#fff', boxShadow: '0 4px 16px rgba(122,184,186,0.4)' }
                                                                : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                                                    >
                                                        {formatTime24to12(slot)}
                                                    </motion.button>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* ── Confirm button ── */}
                            <AnimatePresence>
                                {selectedTime && (
                                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                        {bookingError && (
                                            <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                                                <XCircle className="w-4 h-4 flex-shrink-0" />
                                                {bookingError}
                                            </div>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(122,184,186,0.5)' }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleBook('slot')}
                                            disabled={booking}
                                            className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                            style={{ background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)' }}
                                        >
                                            {booking ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Booking…</>
                                            ) : (
                                                <><CheckCircle className="w-5 h-5" /> Confirm · {formatDate(selectedDate)} at {formatTime24to12(selectedTime)} · ~{creditsRequired} cr</>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        /* ── Request Custom Time mode ── */
                        <motion.div key="request"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border shadow-sm"
                                style={{ borderColor: 'rgba(139,92,246,0.2)' }}>

                                {/* Info banner */}
                                <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
                                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                    <Sparkles className="w-5 h-5 text-[#8b5cf6] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--foreground)] mb-1">Request a Custom Time</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">
                                            Pick any date and time. If your balance is low, the request still goes through — credits are deducted after the session ends.
                                        </p>
                                    </div>
                                </div>

                                {/* Date + Time inputs */}
                                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5 font-medium">
                                            <Calendar className="w-3 h-3 inline mr-1" /> Preferred Date
                                        </label>
                                        <input type="date" value={requestDate}
                                            min={today}
                                            onChange={(e) => setRequestDate(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#8b5cf6]/30"
                                            style={{ borderColor: 'rgba(139,92,246,0.25)', background: '#faf9ff', caretColor: '#8b5cf6' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5 font-medium">
                                            <Clock className="w-3 h-3 inline mr-1" /> Preferred Time
                                        </label>
                                        <input type="time" value={requestTime}
                                            step="1800"
                                            onChange={(e) => setRequestTime(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#8b5cf6]/30"
                                            style={{ borderColor: 'rgba(139,92,246,0.25)', background: '#faf9ff', caretColor: '#8b5cf6' }}
                                        />
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="mb-2">
                                    <label className="block text-xs text-[var(--muted-foreground)] mb-1.5 font-medium">
                                        <MessageCircle className="w-3 h-3 inline mr-1" /> Message to Teacher (optional)
                                    </label>
                                    <textarea value={requestMessage}
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Let the teacher know what you'd like to learn, your level, or any scheduling notes…"
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-[#8b5cf6]/30"
                                        style={{ borderColor: 'rgba(139,92,246,0.25)', background: '#faf9ff', caretColor: '#8b5cf6' }}
                                    />
                                    <div className="flex justify-end mt-1">
                                        <span className="text-[10px] text-[var(--muted-foreground)]">{requestMessage.length}/500</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Summary + Send button ── */}
                            {bookingError && (
                                <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    {bookingError}
                                </div>
                            )}

                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border shadow-sm"
                                style={{ borderColor: 'rgba(139,92,246,0.18)' }}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                                        <Calendar className="w-4 h-4 text-[#8b5cf6]" />
                                        <span className="font-medium">{formatDate(requestDate)}</span>
                                    </div>
                                    <div className="w-px h-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
                                    <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                                        <Clock className="w-4 h-4 text-[#8b5cf6]" />
                                        <span className="font-medium">{formatTime24to12(requestTime)}</span>
                                    </div>
                                    <div className="w-px h-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
                                    <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                                        <Coins className="w-4 h-4 text-amber-500" />
                                        <span className="font-medium">{creditsRequired} credit{creditsRequired !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleBook('request')}
                                    disabled={booking || !requestDate || !requestTime}
                                    className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}
                                >
                                    {booking ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending Request…</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> Send Request · ~{creditsRequired} cr</>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
