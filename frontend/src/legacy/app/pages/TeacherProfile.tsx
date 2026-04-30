import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import {
  Star, Users, BookOpen, Award, Calendar, Globe,
  MessageCircle, ArrowLeft, CheckCircle2, Clock,
  Sparkles, Shield, Video,
  Heart, Share2, Zap, TrendingUp, Brain, Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { TutorBadge } from '../components/TutorBadge';
import { SessionTierBadge } from '../components/SessionTierBadge';
import {
  getQualifiedStudentTeacherById,
  getStoredAuthUser,
  type StudentTeacherDirectoryItem,
} from '../services/auth';
import { getTeacherReviews, type TeacherReview } from '../services/booking';
import { useCall } from '../context/CallContext';

interface Teacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  avatar: string;
  rating: number;
  reviews: number;
  students: number;
  experience: string;
  creditRate: number;
  bio: string;
  specialties: string[];
  availability: string;
  languages: string[];
  color: string;
  badge: 'Verified' | 'Expert' | 'Not Verified';
  successfulSessions: number;
  sessionTier: 'Bronze' | 'Gold' | 'Diamond';
}

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

function mapTeacherToViewModel(teacher: StudentTeacherDirectoryItem): Teacher {
  return {
    id: teacher.id,
    name: teacher.name,
    title: teacher.title || 'Teacher',
    subject: teacher.subject || 'General',
    avatar: teacher.avatarUrl || defaultTeacherAvatar,
    rating: 0,
    reviews: 0,
    students: 0,
    experience: teacher.experience || 'Experienced',
    creditRate: Number(teacher.creditRate) || 30,
    bio: teacher.bio || '',
    specialties: Array.isArray(teacher.specialties) ? teacher.specialties : [],
    availability: teacher.availability || '',
    languages: Array.isArray(teacher.languages) ? teacher.languages : [],
    color: buildTeacherColor(teacher.id),
    badge: 'Verified',
    successfulSessions: teacher.successfulSessions ?? 0,
    sessionTier: teacher.sessionTier || 'Bronze',
  };
}

export function TeacherProfile() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loadingTeacher, setLoadingTeacher] = useState(true);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'30' | '60'>('60');
  const [liked, setLiked] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');
  const [teacherReviews, setTeacherReviews] = useState<TeacherReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSummary, setReviewSummary] = useState<{
    averageRating: number;
    totalReviews: number;
    distribution: Array<{ stars: number; percent: number }>;
  }>({
    averageRating: 0,
    totalReviews: 0,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, percent: 0 })),
  });
  const { initiateCall, callStatus } = useCall();
  const currentUser = getStoredAuthUser();
  const isStudent = currentUser?.profession === 'student';

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

  const handleShareProfile = async () => {
    const url = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingTeacher(true);
        setReviewsLoading(true);

        const [teacherResponse, reviewsResponse] = await Promise.all([
          getQualifiedStudentTeacherById(teacherId || ''),
          getTeacherReviews(teacherId || ''),
        ]);

        if (!mounted) {
          return;
        }

        const teacherVm = mapTeacherToViewModel(teacherResponse.teacher);
        teacherVm.rating = reviewsResponse.summary.averageRating;
        teacherVm.reviews = reviewsResponse.summary.totalReviews;

        setTeacher(teacherVm);
        setTeacherReviews(reviewsResponse.reviews);
        setReviewSummary({
          averageRating: reviewsResponse.summary.averageRating,
          totalReviews: reviewsResponse.summary.totalReviews,
          distribution: [5, 4, 3, 2, 1].map((stars) => {
            const entry = reviewsResponse.summary.distribution.find((item) => item.stars === stars);
            return { stars, percent: entry?.percent || 0 };
          }),
        });
        setTeacherError(null);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setTeacher(null);
        setTeacherError(error instanceof Error ? error.message : 'Teacher not found.');
      } finally {
        if (mounted) {
          setLoadingTeacher(false);
          setReviewsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [teacherId]);

  if (loadingTeacher) {
    return (
      <div className="min-h-screen pt-[73px]" style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="h-72 rounded-3xl bg-white/70 border border-[rgba(122,184,186,0.2)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 bg-white rounded-3xl shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #7ab8ba20, #7ab8ba10)' }}>
            <Users className="w-7 h-7 text-[var(--primary)]" />
          </div>
          <h2 className="mb-2 text-[var(--foreground)]">Tutor not found</h2>
          <p className="text-[var(--muted-foreground)] mb-5">{teacherError || 'This profile does not exist or has been removed.'}</p>
          <Link to="/student-dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  const benefits = [
    { icon: <Video className="w-4 h-4" />, text: 'One-on-one live sessions tailored to your goals' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Hands-on projects and real-world assignments' },
    { icon: <MessageCircle className="w-4 h-4" />, text: 'Personalized feedback and code reviews' },
    { icon: <Clock className="w-4 h-4" />, text: 'Lifetime access to session recordings' },
  ];

  const sessionCredits = Math.ceil(Number(sessionType) / teacher.creditRate);

  return (
    <div className="min-h-screen pt-[73px]" style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>

      {/* ── Decorative orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${teacher.color} 0%, transparent 70%)` }} />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-8" style={{ zIndex: 1 }}>

        {/* ── Back button ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Link
            to="/student-dashboard"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors group"
          >
            <motion.div
              whileHover={{ x: -4 }}
              className="w-8 h-8 rounded-xl border border-[var(--border)] flex items-center justify-center bg-white/80 backdrop-blur-sm group-hover:border-[var(--primary)] group-hover:bg-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.div>
            Back to tutors
          </Link>
        </motion.div>

        {/* ── Hero Banner ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl"
          style={{ background: `linear-gradient(135deg, #1a2332 0%, #273447 50%, ${teacher.color}33 100%)` }}
        >
          {/* Animated mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.65, 0.4] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
              style={{ background: `radial-gradient(circle, ${teacher.color}88 0%, transparent 70%)` }}
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute -bottom-12 left-1/3 w-64 h-64 rounded-full"
              style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
            />
            {/* Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="tp-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#tp-grid)" />
            </svg>
            {/* Sparkle dots */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0, 0.8, 0], y: [0, -12, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.35 }}
                className="absolute w-1 h-1 rounded-full bg-white"
                style={{ left: `${8 + i * 10}%`, top: `${15 + (i % 4) * 20}%` }}
              />
            ))}
          </div>

          <div className="relative p-8">
            {/* Top row: badges + actions */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs border border-white/20 text-white/70 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Sparkles className="w-3 h-3 inline mr-1 text-yellow-400" />
                  {teacher.subject}
                </span>
                <span className="px-3 py-1 rounded-full text-xs border border-white/20 text-white/70 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Shield className="w-3 h-3 inline mr-1 text-emerald-400" />
                  Verified Tutor
                </span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setLiked(!liked)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={liked ? 'liked' : 'unliked'}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-red-400 text-red-400' : 'text-white/70'}`} />
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { void handleShareProfile(); }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  aria-label="Copy profile link"
                  title={shareCopied ? 'Link copied' : 'Copy profile link'}
                >
                  <Share2 className={`w-4 h-4 transition-colors ${shareCopied ? 'text-emerald-300' : 'text-white/70'}`} />
                </motion.button>
              </div>
            </div>

            {/* Profile info */}
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 20 }}
                className="relative flex-shrink-0"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-1.5 rounded-2xl"
                  style={{ background: `conic-gradient(from 0deg, ${teacher.color}, #8b5cf6, ${teacher.color})`, opacity: 0.7 }}
                />
                <ImageWithFallback
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="relative w-28 h-28 rounded-2xl object-cover border-4 border-[#1a2332]"
                />
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-400 rounded-full border-4 border-[#1a2332]"
                />
              </motion.div>

              {/* Name & title */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="flex-1"
              >
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-white" style={{ fontSize: '1.85rem', lineHeight: 1.2 }}>{teacher.name}</h1>
                  <TutorBadge status={teacher.badge} size="md" />
                  <SessionTierBadge tier={teacher.sessionTier} sessions={teacher.successfulSessions} size="md" />
                </div>
                <p className="text-white/60 mb-4">{teacher.title}</p>

                {/* Stats chips */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />, label: `${teacher.rating} rating` },
                    { icon: <Users className="w-3.5 h-3.5 text-white/60" />, label: `${teacher.students.toLocaleString()} students` },
                    { icon: <Clock className="w-3.5 h-3.5 text-white/60" />, label: teacher.experience },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-white/80 border border-white/15 backdrop-blur-sm"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      {stat.icon}
                      {stat.label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col gap-2 md:pb-0"
              >
                <Link to={`/student-dashboard/book/${teacher.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${teacher.color}60` }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${teacher.color}, ${teacher.color}cc)`, color: '#1a2332', fontWeight: 600 }}
                  >
                    <Calendar className="w-4 h-4" />
                    Book a Session
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/messages/${teacher.id}`)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white/80 border border-white/20 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </motion.button>
                {/* Video Call button — only visible to students */}
                {isStudent && (
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(34,197,94,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => initiateCall(teacher.id)}
                    disabled={callStatus !== 'idle'}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white border border-white/20 backdrop-blur-sm"
                    style={{
                      background: callStatus !== 'idle'
                        ? 'rgba(255,255,255,0.05)'
                        : 'linear-gradient(135deg, rgba(34,197,94,0.8), rgba(22,163,74,0.8))',
                      opacity: callStatus !== 'idle' ? 0.5 : 1,
                      cursor: callStatus !== 'idle' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Video className="w-4 h-4" />
                    {callStatus === 'calling' ? 'Calling…' : callStatus !== 'idle' ? 'In Call' : 'Video Call'}
                  </motion.button>
                )}
              </motion.div>
            </div>
          </div>

          {/* Bottom shimmer */}
          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${teacher.color}, transparent)` }} />
        </motion.div>

        {/* ── Main Content Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 flex gap-1"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
            >
              {(['about', 'reviews'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative flex-1 py-2.5 rounded-xl text-sm capitalize transition-colors"
                  style={{ color: activeTab === tab ? '#1a2332' : 'var(--muted-foreground)' }}
                >
                  <span className="relative">
                    {tab === 'reviews' ? `Reviews (${teacher!.reviews})`
                      : 'About'}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === 'about' ? (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  {/* About */}
                  <Section title="About" icon={<Sparkles className="w-4 h-4" />} color={teacher.color}>
                    <p className="text-[var(--muted-foreground)] leading-relaxed">{teacher.bio}</p>
                  </Section>

                  {/* Specialties */}
                  <Section title="Specialties" icon={<Zap className="w-4 h-4" />} color={teacher.color}>
                    <div className="flex flex-wrap gap-2">
                      {teacher.specialties.map((s, idx) => (
                        <motion.span
                          key={s}
                          initial={{ opacity: 0, scale: 0.8, y: 8 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.07, type: 'spring', stiffness: 280 }}
                          whileHover={{ scale: 1.08, y: -2 }}
                          className="px-4 py-2 rounded-xl text-sm cursor-default"
                          style={{
                            background: `${teacher.color}12`,
                            color: teacher.color,
                            border: `1px solid ${teacher.color}25`,
                          }}
                        >
                          {s}
                        </motion.span>
                      ))}
                    </div>
                  </Section>

                  {/* What you'll get */}
                  <Section title="What you'll get" icon={<Award className="w-4 h-4" />} color={teacher.color}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {benefits.map(({ icon, text }, idx) => (
                        <motion.div
                          key={text}
                          initial={{ opacity: 0, x: -16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.09, type: 'spring', stiffness: 260 }}
                          whileHover={{ x: 4, scale: 1.02 }}
                          className="flex items-start gap-3 p-3.5 rounded-xl cursor-default"
                          style={{ background: `${teacher.color}06`, border: `1px solid ${teacher.color}15` }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white mt-0.5"
                            style={{ background: `linear-gradient(135deg, ${teacher.color}, ${teacher.color}bb)` }}
                          >
                            {icon}
                          </div>
                          <span className="text-sm text-[var(--muted-foreground)] leading-relaxed">{text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </Section>

                  {/* Info grid */}
                  <Section title="Details" icon={<Globe className="w-4 h-4" />} color={teacher.color}>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: <BookOpen className="w-4 h-4" />, label: 'Subject', value: teacher.subject },
                        { icon: <Users className="w-4 h-4" />, label: 'Students', value: teacher.students.toLocaleString() },
                        { icon: <Clock className="w-4 h-4" />, label: 'Availability', value: teacher.availability },
                        { icon: <Globe className="w-4 h-4" />, label: 'Languages', value: teacher.languages.join(', ') },
                        { icon: <Star className="w-4 h-4" />, label: 'Experience', value: teacher.experience },
                      ].map(({ icon, label, value }, idx) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.06 }}
                          whileHover={{ y: -2 }}
                          className="flex items-start gap-3 p-3 rounded-xl cursor-default group"
                          style={{ background: 'var(--muted)' }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${teacher.color}, ${teacher.color}99)` }}
                          >
                            {icon}
                          </div>
                          <div>
                            <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
                            <div className="text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{value}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Section>
                </motion.div>
              ) : (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Rating summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-5"
                    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div
                          className="mb-1"
                          style={{ fontSize: '3.5rem', lineHeight: 1, fontWeight: 700, color: teacher.color }}
                        >
                          {teacher.rating}
                        </div>
                        <div className="flex gap-0.5 justify-center mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">{teacher.reviews} reviews</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const pct = reviewSummary.distribution.find((item) => item.stars === stars)?.percent || 0;
                          return (
                            <div key={stars} className="flex items-center gap-2">
                              <span className="text-xs w-3 text-[var(--muted-foreground)]">{stars}</span>
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1, delay: 0.3 + (5 - stars) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                  className="h-full rounded-full"
                                  style={{ background: `linear-gradient(90deg, ${teacher.color}, ${teacher.color}88)` }}
                                />
                              </div>
                              <span className="text-xs w-6 text-[var(--muted-foreground)]">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* Review cards */}
                  <div className="space-y-4">
                    {reviewsLoading && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-sm text-[var(--muted-foreground)]"
                        style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                        Loading reviews...
                      </div>
                    )}

                    {!reviewsLoading && teacherReviews.length === 0 && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-sm text-[var(--muted-foreground)]"
                        style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                        No student reviews yet. Reviews will appear here after completed sessions.
                      </div>
                    )}

                    {teacherReviews.map((r, idx) => (
                      <motion.div
                        key={r.bookingId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, type: 'spring', stiffness: 260 }}
                        whileHover={{ y: -3 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 cursor-default"
                        style={{
                          border: `1px solid rgba(0,0,0,0.06)`,
                          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                          borderLeft: `3px solid ${teacher.color}`,
                        }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <ImageWithFallback
                              src={r.student.avatarUrl || defaultTeacherAvatar}
                              alt={r.student.name}
                              className="w-11 h-11 rounded-xl object-cover"
                            />
                          </motion.div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[var(--foreground)] text-sm">{r.student.name}</span>
                              <span className="px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1"
                                style={{ background: `${teacher.color}15`, color: teacher.color }}>
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 + i * 0.04, type: 'spring' }}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                                  </motion.div>
                                ))}
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)]">{formatReviewTime(r.submittedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{r.text || 'No written feedback provided.'}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right Sidebar ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Booking card */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="rounded-2xl overflow-hidden sticky top-6"
              style={{
                background: 'white',
                boxShadow: `0 8px 40px rgba(0,0,0,0.1), 0 0 0 1px ${teacher.color}25`,
              }}
            >
              {/* Card top accent */}
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${teacher.color}, ${teacher.color}55)` }} />

              <div className="p-6">
                {/* Session type toggle */}
                <div className="mb-5">
                  <div className="text-xs text-[var(--muted-foreground)] mb-2">Session Duration</div>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
                    {(['30', '60'] as const).map((type) => (
                      <motion.button
                        key={type}
                        onClick={() => setSessionType(type)}
                        whileTap={{ scale: 0.97 }}
                        className="relative py-2 rounded-lg text-sm transition-colors"
                        style={{ color: sessionType === type ? '#1a2332' : 'var(--muted-foreground)' }}
                      >
                        {sessionType === type && (
                          <motion.div
                            layoutId="sessionType"
                            className="absolute inset-0 rounded-lg bg-white shadow-sm"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative">{type} min</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5 p-4 rounded-xl" style={{ background: `${teacher.color}08`, border: `1px solid ${teacher.color}20` }}>
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">Session cost</div>
                  <div className="flex items-baseline gap-1.5">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={sessionCredits}
                        initial={{ y: -12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 12, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{ fontSize: '2.25rem', fontWeight: 700, color: teacher.color, lineHeight: 1 }}
                      >
                        {sessionCredits}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[var(--muted-foreground)]">credit{sessionCredits !== 1 ? 's' : ''} / {sessionType} min</span>
                  </div>
                  <div className="text-xs mt-1.5" style={{ color: teacher.color }}>
                    <Zap className="w-3 h-3 inline mr-1" />
                    Free cancellation 24h before
                  </div>
                </div>

                {/* Next available */}
                <div className="flex items-center gap-2 mb-5 text-sm text-[var(--muted-foreground)]">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Next available: <span className="text-[var(--foreground)]">Tomorrow, 10 AM</span>
                </div>

                {/* CTA buttons */}
                <Link to={`/student-dashboard/book/${teacher.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: `0 8px 30px ${teacher.color}50` }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-xl text-white mb-3 flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${teacher.color}, ${teacher.color}cc)`, fontWeight: 600 }}
                  >
                    <Calendar className="w-4 h-4" />
                    Book a Session
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.02, borderColor: teacher.color, color: teacher.color }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/messages/${teacher.id}`)}
                  className="w-full py-3.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2"
                  style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--muted-foreground)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Message
                </motion.button>

                {/* Trust badge */}
                <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]"
                  style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Money-back guarantee · Secure payments
                </div>
              </div>
            </motion.div>


          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ── Section Component ─────────────────────────────────────── */
function Section({
  title, children, icon, color,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <h3 className="text-[var(--foreground)] mb-5 flex items-center gap-2.5">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
        >
          {icon}
        </span>
        {title}
        <span className="flex-1 h-px ml-1" style={{ background: `linear-gradient(90deg, ${color}30, transparent)` }} />
      </h3>
      {children}
    </motion.div>
  );
}