import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Camera, Save, User, BookOpen, Target,
  Clock, Globe, GraduationCap, Plus, X, Check,
  Sparkles, TrendingUp, Heart, LoaderCircle,
  Languages, Info, Flame,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  getStoredAuthUser,
  getStudentProfile,
  updateStudentProfile,
  updateStoredAuthUser,
  type StudentProfile,
} from '../services/auth';
import { syncAvatarToFirebase } from '../services/firebase';

/* ── Constants ──────────────────────────────── */
const STUDY_AREAS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature',
  'Computer Science', 'Data Science', 'Machine Learning', 'Web Development',
  'Full Stack Development', 'Python', 'JavaScript', 'Mobile Development',
  'UI/UX Design', 'Graphic Design', 'Digital Marketing', 'Finance',
  'Accounting', 'Economics', 'Statistics', 'History', 'Geography',
  'Music', 'Photography', 'Video Editing', 'Game Development',
];

const LEARNING_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Just starting out, learning the fundamentals', color: '#10b981', emoji: '🌱' },
  { id: 'elementary', label: 'Elementary', desc: 'Have basic knowledge, exploring further', color: '#7ab8ba', emoji: '📘' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with basics, going deeper', color: '#6366f1', emoji: '📚' },
  { id: 'advanced', label: 'Advanced', desc: 'Strong foundation, tackling complex topics', color: '#f59e0b', emoji: '🔥' },
  { id: 'expert', label: 'Expert', desc: 'Professional-level, refining and specialising', color: '#8b5cf6', emoji: '⭐' },
];

const GOALS = [
  'Get a job / career change', 'Pass an exam', 'Personal interest / hobby',
  'Improve academic grades', 'Build a project / startup', 'Get a promotion',
  'Learn a new language', 'Master a skill', 'Prepare for interview',
];

const LANGUAGES = [
  'English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German',
  'Mandarin', 'Hindi', 'Portuguese', 'Japanese', 'Korean',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = [
  '6 AM – 9 AM', '9 AM – 12 PM', '12 PM – 3 PM',
  '3 PM – 6 PM', '6 PM – 9 PM', '9 PM – 12 AM',
];

const SESSION_PREFS = [
  '1:1 Private sessions', 'Group classes', 'Short daily sessions',
  'Long weekend deep-dives', 'Recorded lessons', 'Live only',
];

const DEFAULT_STUDENT_AVATAR_URL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

function deriveUsernameFromEmail(email?: string) {
  const localPart = (email || '').split('@')[0] || 'student';
  return localPart
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'student';
}

/* ── Tabs ───────────────────────────────────── */
const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'preferences', label: 'Preferences', icon: Heart },
];

/* ── Tag picker ─────────────────────────────── */
function TagPicker({
  label, values, all, max = 6, color = '#7ab8ba',
  onAdd, onRemove,
}: {
  label: string; values: string[]; all: string[];
  max?: number; color?: string;
  onAdd: (v: string) => void; onRemove: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = all.filter((x) => x.toLowerCase().includes(q.toLowerCase()) && !values.includes(x));

  return (
    <div>
      <label className="text-xs mb-1.5 block" style={{ color: '#6b7280' }}>{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v) => (
          <motion.span key={v} layout initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
            {v}
            <button onClick={() => onRemove(v)}><X className="w-3 h-3" /></button>
          </motion.span>
        ))}
        {values.length < max && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm border border-dashed"
            style={{ borderColor: color, color, background: `${color}08` }}>
            <Plus className="w-3.5 h-3.5" /> Add
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl shadow-xl border p-3 relative z-20"
            style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search..." className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
              style={{ background: '#f5f7f9', caretColor: color }} autoFocus />
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {filtered.slice(0, 20).map((item) => (
                <button key={item}
                  onClick={() => { onAdd(item); setQ(''); setOpen(false); }}
                  className="px-3 py-1 rounded-lg text-xs transition-all hover:scale-105"
                  style={{ background: `${color}12`, color }}>
                  {item}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Section wrapper ────────────────────────── */
function Section({ title, icon: Icon, children, color = '#7ab8ba' }: {
  title: string; icon: React.ElementType; children: React.ReactNode; color?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border overflow-hidden mb-6"
      style={{ boxShadow: '0 8px 28px rgba(15,23,42,0.06)', borderColor: 'rgba(122,184,186,0.18)' }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-[var(--foreground)]">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs mb-1.5 block" style={{ color: '#6b7280' }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all";
const inputStyle = { borderColor: 'rgba(122,184,186,0.3)', background: '#f9fafb', caretColor: '#7ab8ba' };

/* ══════════════════════════════════════════════════════════ */
export function StudentEditProfile() {
  const currentUser = getStoredAuthUser();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const persistedAvatarUrlRef = useRef(currentUser?.avatarUrl || '');

  const [activeTab, setActiveTab] = useState('personal');
  const [saved, setSaved] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* Personal */
  const [name, setName] = useState(currentUser?.name || 'Student');
  const [username, setUsername] = useState(deriveUsernameFromEmail(currentUser?.email));
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatarUrl || DEFAULT_STUDENT_AVATAR_URL);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  /* Learning */
  const [level, setLevel] = useState<StudentProfile['level']>('intermediate');
  const [subjects, setSubjects] = useState<string[]>(['JavaScript', 'Python', 'Data Science']);
  const [currentlyLearning, setCurrentlyLearning] = useState('');
  const [streak, setStreak] = useState(0);

  /* Goals */
  const [goals, setGoals] = useState<string[]>(['Get a job / career change', 'Build a project / startup']);
  const [targetDate, setTargetDate] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  /* Schedule */
  const [days, setDays] = useState<string[]>(['Mon', 'Wed', 'Fri', 'Sat']);
  const [timeSlots, setTimeSlots] = useState<string[]>(['6 PM – 9 PM']);
  const [timezone, setTimezone] = useState('UTC+5 (PKT)');
  const [weeklyHours, setWeeklyHours] = useState(5);

  /* Preferences */
  const [languages, setLanguages] = useState<string[]>(['English', 'Urdu']);
  const [sessionPrefs, setSessionPrefs] = useState<string[]>(['1:1 Private sessions']);
  const [learningStyle, setLearningStyle] = useState('');

  const applyProfileToForm = (profile: StudentProfile, nextName?: string, resolvedAvatarUrl?: string) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    persistedAvatarUrlRef.current = resolvedAvatarUrl || profile.avatarUrl || '';

    setName(nextName || currentUser?.name || name);
    setUsername(profile.username || deriveUsernameFromEmail(currentUser?.email));
    setBio(profile.bio || '');
    setLocation(profile.location || '');
    // Use canonical user avatar → legacy profile avatar → default
    setAvatar(resolvedAvatarUrl || profile.avatarUrl || DEFAULT_STUDENT_AVATAR_URL);
    setAvatarFile(null);
    setLevel(profile.level || 'intermediate');
    setSubjects(profile.subjects || []);
    setCurrentlyLearning(profile.currentlyLearning || '');
    setStreak(profile.streak || 0);
    setGoals(profile.goals || []);
    setTargetDate(profile.targetDate || '');
    setDays(profile.days || []);
    setTimeSlots(profile.timeSlots || []);
    setTimezone(profile.timezone || 'UTC+5 (PKT)');
    setWeeklyHours(profile.weeklyHours || 5);
    setLanguages(profile.languages || []);
    setSessionPrefs(profile.sessionPrefs || []);
    setLearningStyle(profile.learningStyle || '');
  };

  const handleAvatarChoose = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setAvatarFile(file);
    setAvatar(previewUrl);
    event.target.value = '';
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setLoadError(null);

      try {
        const response = await getStudentProfile();

        if (!mounted) {
          return;
        }

        applyProfileToForm(
          response.profile,
          response.user?.name || currentUser?.name || 'Student',
          response.user?.avatarUrl,
        );
        if (response.user) {
          updateStoredAuthUser(response.user);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : 'Unable to load profile right now.');
      } finally {
        if (mounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const toggleDay = (d: string) => setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);
  const toggleSlot = (s: string) => setTimeSlots((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleGoal = (g: string) => setGoals((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);
  const togglePref = (p: string) => setSessionPrefs((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const handleSave = async () => {
    setSaveError(null);
    setIsSavingProfile(true);

    try {
      const response = await updateStudentProfile({
        name,
        username,
        bio,
        location,
        avatarUrl: avatarFile ? undefined : persistedAvatarUrlRef.current || undefined,
        avatarFile,
        level,
        subjects,
        currentlyLearning,
        streak,
        goals,
        targetDate,
        days,
        timeSlots,
        timezone,
        weeklyHours,
        languages,
        sessionPrefs,
        learningStyle,
      });

      applyProfileToForm(
        response.profile,
        response.user?.name || name,
        response.user?.avatarUrl,
      );
      if (response.user) {
        updateStoredAuthUser(response.user);
        persistedAvatarUrlRef.current = response.user.avatarUrl || '';
        // Sync avatar + name to Firebase so Messages/People list shows the new photo
        const uid = response.user.id;
        const newAvatar = response.user.avatarUrl || '';
        if (uid) {
          void syncAvatarToFirebase(uid, response.user.name || '', newAvatar);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save profile right now.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const completion = (() => {
    let s = 0;
    if (name) s += 15; if (bio) s += 10; if (level) s += 15;
    if (subjects.length >= 1) s += 15; if (goals.length >= 1) s += 15;
    if (languages.length > 0) s += 10;
    return Math.min(s, 100);
  })();

  const currentLevel = LEARNING_LEVELS.find((l) => l.id === level);

  return (
    <div className="min-h-screen pt-[73px]"
      style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
      {/* BG orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10" style={{ zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/student-dashboard">
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-white shadow-sm"
                style={{ borderColor: 'rgba(122,184,186,0.3)' }}>
                <ArrowLeft className="w-4 h-4" style={{ color: '#1a2332' }} />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-[var(--foreground)]" style={{ fontSize: '1.5rem', fontFamily: 'Georgia, serif' }}>
                Edit Student Profile
              </h1>
              <p className="text-sm flex items-center gap-1.5" style={{ color: '#6b7280' }}>
                <Flame className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                {streak}-day learning streak — keep it up!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 border"
              style={{ borderColor: 'rgba(122,184,186,0.2)' }}>
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#f0f9f9" strokeWidth="3" />
                  <motion.circle cx="16" cy="16" r="12" fill="none" stroke="#7ab8ba" strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 75 }}
                    animate={{ strokeDashoffset: 75 - (75 * completion) / 100 }}
                    transition={{ duration: 1.2 }}
                    strokeDasharray="75" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center"
                  style={{ fontSize: '0.55rem', fontWeight: 700, color: '#1a2332' }}>{completion}%</span>
              </div>
              <span className="text-sm" style={{ color: '#6b7280' }}>Complete</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(122,184,186,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={isSavingProfile || isLoadingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white disabled:cursor-not-allowed disabled:opacity-80"
              style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)', boxShadow: '0 4px 20px rgba(122,184,186,0.3)' }}>
              <AnimatePresence mode="wait">
                {isSavingProfile ? (
                  <motion.span key="saving" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" /> Saving...
                  </motion.span>
                ) : saved ? (
                  <motion.span key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Saved!
                  </motion.span>
                ) : (
                  <motion.span key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Profile
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {isLoadingProfile && (
          <div className="mb-6 rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: 'rgba(122,184,186,0.35)', background: 'rgba(122,184,186,0.08)', color: '#2f6f71' }}>
            Loading your saved student profile…
          </div>
        )}

        {loadError && (
          <div className="mb-6 rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#b91c1c' }}>
            {loadError}
          </div>
        )}

        {saveError && (
          <div className="mb-6 rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#b91c1c' }}>
            {saveError}
          </div>
        )}

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">

          {/* ── Sidebar tabs ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="hidden lg:flex flex-col gap-1 sticky top-24 h-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <motion.button key={id} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-left transition-all"
                style={activeTab === id
                  ? { background: 'linear-gradient(135deg, #7ab8ba18, #7ab8ba08)', color: '#7ab8ba', fontWeight: 600, boxShadow: '0 0 0 1.5px rgba(122,184,186,0.3)' }
                  : { color: '#6b7280', background: 'rgba(255,255,255,0.6)' }}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {activeTab === id && (
                  <motion.div layoutId="studentTab" className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#7ab8ba' }} />
                )}
              </motion.button>
            ))}

            {/* Quick stats */}
            <div className="mt-4 p-4 rounded-2xl bg-white/80 border space-y-3"
              style={{ borderColor: 'rgba(122,184,186,0.18)' }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: '#6b7280' }}>Profile</span>
                <span style={{ color: '#7ab8ba', fontWeight: 600 }}>{completion}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: '#f0f9f9' }}>
                <motion.div className="h-full rounded-full" animate={{ width: `${completion}%` }}
                  transition={{ duration: 1.2 }}
                  style={{ background: 'linear-gradient(90deg, #7ab8ba, #5a9fa1)' }} />
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
                <Flame className="w-3 h-3" style={{ color: '#f59e0b' }} />
                {streak} day streak
              </div>
            </div>
          </motion.div>

          {/* ── Mobile tab pills ── */}
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 mb-2 no-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap"
                style={activeTab === id ? { background: '#7ab8ba', color: '#fff' } : { background: 'rgba(255,255,255,0.8)', color: '#6b7280' }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* ── Main content ── */}
          <div>
            <AnimatePresence mode="wait">

              {/* ── PERSONAL ── */}
              {activeTab === 'personal' && (
                <motion.div key="personal"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Profile Photo" icon={Camera} color="#7ab8ba">
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden"
                          style={{ boxShadow: '0 0 0 3px rgba(122,184,186,0.3)' }}>
                          <ImageWithFallback src={avatar} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <motion.button type="button" onClick={handleAvatarChoose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                          <Camera className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                      <div>
                        <p className="text-sm mb-3" style={{ color: '#6b7280' }}>
                          A friendly photo helps tutors connect with you better and makes the experience more personal.
                        </p>
                        <motion.button type="button" onClick={handleAvatarChoose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          className="px-4 py-2 rounded-xl text-sm border"
                          style={{ borderColor: 'rgba(122,184,186,0.4)', color: '#7ab8ba', background: 'rgba(122,184,186,0.06)' }}>
                          Upload Photo
                        </motion.button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </Section>

                  <Section title="Basic Information" icon={User} color="#1a2332">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Full Name">
                        <input value={name} onChange={(e) => setName(e.target.value)}
                          className={inputCls} style={inputStyle} placeholder="Your full name" />
                      </Field>
                      <Field label="Username">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9ca3af' }}>@</span>
                          <input value={username} onChange={(e) => setUsername(e.target.value)}
                            className={inputCls} style={{ ...inputStyle, paddingLeft: '2rem' }} placeholder="username" />
                        </div>
                      </Field>
                      <Field label="Location">
                        <input value={location} onChange={(e) => setLocation(e.target.value)}
                          className={inputCls} style={inputStyle} placeholder="City, Country" />
                      </Field>
                      <Field label="Languages You Speak">
                        <div className="pt-0.5">
                          <TagPicker label="" values={languages} all={LANGUAGES} max={4} color="#1a2332"
                            onAdd={(v) => setLanguages((p) => [...p, v])}
                            onRemove={(v) => setLanguages((p) => p.filter((x) => x !== v))} />
                        </div>
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="About Me (optional)">
                          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                            className={`${inputCls} resize-none`} style={inputStyle}
                            placeholder="Tell tutors a bit about yourself and what drives you..." />
                        </Field>
                      </div>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── LEARNING ── */}
              {activeTab === 'learning' && (
                <motion.div key="learning"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Your Learning Level" icon={TrendingUp} color="#7ab8ba">
                    <p className="text-sm mb-5" style={{ color: '#6b7280' }}>
                      Select your overall level. You can set different levels per subject in your goals tab.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {LEARNING_LEVELS.map((l) => {
                        const active = level === l.id;
                        return (
                          <motion.button key={l.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setLevel(l.id as StudentProfile['level'])}
                            className="relative p-4 rounded-2xl text-left transition-all"
                            style={active
                              ? { background: `${l.color}12`, border: `2px solid ${l.color}50`, boxShadow: `0 4px 20px ${l.color}20` }
                              : { background: '#f9fafb', border: '2px solid transparent' }}>
                            {active && (
                              <motion.div layoutId="levelIndicator"
                                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: l.color }}>
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                            <div className="text-2xl mb-2">{l.emoji}</div>
                            <div className="text-sm mb-1" style={{ color: active ? l.color : '#1a2332', fontWeight: 600 }}>
                              {l.label}
                            </div>
                            <div className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{l.desc}</div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </Section>

                  <Section title="Subjects You're Studying" icon={BookOpen} color="#6366f1">
                    <TagPicker
                      label="Add subjects you want to learn (up to 8)"
                      values={subjects} all={STUDY_AREAS} max={8} color="#6366f1"
                      onAdd={(v) => setSubjects((p) => [...p, v])}
                      onRemove={(v) => setSubjects((p) => p.filter((x) => x !== v))} />
                  </Section>

                  <Section title="Currently Learning" icon={Sparkles} color="#f59e0b">
                    <Field label="What are you actively working on right now?">
                      <textarea value={currentlyLearning} onChange={(e) => setCurrentlyLearning(e.target.value)} rows={3}
                        className={`${inputCls} resize-none`} style={inputStyle}
                        placeholder="e.g. Building a REST API with Node.js and learning React hooks..." />
                    </Field>
                  </Section>
                </motion.div>
              )}

              {/* ── GOALS ── */}
              {activeTab === 'goals' && (
                <motion.div key="goals"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Your Learning Goals" icon={Target} color="#7ab8ba">
                    <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                      What are you trying to achieve? Select all that apply.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 mb-5">
                      {GOALS.map((g) => {
                        const active = goals.includes(g);
                        return (
                          <motion.button key={g} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => toggleGoal(g)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-left transition-all"
                            style={active
                              ? { background: 'rgba(122,184,186,0.1)', color: '#7ab8ba', border: '1.5px solid rgba(122,184,186,0.4)' }
                              : { background: '#f9fafb', color: '#6b7280', border: '1.5px solid rgba(0,0,0,0.07)' }}>
                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                              style={active ? { background: '#7ab8ba' } : { border: '2px solid rgba(0,0,0,0.15)' }}>
                              {active && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {g}
                          </motion.button>
                        );
                      })}
                    </div>

                    <Field label="Custom Goal (optional)">
                      <div className="flex gap-2">
                        <input value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
                          className={inputCls} style={inputStyle} placeholder="Add your own goal..." />
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const trimmedGoal = customGoal.trim();

                            if (!trimmedGoal) {
                              return;
                            }

                            setGoals((previousGoals) => {
                              if (previousGoals.length >= 10) {
                                return previousGoals;
                              }

                              const alreadyExists = previousGoals.some(
                                (goal) => goal.toLowerCase() === trimmedGoal.toLowerCase(),
                              );

                              if (alreadyExists) {
                                return previousGoals;
                              }

                              return [...previousGoals, trimmedGoal];
                            });

                            setCustomGoal('');
                          }}
                          className="px-4 py-3 rounded-xl text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </Field>
                  </Section>

                  <Section title="Target Timeline" icon={Info} color="#8b5cf6">
                    <div className="grid sm:grid-cols-2 gap-4">
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── SCHEDULE ── */}
              {activeTab === 'schedule' && (
                <motion.div key="schedule"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Available Days" icon={Clock} color="#6366f1">
                    <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                      When can tutors schedule sessions with you?
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS.map((d) => {
                        const on = days.includes(d);
                        return (
                          <motion.button key={d} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                            onClick={() => toggleDay(d)}
                            className="w-14 h-14 rounded-2xl text-sm font-semibold transition-all"
                            style={on
                              ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }
                              : { background: '#f9fafb', color: '#6b7280', border: '1.5px solid rgba(0,0,0,0.08)' }}>
                            {d}
                          </motion.button>
                        );
                      })}
                    </div>
                  </Section>

                  <Section title="Preferred Time Slots" icon={Clock} color="#f59e0b">
                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                      {TIME_SLOTS.map((slot) => {
                        const on = timeSlots.includes(slot);
                        return (
                          <motion.button key={slot} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => toggleSlot(slot)}
                            className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm text-left transition-all"
                            style={on
                              ? { background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1.5px solid rgba(245,158,11,0.35)' }
                              : { background: '#f9fafb', color: '#6b7280', border: '1.5px solid rgba(0,0,0,0.08)' }}>
                            <span>{slot}</span>
                            {on && <Check className="w-4 h-4" />}
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Target Weekly Study Hours">
                        <div className="flex items-center gap-3">
                          <input type="range" min={1} max={40} value={weeklyHours}
                            onChange={(e) => setWeeklyHours(+e.target.value)}
                            className="flex-1 accent-[#7ab8ba]" />
                          <span className="px-3 py-1.5 rounded-xl text-sm font-semibold"
                            style={{ background: 'rgba(122,184,186,0.12)', color: '#7ab8ba', minWidth: '3.5rem', textAlign: 'center' }}>
                            {weeklyHours}h
                          </span>
                        </div>
                      </Field>
                      <Field label="Timezone">
                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                          className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                          {['UTC+5 (PKT)', 'UTC+0 (GMT)', 'UTC-5 (EST)', 'UTC-8 (PST)', 'UTC+1 (CET)', 'UTC+8 (CST)'].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── PREFERENCES ── */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Session Preferences" icon={Heart} color="#ef4444">
                    <p className="text-sm mb-4" style={{ color: '#6b7280' }}>What kind of learning experience do you prefer?</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {SESSION_PREFS.map((p) => {
                        const active = sessionPrefs.includes(p);
                        return (
                          <motion.button key={p} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => togglePref(p)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-left transition-all"
                            style={active
                              ? { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.3)' }
                              : { background: '#f9fafb', color: '#6b7280', border: '1.5px solid rgba(0,0,0,0.07)' }}>
                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                              style={active ? { background: '#ef4444' } : { border: '2px solid rgba(0,0,0,0.15)' }}>
                              {active && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {p}
                          </motion.button>
                        );
                      })}
                    </div>
                  </Section>

                  <Section title="Learning Style" icon={GraduationCap} color="#7ab8ba">
                    <Field label="Describe how you learn best">
                      <textarea value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)} rows={4}
                        className={`${inputCls} resize-none`} style={inputStyle}
                        placeholder="e.g. I learn best through visual examples and practice projects. I prefer slow-paced explanations..." />
                    </Field>
                    <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                      This helps tutors tailor their sessions specifically for you.
                    </p>
                  </Section>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
