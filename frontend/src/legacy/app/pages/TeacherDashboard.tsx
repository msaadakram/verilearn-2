import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, ShieldAlert, ShieldX, BadgeCheck, Star, Zap,
  Brain, Play, RotateCcw, Target, TrendingUp,
  Edit3, Save, X, User, Code2, Clock, DollarSign, CheckCircle,
  MessageCircle, Bell, Eye, ChevronDown, AlertCircle,
  BookOpen, Sparkles, Award, GraduationCap, Users,
  Layers, ArrowRight, Flame, Upload, Calendar, Loader2, Shield,
  LayoutDashboard, Video, Timer, Coins,
} from 'lucide-react';
import { useCall } from '../context/CallContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { TeacherOnboardingQuiz } from '../components/TeacherOnboardingQuiz';
import { TutorBadge } from '../components/TutorBadge';
import { SessionTierBadge } from '../components/SessionTierBadge';
import DateTimeBadge from '../components/DateTimeBadge';
import { useCnic } from '../context/CnicContext';
import { useQuiz, BADGE_META, type BadgeTier } from '../context/QuizContext';
import {
  AUTH_SESSION_CHANGED_EVENT,
  getStoredAuthUser,
  getTeacherOnboardingStatus,
  syncAccountModeForDashboard,
  submitTeacherAssessment,
  updateStoredAuthUser,
  updateTeacherSubjects,
  type TeacherOnboardingState,
} from '../services/auth';
import {
  getMyBookings, acceptBooking as apiAcceptBooking, declineBooking as apiDeclineBooking, cancelBooking as apiCancelBooking,
  type Booking, type BookingParticipant,
  getTeacherReviews,
  type TeacherReview,
  type TeacherReviewDistributionItem,
} from '../services/booking';
import { Button } from '../components/ui/button';
import { getSessionTier } from '../utils/sessionTier';

const BOOKINGS_PER_PAGE = 10;

/* ── Types ─────────────────────────────────── */
type BadgeStatus = 'Not Verified' | 'Verified' | 'Expert';
type Difficulty = 'Low' | 'Medium' | 'High';

/* ── Mock data ─────────────────────────────── */
const TUTOR = {
  name: 'Dr. Sarah Johnson',
  title: 'Full Stack Developer & Educator',
  avatar: 'https://images.unsplash.com/photo-1586448325968-5ec7ba1da737?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0dXRvciUyMHRlYWNoZXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzY3NzIzOTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  rating: 4.9,
  totalStudents: 128,
  sessionsCompleted: 342,
};

const SKILLS = ['React', 'Python', 'Node.js', 'TypeScript', 'Machine Learning', 'Web Design', 'Data Science', 'Java'];

const STUDENT_INQUIRIES = [
  { id: '1', name: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', subject: 'Full Stack Development', message: 'Hi! I saw your profile and I\'m really interested in your React course. Can we schedule a trial session?', time: '2 min ago', isNew: true },
  { id: '2', name: 'Priya Patel', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', subject: 'Python for Beginners', message: 'I am completely new to programming. Do you offer beginner-friendly sessions?', time: '18 min ago', isNew: true },
  { id: '3', name: 'James Liu', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', subject: 'Data Science', message: 'Looking for help with my capstone ML project. Are you available this weekend?', time: '1 hr ago', isNew: false },
];

const ACTIVE_CHATS = [
  { id: 'michael-chen', name: 'Michael Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', subject: 'Node.js & APIs', lastMsg: 'Got it! I\'ll try that approach and report back.', time: '5 min ago', unread: 2 },
  { id: 'emily-rodriguez', name: 'Emily Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', subject: 'TypeScript Advanced', lastMsg: 'Thank you for the explanation on generics!', time: '1 hr ago', unread: 0 },
  { id: 'david-kim', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', subject: 'React Hooks', lastMsg: 'Can we reschedule to 4 PM tomorrow?', time: 'Yesterday', unread: 1 },
];

const TEACHER_SUBJECT_OPTIONS = [
  'English',
  'Python',
  'C++',
  'Node.js',
  'JavaScript',
  'Blender',
  'Selenium Automation',
  'C Language',
  'Java',
];

/* ── Variants ──────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};

/* ══════════════════════════════════════════════════════════ */
export function TeacherDashboard() {
  /* Verification — driven by global CnicContext */
  const { cnicStatus } = useCnic();
  const { getQuizzesByTeacher, results } = useQuiz();
  const myQuizzes = getQuizzesByTeacher('sarah-johnson');
  const [badgeStatus] = useState<BadgeStatus>('Verified');
  const { joinSessionCall } = useCall();

  /* Assessment */
  const [currentSkill, setCurrentSkill] = useState('Python');
  const [difficulty] = useState<Difficulty>('Medium');
  const [latestScore] = useState(82);
  const [accuracy] = useState(78);
  const [testStarted, setTestStarted] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const [modeSyncing, setModeSyncing] = useState(false);
  const teacherAvatar = currentUser?.avatarUrl || TUTOR.avatar;
  const teacherName = currentUser?.name || TUTOR.name;
  const learningCredits = currentUser?.learningCredits ?? 10;
  const [onboarding, setOnboarding] = useState<TeacherOnboardingState | null>(
    currentUser?.teacherOnboarding || null,
  );
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [gateError, setGateError] = useState<string | null>(null);
  const [subjectSelection, setSubjectSelection] = useState<string[]>(currentUser?.teacherOnboarding?.subjects || []);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  /* Profile editing */
  const [editingProfile, setEditingProfile] = useState(false);
  const [bio, setBio] = useState('Passionate educator with 8+ years in software development. I specialise in breaking complex concepts into clear, hands-on lessons tailored to each student.');
  const [topSkill, setTopSkill] = useState('React');
  const [rate, setRate] = useState(15);
  const [availability, setAvailability] = useState<string[]>(['Mon', 'Wed', 'Fri', 'Sun']);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'Python', 'Node.js', 'TypeScript']);

  /* Inquiries expanded */
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>('1');

  /* Booking requests — live from API */
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);
  const [bookingPage, setBookingPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [teacherReviews, setTeacherReviews] = useState<TeacherReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{
    averageRating: number;
    totalReviews: number;
    distribution: TeacherReviewDistributionItem[];
  }>({
    averageRating: 0,
    totalReviews: 0,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percent: 0 })),
  });

  const formatReviewTime = (isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return 'Recently';
    }

    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sessionStats = useMemo(() => {
    const teacherId = currentUser?.id;

    if (!teacherId) {
      return {
        totalBookings: 0,
        completedSessions: 0,
        successfulSessions: 0,
        successRate: 0,
      };
    }

    const teacherBookings = bookingRequests.filter((booking) => {
      const bookingTeacherId = typeof booking.teacherId === 'string'
        ? booking.teacherId
        : booking.teacherId._id;

      return bookingTeacherId === teacherId;
    });

    const completedSessions = teacherBookings.filter((booking) => booking.status === 'completed').length;
    const successfulSessionsFromBookings = teacherBookings.filter(
      (booking) => booking.status === 'completed' && booking.studentJoined && booking.teacherJoined,
    ).length;
    const storedSuccessfulSessions = Number(currentUser?.teacherSessionStats?.successfulSessions) || 0;
    const successfulSessions = Math.max(successfulSessionsFromBookings, storedSuccessfulSessions);
    const totalSessionsForRate = Math.max(teacherBookings.length, successfulSessions);
    const successRate = totalSessionsForRate > 0
      ? Math.round((successfulSessions / totalSessionsForRate) * 100)
      : 0;

    return {
      totalBookings: teacherBookings.length,
      completedSessions,
      successfulSessions,
      successRate,
    };
  }, [bookingRequests, currentUser?.id]);
  const sessionTier = currentUser?.teacherSessionStats?.tier || getSessionTier(sessionStats.successfulSessions);

  const totalBookingPages = Math.max(1, Math.ceil(bookingRequests.length / BOOKINGS_PER_PAGE));

  const pagedBookingRequests = useMemo(() => {
    const start = (bookingPage - 1) * BOOKINGS_PER_PAGE;
    return bookingRequests.slice(start, start + BOOKINGS_PER_PAGE);
  }, [bookingPage, bookingRequests]);

  useEffect(() => {
    setBookingPage((page) => Math.min(page, totalBookingPages));
  }, [totalBookingPages]);

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await getMyBookings();
      // Show pending requests first, then others
      const sorted = [...res.bookings].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
      setBookingRequests(sorted);
    } catch {/* non-critical */ } finally {
      setBookingsLoading(false);
    }
  };

  const loadTeacherReviews = async (teacherId: string) => {
    setReviewsLoading(true);

    try {
      const response = await getTeacherReviews(teacherId);
      setTeacherReviews(response.reviews);
      setReviewSummary({
        averageRating: response.summary.averageRating,
        totalReviews: response.summary.totalReviews,
        distribution: [5, 4, 3, 2, 1].map((stars) => {
          const item = response.summary.distribution.find((entry) => entry.stars === stars);
          return item || { stars, count: 0, percent: 0 };
        }),
      });
    } catch {
      setTeacherReviews([]);
      setReviewSummary({
        averageRating: 0,
        totalReviews: 0,
        distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percent: 0 })),
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const acceptBooking = async (id: string) => {
    setBookingActionId(id);
    try {
      await apiAcceptBooking(id);
      setBookingRequests((prev) => prev.map((b) => b._id === id ? { ...b, status: 'accepted' } : b));
    } catch {/* show nothing */ } finally {
      setBookingActionId(null);
    }
  };

  const declineBooking = async (id: string) => {
    setBookingActionId(id);
    try {
      await apiDeclineBooking(id);
      setBookingRequests((prev) => prev.map((b) => b._id === id ? { ...b, status: 'declined' } : b));
    } catch {/* show nothing */ } finally {
      setBookingActionId(null);
    }
  };

  const cancelAcceptedBooking = async (id: string) => {
    setBookingActionId(id);
    try {
      await apiCancelBooking(id);
      setBookingRequests((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch {/* show nothing */ } finally {
      setBookingActionId(null);
    }
  };

  const refreshOnboardingStatus = async () => {
    setOnboardingLoading(true);
    setGateError(null);

    try {
      const response = await getTeacherOnboardingStatus();
      setOnboarding(response.onboarding);
      setSubjectSelection(response.onboarding.subjects || []);
      updateStoredAuthUser(response.user);
    } catch (error) {
      setGateError(error instanceof Error ? error.message : 'Failed to load teacher onboarding status.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  useEffect(() => {
    const syncStoredUser = () => {
      setCurrentUser(getStoredAuthUser());
    };

    syncStoredUser();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncStoredUser);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncStoredUser);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const storedUser = getStoredAuthUser();

      if (!storedUser) {
        return;
      }

      if (storedUser.profession === 'teacher') {
        setCurrentUser(storedUser);
        return;
      }

      setModeSyncing(true);

      try {
        const response = await syncAccountModeForDashboard('teacher');

        if (!mounted) {
          return;
        }

        setCurrentUser(response?.user || getStoredAuthUser());
      } catch {
        if (mounted) {
          setCurrentUser(getStoredAuthUser());
        }
      } finally {
        if (mounted) {
          setModeSyncing(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.profession !== 'teacher' || modeSyncing) {
      return;
    }

    void refreshOnboardingStatus();
    void loadBookings();
    void loadTeacherReviews(currentUser.id);
  }, [currentUser?.profession, modeSyncing]);

  const SessionJoinButton = ({ booking }: { booking: Booking }) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [canJoin, setCanJoin] = useState(false);

    useEffect(() => {
      const check = () => {
        const now = Date.now();
        const scheduled = new Date(`${booking.date}T${booking.time}`).getTime();
        const diff = scheduled - now;
        // Allow joining 5 minutes early
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
        <button
          onClick={() => void joinSessionCall(booking.channelName, booking._id)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', cursor: 'pointer' }}
        >
          <Video className="w-4 h-4" />
          Join Session
        </button>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400">
        <Clock className="w-4 h-4" />
        {timeLeft ? `Starts in ${timeLeft}` : 'Upcoming'}
      </span>
    );
  };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const profileCompletion = (() => {
    let score = 0;
    if (bio.trim()) score += 20;
    if (topSkill) score += 15;
    if (selectedSkills.length >= 3) score += 20;
    if (rate > 0) score += 15;
    if (availability.length > 0) score += 15;
    if (cnicStatus === 'Verified') score += 15;
    return score;
  })();

  if (modeSyncing) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
        <div className="px-6 py-5 rounded-2xl bg-white border border-[rgba(122,184,186,0.25)] shadow-sm text-sm text-[var(--muted-foreground)]">
          Switching to teacher mode…
        </div>
      </div>
    );
  }

  const toggleDay = (day: string) =>
    setAvailability((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length < 6 ? [...prev, skill] : prev
    );

  /* ── CNIC badge ── */
  const CnicBadge = () => {
    const map: Record<string, { icon: ReactNode; color: string; bg: string; desc: string }> = {
      'Not Submitted': { icon: <ShieldAlert className="w-5 h-5" />, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', desc: 'Submit your CNIC to unlock the Verified Tutor badge and build student trust.' },
      Pending: { icon: <AlertCircle className="w-5 h-5" />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Your CNIC is under review. This usually takes 1–2 business days.' },
      Verified: { icon: <ShieldCheck className="w-5 h-5" />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: 'Your identity has been verified. Students can trust your profile.' },
      Rejected: { icon: <ShieldX className="w-5 h-5" />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', desc: 'Verification failed. Please re-upload a clear photo of your CNIC.' },
    };
    const c = map[cnicStatus] ?? map['Not Submitted'];
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: c.bg, border: `1px solid ${c.color}30` }}>
        <span style={{ color: c.color }}>{c.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm" style={{ color: c.color, fontWeight: 600 }}>
              CNIC {cnicStatus === 'Not Submitted' ? 'Not Submitted' : cnicStatus}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">{c.desc}</p>
        </div>
      </div>
    );
  };

  /* ── Badge badge ── */
  const BadgeBadge = () => {
    const map: Record<BadgeStatus, { icon: ReactNode; color: string; bg: string; desc: string }> = {
      'Not Verified': { icon: <ShieldAlert className="w-5 h-5" />, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', desc: 'Complete a skill assessment to earn your badge.' },
      Verified: { icon: <BadgeCheck className="w-5 h-5" />, color: '#7ab8ba', bg: 'rgba(122,184,186,0.1)', desc: 'Skill verified. Earn Expert status by scoring 90%+ on Hard difficulty.' },
      Expert: { icon: <Star className="w-5 h-5" />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', desc: 'Expert badge awarded! You rank in the top 5% of tutors.' },
    };
    const c = map[badgeStatus];
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: c.bg, border: `1px solid ${c.color}30` }}>
        <span style={{ color: c.color }}>{c.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm" style={{ color: c.color, fontWeight: 600 }}>Badge: {badgeStatus}</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">{c.desc}</p>
        </div>
      </div>
    );
  };

  /* ── Difficulty pill ── */
  const diffColor: Record<Difficulty, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

  const isDashboardUnlocked = onboarding?.dashboardUnlocked === true;
  const cnicVerified = onboarding?.cnicVerified === true || cnicStatus === 'Verified';
  const subjectStepDone = onboarding?.subjectSelectionCompleted === true || (onboarding?.subjects?.length || 0) > 0;
  const subjectMin = onboarding?.subjectConstraints?.min ?? 1;
  const subjectMax = onboarding?.subjectConstraints?.max ?? 3;
  const passMinCorrect = onboarding?.passCriteria?.minimumCorrectAnswers ?? 8;
  const passTotalQuestions = onboarding?.passCriteria?.totalQuestions ?? 10;
  const profileCompleted = onboarding?.profileCompleted === true;
  const cooldownActive = onboarding?.cooldownActive === true;
  const cooldownRemainingMs = onboarding?.cooldownRemainingMs ?? 0;

  const handleSubjectToggle = (subject: string) => {
    setSubjectSelection((prev) => (
      prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : prev.length < subjectMax
          ? [...prev, subject]
          : prev
    ));
  };

  const handleSaveSubjects = async () => {
    setSavingSubjects(true);
    setGateError(null);

    try {
      const response = await updateTeacherSubjects(subjectSelection);
      setOnboarding(response.onboarding);
      updateStoredAuthUser(response.user);
    } catch (error) {
      setGateError(error instanceof Error ? error.message : 'Failed to save subject selection.');
    } finally {
      setSavingSubjects(false);
    }
  };

  const handleSubmitAssessment = async ({ correctAnswers, totalQuestions }: { correctAnswers: number; totalQuestions: number }) => {
    setSubmittingQuiz(true);
    setGateError(null);

    try {
      const response = await submitTeacherAssessment({
        correctAnswers,
        totalQuestions,
      });
      setOnboarding(response.onboarding);
      updateStoredAuthUser(response.user);
    } catch (error) {
      setGateError(error instanceof Error ? error.message : 'Failed to submit assessment.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (onboardingLoading) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
        <div className="px-6 py-5 rounded-2xl bg-white border border-[rgba(122,184,186,0.25)] shadow-sm text-sm text-[var(--muted-foreground)]">
          Loading teacher access status…
        </div>
      </div>
    );
  }

  if (!isDashboardUnlocked) {
    return (
      <div className="min-h-screen pt-[73px]"
        style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="bg-white/90 border rounded-3xl p-6 md:p-8"
            style={{ borderColor: 'rgba(122,184,186,0.3)', boxShadow: '0 8px 30px rgba(122,184,186,0.12)' }}>
            <h1 className="text-2xl text-[var(--foreground)] mb-2">Teacher Dashboard Locked</h1>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Complete the onboarding steps to unlock your teacher dashboard. Passing score is <strong>{passMinCorrect}/{passTotalQuestions}</strong>, then finish your profile.
            </p>

            {gateError && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
                {gateError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="p-4 rounded-2xl border" style={{ borderColor: 'rgba(122,184,186,0.25)', background: 'rgba(122,184,186,0.06)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>Step 1: CNIC verification</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">Current status: {cnicStatus}</div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: cnicVerified ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      color: cnicVerified ? '#10b981' : '#d97706',
                    }}>
                    {cnicVerified ? 'Completed' : 'Pending'}
                  </span>
                </div>
                {!cnicVerified && (
                  <Link to="/teacher-dashboard/verify-cnic"
                    className="inline-flex mt-3 items-center gap-2 px-4 py-2 rounded-xl text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                    Verify CNIC
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {cnicVerified && (
                <div className="p-4 rounded-2xl border" style={{ borderColor: 'rgba(122,184,186,0.25)', background: 'rgba(122,184,186,0.06)' }}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>Step 2: Select teaching subject(s)</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">Choose between {subjectMin} and {subjectMax} subjects.</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: subjectStepDone ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: subjectStepDone ? '#10b981' : '#d97706',
                      }}>
                      {subjectStepDone ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {TEACHER_SUBJECT_OPTIONS.map((subject) => {
                      const selected = subjectSelection.includes(subject);
                      return (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => handleSubjectToggle(subject)}
                          className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                          style={{
                            borderColor: selected ? '#7ab8ba' : 'rgba(122,184,186,0.25)',
                            background: selected ? 'rgba(122,184,186,0.16)' : 'white',
                            color: selected ? '#0f766e' : 'var(--foreground)',
                            fontWeight: selected ? 600 : 500,
                          }}
                        >
                          {subject}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-3">
                    Selected: {subjectSelection.length}/{subjectMax}
                  </div>
                  <button
                    type="button"
                    onClick={() => { void handleSaveSubjects(); }}
                    disabled={savingSubjects || subjectSelection.length < subjectMin || subjectSelection.length > subjectMax}
                    className="px-4 py-2 rounded-xl text-sm text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}
                  >
                    {savingSubjects ? 'Saving…' : 'Save subjects'}
                  </button>
                </div>
              )}

              {cnicVerified && subjectStepDone && (
                <div className="p-4 rounded-2xl border" style={{ borderColor: 'rgba(122,184,186,0.25)', background: 'rgba(122,184,186,0.06)' }}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>Step 3: Pass assessment ({passMinCorrect}/{passTotalQuestions})</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">Subject-wise MCQs are generated from your selected subjects only.</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: onboarding?.assessmentPassed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: onboarding?.assessmentPassed ? '#10b981' : '#d97706',
                      }}>
                      {onboarding?.assessmentPassed ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  {typeof onboarding?.assessment?.attemptedAt === 'string' && (
                    <div className="mb-3 text-xs text-[var(--muted-foreground)]">
                      Last attempt: {onboarding.assessment.correctAnswers}/{onboarding.assessment.totalQuestions} ({onboarding.assessment.scorePercent}%)
                    </div>
                  )}

                  <TeacherOnboardingQuiz
                    selectedSubjects={onboarding?.subjects || subjectSelection}
                    passMinCorrect={passMinCorrect}
                    totalQuestions={passTotalQuestions}
                    cooldownActive={cooldownActive}
                    cooldownRemainingMs={cooldownRemainingMs}
                    isSubmitting={submittingQuiz}
                    onSubmit={handleSubmitAssessment}
                  />
                </div>
              )}

              {cnicVerified && subjectStepDone && onboarding?.assessmentPassed && (
                <div className="p-4 rounded-2xl border" style={{ borderColor: 'rgba(122,184,186,0.25)', background: 'rgba(122,184,186,0.06)' }}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>Step 4: Complete your teacher profile</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">Required for 100%: title, bio, avatar, tagline, experience, subjects, skills, session types, languages, hourly rate, availability days, time slots, and education. Non-identity fields should not be left on defaults.</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: profileCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: profileCompleted ? '#10b981' : '#d97706',
                      }}>
                      {profileCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  {!profileCompleted && (
                    <Link to="/teacher-dashboard/edit-profile"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                      Complete profile
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => { void refreshOnboardingStatus(); }}
              className="text-sm px-4 py-2 rounded-xl border"
              style={{ borderColor: 'rgba(122,184,186,0.3)', color: 'var(--foreground)' }}
            >
              Refresh onboarding status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-[73px]"
      style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}
    >
      {/* Decorative orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="tgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a2332" strokeWidth="1" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#tgrid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10" style={{ zIndex: 1 }}>

        {/* ── Hero Banner ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1a2332 0%, #273447 40%, #1a3a3c 100%)',
          }}
        >
          {/* Orbs inside hero */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
              style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute -bottom-16 left-1/4 w-56 h-56 rounded-full"
              style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0, 1, 0], y: [0, -10, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
                className="absolute w-1 h-1 rounded-full bg-white"
                style={{ left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 25}%` }} />
            ))}
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-8">
            <div className="flex-1">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-3">
                <DateTimeBadge icon={<GraduationCap className="w-3 h-3 inline mr-1.5 text-[#7ab8ba]" />} />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-white mb-2" style={{ fontSize: '2rem', lineHeight: '1.2' }}>
                Welcome back, <span style={{ color: '#7ab8ba' }}>{teacherName}</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                className="text-white/60 mb-6">
                You have <span className="text-white">2 new inquiries</span> waiting.
              </motion.p>

              {/* Combined horizontal stats: Success Rate · Sessions Attended · Credits */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 text-white/80 text-sm backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                  {bookingsLoading ? '—' : `${sessionStats.successRate}%`} Success Rate
                </span>

                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 text-white/80 text-sm backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <CheckCircle className="w-3.5 h-3.5 text-purple-300" />
                  {bookingsLoading ? '—' : sessionStats.successfulSessions} Successful Sessions
                </span>

                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 text-white/80 text-sm backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span className="pl-0.5">{learningCredits} Credits</span>
                </span>

                <Link to="/teacher-dashboard/edit-profile">
                  <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border text-white text-sm backdrop-blur-sm hover:scale-105 transition-all shadow-sm"
                    style={{ background: 'rgba(122,184,186,0.3)', borderColor: 'rgba(122,184,186,0.5)', cursor: 'pointer' }}>
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* Avatar */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
              className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'conic-gradient(from 0deg, #7ab8ba, #8b5cf6, #7ab8ba)', padding: '2px', borderRadius: '50%' }} />
                <div className="relative w-20 h-20 rounded-full p-0.5"
                  style={{ background: 'conic-gradient(from 0deg, #7ab8ba, #8b5cf6, #7ab8ba)' }}>
                  <ImageWithFallback src={teacherAvatar} alt={teacherName}
                    className="w-full h-full rounded-full object-cover border-2 border-[#1a2332]" />
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#1a2332]" />
              </div>
              <div className="text-white hidden md:block">
                <div className="flex items-center gap-2 mb-1">
                  <span>{teacherName}</span>
                  <TutorBadge status={badgeStatus} size="sm" />
                  <SessionTierBadge tier={sessionTier} sessions={sessionStats.successfulSessions} size="sm" />
                </div>
                <div className="text-white/50 text-sm">{TUTOR.title}</div>
                <div className="mt-2 text-xs text-white/55">
                  {sessionStats.successfulSessions} successful sessions • {sessionTier} tier
                </div>
              </div>
            </motion.div>
          </div>
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #7ab8ba, transparent)' }} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Booking requests ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Booking requests</h2>
              {bookingsLoading && <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />}
            </div>
            <div className="space-y-3">
              {bookingRequests.length === 0 && !bookingsLoading && (
                <div className="p-4 rounded-2xl bg-white border text-sm text-[var(--muted-foreground)]">No booking requests yet.</div>
              )}
              {pagedBookingRequests.map((req) => {
                const studentObj: BookingParticipant | null = typeof req.studentId === 'object' && req.studentId !== null
                  ? req.studentId
                  : null;
                const studentName = studentObj?.name || 'Student';
                const studentAvatar = studentObj?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                const studentCreditsAtBooking = typeof req.studentCreditsAtBooking === 'number' ? req.studentCreditsAtBooking : null;
                const wasFreeAtBooking = studentCreditsAtBooking === 0;
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';
                const isDeclined = req.status === 'declined' || req.status === 'cancelled';
                const isLoading = bookingActionId === req._id;

                return (
                  <motion.div key={req._id} className="p-4 rounded-2xl bg-white border" variants={itemVariants}
                    style={{ borderColor: 'rgba(122,184,186,0.18)' }}>
                    <div className="flex items-start gap-4">
                      <img src={studentAvatar} alt={studentName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div>
                            <div className="text-sm font-semibold">{studentName}</div>
                            <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2 flex-wrap">
                              <span><Calendar className="w-3 h-3 inline mr-1" />{req.date} · <Clock className="w-3 h-3 inline mr-1" />{req.time}</span>
                              {req.bookingType === 'request' && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Custom Request</span>
                              )}
                              {wasFreeAtBooking && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                                  Student was free
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs flex-shrink-0">
                            {isPending && <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706' }}>Pending</span>}
                            {isAccepted && <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb' }}>Accepted</span>}
                            {req.status === 'ongoing' && <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}>In Session</span>}
                            {isDeclined && <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>Declined</span>}
                            {req.status === 'completed' && <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(107,114,128,0.08)', color: '#6b7280' }}>Completed</span>}
                          </div>
                        </div>
                        {req.message && (
                          <div className="px-3 py-2 rounded-lg mb-2 text-xs" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                            <span className="text-[var(--muted-foreground)]">Student: </span>
                            <span className="text-[var(--foreground)]">{req.message}</span>
                          </div>
                        )}
                        {/* Session info: duration + credits */}
                        {typeof req.sessionDuration === 'number' && (
                          <div className="flex items-center gap-2 mb-2 text-xs text-[var(--muted-foreground)]">
                            <Timer className="w-3 h-3" /> {req.sessionDuration} min session
                            {req.status === 'completed' && req.creditsUsed > 0 && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706' }}>
                                <Coins className="w-3 h-3" /> {req.creditsUsed} cr earned
                              </span>
                            )}
                            {studentCreditsAtBooking !== null && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(122,184,186,0.08)', color: '#0f766e' }}>
                                <Shield className="w-3 h-3" />
                                {wasFreeAtBooking ? '0 credits at request time' : `${studentCreditsAtBooking} credits at request time`}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-[var(--muted-foreground)] mb-3 font-mono truncate">{req.channelName}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPending && (
                            <>
                              <button type="button" onClick={() => { void acceptBooking(req._id); }}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)' }}>
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Accept
                              </button>
                              <button type="button" onClick={() => { void declineBooking(req._id); }}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border disabled:opacity-50"
                                style={{ border: '1px solid rgba(0,0,0,0.08)', background: 'white' }}>
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5 text-gray-500" />}
                                Decline
                              </button>
                            </>
                          )}
                          {isAccepted && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <SessionJoinButton booking={req} />
                              <button type="button" onClick={() => { void cancelAcceptedBooking(req._id); }}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border disabled:opacity-50"
                                style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'white', color: '#dc2626' }}>
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                Cancel request
                              </button>
                            </div>
                          )}
                          {isDeclined && (
                            <span className="text-xs text-red-500">Declined</span>
                          )}
                          <Link to={`/messages/${studentObj?._id || (typeof req.studentId === 'string' ? req.studentId : '')}`}>
                            <button type="button" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border hover:bg-gray-50 transition-colors" style={{ border: '1px solid rgba(0,0,0,0.08)', background: 'white' }}>
                              <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
                              Message
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {totalBookingPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBookingPage((page) => Math.max(1, page - 1))}
                    disabled={bookingPage === 1}
                    className="gap-1.5"
                  >
                    <span>Previous</span>
                  </Button>

                  {Array.from({ length: totalBookingPages }, (_, index) => {
                    const page = index + 1;
                    const isActive = page === bookingPage;

                    return (
                      <Button
                        key={page}
                        type="button"
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBookingPage(page)}
                        className="min-w-10"
                        style={
                          isActive
                            ? { background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)', borderColor: 'transparent' }
                            : undefined
                        }
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBookingPage((page) => Math.min(totalBookingPages, page + 1))}
                    disabled={bookingPage === totalBookingPages}
                    className="gap-1.5"
                  >
                    <span>Next</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Student reviews & rating (right) */}
          <aside className="hidden lg:block">
            <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Student reviews & rating</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  A quick snapshot of learner feedback, trust signals, and overall teaching quality.
                </p>
              </div>

              <div className="grid grid-cols-[auto,1fr] gap-5 rounded-2xl border border-black/5 bg-[linear-gradient(180deg,rgba(122,184,186,0.08),rgba(255,255,255,0.92))] p-4">
                <div className="text-center min-w-[92px]">
                  <div className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
                    {reviewSummary.averageRating.toFixed(1)}
                  </div>
                  <div className="mt-1 flex justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {reviewSummary.totalReviews} student review{reviewSummary.totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-2">
                  {reviewSummary.distribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-[var(--muted-foreground)]">{item.stars}</span>
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#7ab8ba] to-[#5a9fa1]"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[var(--muted-foreground)]">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-black/5 bg-[var(--muted)]/35 p-3 text-center">
                  <div className="text-base font-semibold text-[var(--foreground)]">98%</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">recommend rate</div>
                </div>
                <div className="rounded-xl border border-black/5 bg-[var(--muted)]/35 p-3 text-center">
                  <div className="text-base font-semibold text-[var(--foreground)]">24h</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">avg response</div>
                </div>
                <div className="rounded-xl border border-black/5 bg-[var(--muted)]/35 p-3 text-center">
                  <div className="text-base font-semibold text-[var(--foreground)]">92%</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">repeat students</div>
                </div>
              </div>

              <div className="space-y-3">
                {reviewsLoading && (
                  <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm text-[var(--muted-foreground)]">
                    Loading student reviews...
                  </div>
                )}

                {!reviewsLoading && teacherReviews.length === 0 && (
                  <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm text-[var(--muted-foreground)]">
                    No real student reviews yet. Reviews will appear after completed sessions.
                  </div>
                )}

                {teacherReviews.map((review) => (
                  <div
                    key={review.bookingId}
                    className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]"
                    style={{ borderLeft: '3px solid #7ab8ba' }}
                  >
                    <div className="mb-2 flex items-start gap-3">
                      <ImageWithFallback
                        src={review.student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={review.student.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium text-[var(--foreground)]">{review.student.name}</div>
                          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Verified
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={`h-3.5 w-3.5 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)]">{formatReviewTime(review.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{review.text || 'No written feedback provided.'}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-dashed border-black/10 bg-[var(--muted)]/25 p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 text-[#7ab8ba]" />
                  <div>
                    <div className="text-sm font-medium text-[var(--foreground)]">Review system highlights</div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                      Show recent learner feedback, highlight verified reviews, and make your rating trend easy to scan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}