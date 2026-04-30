import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  Search, Star, BookOpen, Clock, Award,
  Bell, Sparkles, ChevronRight, Zap, Users, Globe, Play,
  Edit3, Brain, Trophy, Shield,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { TutorBadge } from '../components/TutorBadge';
import DateTimeBadge from '../components/DateTimeBadge';
import {
  AUTH_SESSION_CHANGED_EVENT,
  getQualifiedStudentTeachers,
  getStoredAuthUser,
  syncAccountModeForDashboard,
  type StudentTeacherDirectoryItem,
} from '../services/auth';

interface Teacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  avatar: string;
  rating: number;
  reviews: number;
  students: number;
  courses: number;
  experience: string;
  creditRate: number;
  bio: string;
  specialties: string[];
  availability: string;
  languages: string[];
  color: string;
  badge: 'Not Verified' | 'Verified' | 'Expert';
}

export const teachers: Teacher[] = [];

const teacherPalette = ['#7ab8ba', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'];
const defaultTeacherAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';

function buildTeacherColor(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i += 1) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }

  return teacherPalette[Math.abs(hash) % teacherPalette.length];
}

function mapTeacherToCard(teacher: StudentTeacherDirectoryItem): Teacher {
  const color = buildTeacherColor(teacher.id);

  return {
    id: teacher.id,
    name: teacher.name,
    title: teacher.title || 'Teacher',
    subject: teacher.subject || 'General',
    avatar: teacher.avatarUrl || defaultTeacherAvatar,
    rating: 0,
    reviews: 0,
    students: 0,
    courses: 0,
    experience: teacher.experience || 'Experienced',
    creditRate: Number(teacher.creditRate) || 30,
    bio: teacher.bio || '',
    specialties: Array.isArray(teacher.specialties) ? teacher.specialties : [],
    availability: teacher.availability || '',
    languages: Array.isArray(teacher.languages) ? teacher.languages : [],
    color,
    badge: 'Verified',
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
} as const;

export function StudentDashboard() {
  const [query, setQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [focused, setFocused] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const [modeSyncing, setModeSyncing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const teachersRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const learningCredits = currentUser?.learningCredits ?? 10;
  const userName = currentUser?.name || 'Student';

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

      if (storedUser.profession === 'student') {
        setCurrentUser(storedUser);
        return;
      }

      setModeSyncing(true);

      try {
        const response = await syncAccountModeForDashboard('student');

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
    let mounted = true;

    (async () => {
      try {
        setTeachersLoading(true);
        const response = await getQualifiedStudentTeachers();

        if (!mounted) {
          return;
        }

        setTeachers(response.teachers.map(mapTeacherToCard));
        setTeachersError(null);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setTeachers([]);
        setTeachersError(error instanceof Error ? error.message : 'Unable to load teachers right now.');
      } finally {
        if (mounted) {
          setTeachersLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const subjects = ['All', ...Array.from(new Set(teachers.map((teacher) => teacher.subject).filter(Boolean)))];

  const filtered = teachers.filter((t) => {
    const matchesQuery =
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.subject.toLowerCase().includes(query.toLowerCase()) ||
      t.specialties.some((s) => s.toLowerCase().includes(query.toLowerCase()));
    const matchesSubject = activeSubject === 'All' || t.subject === activeSubject;
    return matchesQuery && matchesSubject;
  });

  if (modeSyncing) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
        <div className="px-6 py-5 rounded-2xl bg-white border border-[rgba(122,184,186,0.25)] shadow-sm text-sm text-[var(--muted-foreground)]">
          Switching to student mode…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[73px]" style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>

      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a2332" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10" style={{ zIndex: 1 }}>

        {/* ── Welcome Hero ──────────────────────────────── */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden mb-8 shadow-2xl"
          style={{
            position: 'relative',
            y: heroY,
            opacity: heroOpacity,
            background: 'linear-gradient(135deg, #1a2332 0%, #273447 40%, #1a3a3c 100%)',
          }}
        >
          {/* Orbs inside hero */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
              style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute -bottom-16 left-1/4 w-56 h-56 rounded-full"
              style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
            />
            {/* Sparkle dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0, 1, 0], y: [0, -10, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
                className="absolute w-1 h-1 rounded-full bg-white"
                style={{ left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 25}%` }}
              />
            ))}
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-8">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center gap-2 mb-3"
              >
                <DateTimeBadge icon={<Sparkles className="w-3 h-3 inline mr-1.5 text-yellow-400" />} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-white mb-2"
                style={{ fontSize: '2rem', lineHeight: '1.2' }}
              >
                Welcome back, <span style={{ color: '#7ab8ba' }}>{userName}</span> 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-white/60 mb-6"
              >
                You&apos;re on a 12-day learning streak. Keep the momentum going!
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex items-center gap-3 flex-wrap"
              >
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(122,184,186,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => teachersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[#1a2332]"
                  style={{ background: 'linear-gradient(135deg, #7ab8ba, #a8d5d7)' }}
                >
                  <Play className="w-4 h-4" />
                  Continue Learning
                </motion.button>
                <Link to="/student-dashboard/bookings">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white border border-white/20 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <BookOpen className="w-4 h-4" />
                    My Bookings
                  </motion.button>
                </Link>
                <Link to="/student-dashboard/edit-profile">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white border border-white/20 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </motion.button>
                </Link>
                <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm">{learningCredits} credits</span>
                </span>
              </motion.div>
            </div>

            {/* Right: avatar + notification */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
              className="flex items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 12 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a2332]" />
              </motion.button>

              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #7ab8ba, #8b5cf6, #7ab8ba)',
                    padding: '2px',
                    borderRadius: '50%',
                  }}
                />
                <div className="relative w-16 h-16 rounded-full p-0.5"
                  style={{ background: 'conic-gradient(from 0deg, #7ab8ba, #8b5cf6, #7ab8ba)' }}>
                  <ImageWithFallback
                    src={(currentUser as any)?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={userName}
                    className="w-full h-full rounded-full object-cover border-2 border-[#1a2332]"
                  />
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#1a2332]" />
              </div>

              <div className="text-white hidden md:block">
                <div>{userName}</div>
                <div className="text-white/50 text-sm">Pro Student</div>
              </div>
            </motion.div>
          </div>

          {/* Bottom shimmer line */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #7ab8ba, transparent)' }} />
        </motion.div>

        {/* Cards removed as requested */}

        {/* ── Search & Filters ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border mb-8 overflow-hidden"
          style={{
            boxShadow: '0 4px 32px rgba(122,184,186,0.12), 0 1px 3px rgba(0,0,0,0.06)',
            borderColor: 'rgba(122,184,186,0.25)',
          }}
        >
          <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-[var(--foreground)]">Browse Tutors</h2>
                <motion.span
                  key={filtered.length}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-2.5 py-0.5 rounded-full text-sm"
                  style={{ background: 'rgba(122,184,186,0.15)', color: '#5a9fa1' }}
                >
                  {filtered.length} available
                </motion.span>
              </div>
              <span className="text-sm text-[var(--muted-foreground)] hidden md:block">
                <Zap className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
                Live matching
              </span>
            </div>

            {/* Search bar */}
            <motion.div
              animate={focused ? { boxShadow: '0 0 0 3px rgba(122,184,186,0.25)' } : { boxShadow: '0 0 0 0px rgba(122,184,186,0)' }}
              className="relative rounded-xl overflow-hidden"
              style={{ background: focused ? '#fff' : 'var(--muted)' }}
            >
              <div
                className="absolute inset-0 rounded-xl transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(122,184,186,0.2), rgba(139,92,246,0.1))',
                  opacity: focused ? 1 : 0,
                }}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)] z-10" />
              <input
                type="text"
                placeholder="Search by name, subject, or skill…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="relative w-full pl-12 pr-4 py-3.5 bg-transparent outline-none z-10 text-[var(--foreground)]"
                style={{ caretColor: '#7ab8ba' }}
              />
            </motion.div>
          </div>

          {/* Filter pills */}
          <div className="px-6 py-4 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveSubject(s)}
                className="relative px-4 py-1.5 rounded-full text-sm transition-all overflow-hidden"
                style={
                  activeSubject === s
                    ? { background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)', color: '#fff', boxShadow: '0 4px 16px rgba(122,184,186,0.4)' }
                    : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
                }
              >
                {activeSubject === s && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{s}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Tutor Grid ──────────────────────────────────── */}
        {teachersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-[360px] rounded-2xl bg-white/70 border border-[rgba(122,184,186,0.18)] animate-pulse" />
            ))}
          </div>
        ) : teachersError ? (
          <div className="rounded-2xl bg-white/80 border border-red-200 p-6 text-center">
            <p className="text-sm text-red-600">{teachersError}</p>
          </div>
        ) : filtered.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            ref={teachersRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((t, idx) => (
              <motion.div key={t.id} variants={itemVariants} custom={idx}>
                <TeacherCard teacher={t} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(122,184,186,0.15), rgba(139,92,246,0.1))' }}>
              <Search className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-[var(--foreground)] mb-2">No tutors found</h3>
            <p className="text-[var(--muted-foreground)] max-w-xs">
              Try adjusting your search or filter. There are {teachers.length} real verified tutors waiting!
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setQuery(''); setActiveSubject('All'); }}
              className="mt-5 px-5 py-2.5 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}
            >
              Clear Filters
            </motion.button>
          </motion.div>
        )}


      </div>
    </div>
  );
}

/* ── TeacherCard ─────────────────────────────────────────── */
function TeacherCard({ teacher }: { teacher: Teacher }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/student-dashboard/tutors/${teacher.id}`}
      className="block h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative bg-white rounded-2xl overflow-hidden h-full group"
        style={{
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: hovered
            ? `0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px ${teacher.color}30`
            : '0 2px 16px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* Top accent bar */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0.3, opacity: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 right-0 h-1 origin-left"
          style={{ background: `linear-gradient(90deg, ${teacher.color}, ${teacher.color}44)` }}
        />

        {/* Shimmer sweep on hover */}
        <motion.div
          animate={{ x: hovered ? '200%' : '-100%' }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
            zIndex: 2,
          }}
        />

        <div className="p-6">
          {/* Header row */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative flex-shrink-0">
              <motion.div
                animate={{ boxShadow: hovered ? `0 0 0 3px ${teacher.color}50` : '0 0 0 0px transparent' }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 rounded-2xl overflow-hidden"
              >
                <ImageWithFallback
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: '#10b981' }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors text-lg font-semibold">
                  {teacher.name}
                </h3>
                <TutorBadge status={teacher.badge} size="sm" />
                {/* Tier badge: Bronze / Silver / Gold based on rating */}
                {(() => {
                  const tier = teacher.rating >= 4.8 ? 'Gold' : teacher.rating >= 4.5 ? 'Silver' : 'Bronze';
                  const colors: Record<string, { bg: string; color: string; border: string }> = {
                    Gold: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
                    Silver: { bg: 'rgba(156,163,175,0.12)', color: '#9ca3af', border: 'rgba(156,163,175,0.25)' },
                    Bronze: { bg: 'rgba(205,127,50,0.12)', color: '#cd7f32', border: 'rgba(205,127,50,0.25)' },
                  };
                  const c = colors[tier];
                  return (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
                    >
                      {tier}
                    </span>
                  );
                })()}
              </div>
              <p className="text-[var(--muted-foreground)] text-sm truncate mb-2">{teacher.title}</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-[var(--foreground)]">{teacher.rating}</span>
                <span className="text-sm text-[var(--muted-foreground)]">({teacher.reviews})</span>
              </div>
            </div>

            {/* Price badge */}
            <motion.div
              animate={{ scale: hovered ? 1.06 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${teacher.color}, ${teacher.color}bb)` }}
            >
              <span className="text-sm">{teacher.creditRate}m</span>
              <span className="text-xs opacity-75">/cr</span>
            </motion.div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mb-4 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {teacher.students.toLocaleString()}
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {teacher.courses} courses
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              {teacher.languages[0]}
            </span>
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-2 mb-5">
            {teacher.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  background: `${teacher.color}12`,
                  color: teacher.color,
                  border: `1px solid ${teacher.color}25`,
                }}
              >
                {s}
              </span>
            ))}
            {teacher.specialties.length > 3 && (
              <span className="px-3 py-1 rounded-full text-sm bg-[var(--muted)] text-[var(--muted-foreground)]">
                +{teacher.specialties.length - 3}
              </span>
            )}
          </div>

          {/* CTA */}
          <motion.div
            className="flex items-center justify-between pt-4 border-t"
            style={{ borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <span className="text-sm text-[var(--muted-foreground)]">{teacher.experience} exp.</span>
            <motion.span
              animate={{ x: hovered ? 4 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: teacher.color }}
            >
              View profile
              <ChevronRight className="w-4 h-4" />
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}