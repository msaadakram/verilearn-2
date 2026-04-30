import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Camera, Save, User, BookOpen, DollarSign,
  Clock, Globe, GraduationCap, Plus, X,
  Sparkles, Star, Users, Award,
  Briefcase, Layers, Info, Check,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  getTeacherProfile,
  getStoredAuthUser,
  updateStoredAuthUser,
  updateTeacherProfile,
  type TeacherProfilePackage,
} from '../services/auth';
import { syncAvatarToFirebase } from '../services/firebase';

/* ── Constants ──────────────────────────────── */
const ALL_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature',
  'Computer Science', 'Data Science', 'Machine Learning', 'Web Development',
  'Full Stack Development', 'Python', 'JavaScript', 'TypeScript', 'React',
  'Node.js', 'Java', 'C++', 'C#', 'Mobile Development', 'UI/UX Design',
  'Graphic Design', 'Digital Marketing', 'Finance', 'Accounting', 'Economics',
  'Statistics', 'Calculus', 'Algebra', 'History', 'Geography', 'Music',
  'Photography', 'Video Editing', 'Blender 3D', 'Game Development',
];

const ALL_SKILLS = [
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'Flask',
  'TypeScript', 'JavaScript', 'Java', 'C++', 'C#', 'Swift', 'Kotlin',
  'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'AWS', 'Azure', 'Docker',
  'Kubernetes', 'GraphQL', 'REST APIs', 'Machine Learning', 'TensorFlow',
  'PyTorch', 'Pandas', 'NumPy', 'Figma', 'Photoshop', 'Blender',
];

const LANGUAGES = [
  'English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Mandarin',
  'Hindi', 'Portuguese', 'Japanese', 'Korean', 'Italian', 'Russian',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = [
  '6 AM – 9 AM', '9 AM – 12 PM', '12 PM – 3 PM',
  '3 PM – 6 PM', '6 PM – 9 PM', '9 PM – 12 AM',
];

const EDUCATION_LEVELS = ['High School', "Bachelor's", "Master's", 'PhD', 'Professional Certification'];
const EXPERIENCE_OPTIONS = ['< 1 year', '1–2 years', '3–5 years', '6–9 years', '10+ years'];
const SESSION_TYPES = ['1:1 Private', 'Group Sessions', 'Trial Session', 'Recorded Videos', 'Live Workshops'];

const REQUIRED_TEACHER_PROFILE_FIELD_LABELS = {
  title: 'Professional title',
  bio: 'Bio',
  avatarUrl: 'Profile photo',
  tagline: 'Tagline',
  experience: 'Years of experience',
  profileSubjects: 'Subjects taught',
  skills: 'Skills',
  sessionTypes: 'Session types',
  languages: 'Languages',
  availabilityDays: 'Available days',
  timeSlots: 'Time slots',
  creditRate: 'Credit rate',
  education: 'Education details',
} as const;

/* ── Tabs ───────────────────────────────────── */
const TABS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'teaching', label: 'Teaching', icon: BookOpen },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'credentials', label: 'Credentials', icon: Award },
];

/* ── Helper: Tag input ──────────────────────── */
function TagInput({
  label, placeholder, values, all, max = 8, color = '#7ab8ba',
  onAdd, onRemove,
}: {
  label: string; placeholder: string; values: string[]; all: string[];
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
          <motion.span
            key={v} layout
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
          >
            {v}
            <button onClick={() => onRemove(v)} className="hover:opacity-70 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </motion.span>
        ))}
        {values.length < max && (
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm border border-dashed transition-colors"
            style={{ borderColor: color, color, background: `${color}08` }}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="bg-white rounded-2xl shadow-xl border p-3 z-20 relative"
            style={{ borderColor: 'rgba(0,0,0,0.08)' }}
          >
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
              style={{ background: '#f5f7f9', caretColor: color }}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {filtered.slice(0, 20).map((item) => (
                <button
                  key={item}
                  onClick={() => { onAdd(item); setQ(''); setOpen(false); }}
                  className="px-3 py-1 rounded-lg text-xs transition-all hover:scale-105"
                  style={{ background: `${color}12`, color }}
                >
                  {item}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, icon: Icon, children, color = '#7ab8ba' }: {
  title: string; icon: React.ElementType; children: React.ReactNode; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border overflow-hidden mb-6"
      style={{ boxShadow: '0 8px 28px rgba(15,23,42,0.06)', borderColor: 'rgba(122,184,186,0.18)' }}
    >
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

const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2";
const inputStyle = { borderColor: 'rgba(122,184,186,0.3)', background: '#f9fafb', caretColor: '#7ab8ba' };
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

function hasNonEmptyText(value: string) {
  return value.trim().length > 0;
}

function hasNonEmptyStringItems(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

function hasValidEducation(education: Array<{ degree: string; institution: string; year: string }>) {
  return education.length > 0 && education.every((entry) => hasNonEmptyText(entry.degree) && hasNonEmptyText(entry.institution) && hasNonEmptyText(entry.year));
}

function resolveAssetUrl(url: string) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return url;
}

function computeTeacherMissingRequiredFields(data: {
  title: string;
  bio: string;
  avatarUrl: string;
  tagline: string;
  experience: string;
  profileSubjects: string[];
  skills: string[];
  sessionTypes: string[];
  languages: string[];
  availabilityDays: string[];
  timeSlots: string[];
  creditRate: number;
  education: Array<{ degree: string; institution: string; year: string }>;
}) {
  const missing: string[] = [];

  if (!hasNonEmptyText(data.title)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.title);
  if (!hasNonEmptyText(data.bio)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.bio);
  if (!hasNonEmptyText(data.avatarUrl)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.avatarUrl);
  if (!hasNonEmptyText(data.tagline)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.tagline);
  if (!hasNonEmptyText(data.experience)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.experience);
  if (!hasNonEmptyStringItems(data.profileSubjects)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.profileSubjects);
  if (!hasNonEmptyStringItems(data.skills)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.skills);
  if (!hasNonEmptyStringItems(data.sessionTypes)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.sessionTypes);
  if (!hasNonEmptyStringItems(data.languages)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.languages);
  if (data.availabilityDays.length === 0) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.availabilityDays);
  if (data.timeSlots.length === 0) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.timeSlots);
  if (!(Number(data.creditRate) > 0)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.creditRate);
  if (!hasValidEducation(data.education)) missing.push(REQUIRED_TEACHER_PROFILE_FIELD_LABELS.education);

  return missing;
}

/* ══════════════════════════════════════════════════════════ */
export function TeacherEditProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveHintMessage, setSaveHintMessage] = useState<string | null>(null);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);

  /* Personal */
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(() => getStoredAuthUser()?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const persistedAvatarUrlRef = useRef(getStoredAuthUser()?.avatarUrl || '');

  /* Teaching */
  const [subjects, setSubjects] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [sessionTypes, setSessionTypes] = useState<string[]>([]);
  const [teachingStyle, setTeachingStyle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  /* Credit Rate */
  const [creditRate, setCreditRate] = useState(30);

  /* Availability */
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [timezone, setTimezone] = useState('');
  const [sessionLength, setSessionLength] = useState('');

  /* Credentials */
  const [education, setEducation] = useState<Array<{ degree: string; institution: string; year: string }>>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [experience, setExperience] = useState('');

  const toggleDay = (d: string) => setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);
  const toggleSlot = (s: string) => setTimeSlots((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleSessionType = (s: string) => setSessionTypes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const handleAvatarChoose = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    setAvatarFile(file);
    const nextObjectUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextObjectUrl;
    setAvatarUrl(nextObjectUrl);
    event.target.value = '';
  };

  useEffect(() => {
    let active = true;

    const loadTeacherProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSaveHintMessage(null);
      setMissingRequiredFields([]);

      try {
        const response = await getTeacherProfile();
        if (!active) {
          return;
        }

        persistedAvatarUrlRef.current = response.user.avatarUrl || response.profile.avatarUrl || '';
        setName(response.user.name || '');
        setTitle(response.profile.title || '');
        setBio(response.profile.bio || '');
        setTagline(response.profile.tagline || '');
        setAvatarUrl(resolveAssetUrl(response.user.avatarUrl || response.profile.avatarUrl || ''));
        setSubjects(response.profile.profileSubjects || []);
        setSkills(response.profile.skills || []);
        setSessionTypes(response.profile.sessionTypes || []);
        setTeachingStyle(response.profile.teachingStyle || '');
        setTargetAudience(response.profile.targetAudience || '');
        setCreditRate(response.profile.creditRate || 30);
        setDays(response.profile.availabilityDays || []);
        setTimeSlots(response.profile.timeSlots || []);
        setTimezone(response.profile.timezone || '');
        setSessionLength(response.profile.sessionLength ? String(response.profile.sessionLength) : '');
        setEducation(response.profile.education || []);
        setLanguages(response.profile.languages || []);
        setExperience(response.profile.experience || '');
        updateStoredAuthUser(response.user);
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load teacher profile.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadTeacherProfile();

    return () => {
      active = false;

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveHintMessage(null);
    setMissingRequiredFields([]);

    try {
      const response = await updateTeacherProfile({
        name,
        title,
        tagline,
        bio,
        avatarFile,
        avatarUrl: avatarFile ? undefined : persistedAvatarUrlRef.current || undefined,
        profileSubjects: subjects,
        skills,
        sessionTypes,
        teachingStyle,
        targetAudience,
        creditRate,
        availabilityDays: days,
        timeSlots,
        timezone: timezone || undefined,
        sessionLength: sessionLength ? Number(sessionLength) : undefined,
        education,
        languages,
        experience,
      });

      updateStoredAuthUser(response.user);
      persistedAvatarUrlRef.current = response.user.avatarUrl || '';

      // Sync avatar + name to Firebase so Messages/People list reflects the new photo
      const uid = response.user.id;
      const resolvedNewAvatar = resolveAssetUrl(response.user.avatarUrl || response.profile.avatarUrl || '');
      if (uid) {
        void syncAvatarToFirebase(uid, response.user.name || '', resolvedNewAvatar);
      }
      const missingRequiredAfterSave = computeTeacherMissingRequiredFields({
        title,
        bio,
        avatarUrl: avatarFile ? 'uploaded-avatar-selected' : avatarUrl,
        tagline,
        experience,
        profileSubjects: subjects,
        skills,
        sessionTypes,
        languages,
        availabilityDays: days,
        timeSlots,
        creditRate,
        education,
      });

      if (response.onboarding?.profileCompleted) {
        setSaveSuccess(true);
        navigate('/teacher-dashboard', { replace: true });
        return;
      }

      setSaveSuccess(true);
      setSaveHintMessage(response.message || 'Profile saved, but it is not yet 100% complete.');
      setMissingRequiredFields(missingRequiredAfterSave);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save teacher profile.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  /* completion score */
  const completion = (() => {
    const totalRequired = Object.keys(REQUIRED_TEACHER_PROFILE_FIELD_LABELS).length;
    const missingRequired = computeTeacherMissingRequiredFields({
      title,
      bio,
      avatarUrl: avatarFile ? 'uploaded-avatar-selected' : avatarUrl,
      tagline,
      experience,
      profileSubjects: subjects,
      skills,
      sessionTypes,
      languages,
      availabilityDays: days,
      timeSlots,
      creditRate,
      education,
    }).length;

    return Math.max(0, Math.min(100, Math.round(((totalRequired - missingRequired) / totalRequired) * 100)));
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
        <div className="px-6 py-4 rounded-2xl bg-white border border-[rgba(122,184,186,0.25)] text-sm text-[var(--muted-foreground)]">
          Loading teacher profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[73px]" style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
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
            <Link to="/teacher-dashboard">
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-white shadow-sm"
                style={{ borderColor: 'rgba(122,184,186,0.3)' }}>
                <ArrowLeft className="w-4 h-4" style={{ color: '#1a2332' }} />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-[var(--foreground)]" style={{ fontSize: '1.5rem', fontFamily: 'Georgia, serif' }}>
                Edit Tutor Profile
              </h1>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                What students see when they find you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Completion ring */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 border"
              style={{ borderColor: 'rgba(122,184,186,0.2)' }}>
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#f0f9f9" strokeWidth="3" />
                  <motion.circle cx="16" cy="16" r="12" fill="none" stroke="#7ab8ba" strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 75 }}
                    animate={{ strokeDashoffset: 75 - (75 * completion) / 100 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    strokeDasharray="75" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: '0.55rem', fontWeight: 700, color: '#1a2332' }}>
                  {completion}%
                </span>
              </div>
              <span className="text-sm" style={{ color: '#6b7280' }}>Complete</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(122,184,186,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { void handleSave(); }}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)', boxShadow: '0 4px 20px rgba(122,184,186,0.3)', opacity: isSaving ? 0.7 : 1 }}
            >
              <AnimatePresence mode="wait">
                {saveSuccess ? (
                  <motion.span key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Saved!
                  </motion.span>
                ) : (
                  <motion.span key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Profile'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
            {errorMessage}
          </div>
        )}

        {saveHintMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#b45309' }}>
            <div>{saveHintMessage}</div>
            {missingRequiredFields.length > 0 && (
              <ul className="mt-2 list-disc pl-5 space-y-1 text-xs">
                {missingRequiredFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">

          {/* ── Sidebar tabs ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:flex flex-col gap-1 sticky top-24 h-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-left transition-all"
                style={activeTab === id
                  ? { background: 'linear-gradient(135deg, #7ab8ba18, #7ab8ba08)', color: '#7ab8ba', fontWeight: 600, boxShadow: '0 0 0 1.5px rgba(122,184,186,0.3)' }
                  : { color: '#6b7280', background: 'rgba(255,255,255,0.6)' }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {activeTab === id && (
                  <motion.div layoutId="activeTab"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#7ab8ba' }} />
                )}
              </motion.button>
            ))}

            {/* Progress summary */}
            <div className="mt-4 p-4 rounded-2xl bg-white/80 border" style={{ borderColor: 'rgba(122,184,186,0.18)' }}>
              <div className="text-xs mb-2" style={{ color: '#6b7280' }}>Profile strength</div>
              <div className="h-1.5 rounded-full mb-2" style={{ background: '#f0f9f9' }}>
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 1.2 }}
                  style={{ background: completion >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #7ab8ba, #5a9fa1)' }} />
              </div>
              <div className="text-xs" style={{ color: completion >= 80 ? '#10b981' : '#7ab8ba', fontWeight: 600 }}>
                {completion}% — {completion >= 80 ? 'Great!' : 'Keep going!'}
              </div>
            </div>
          </motion.div>

          {/* ── Tab pills (mobile) ── */}
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 mb-2 no-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap"
                style={activeTab === id
                  ? { background: '#7ab8ba', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.8)', color: '#6b7280' }}>
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

                  <Section title="Your Profile Photo" icon={Camera} color="#7ab8ba">
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden"
                          style={{ boxShadow: '0 0 0 3px rgba(122,184,186,0.3)' }}>
                          <ImageWithFallback src={avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                          <Camera className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                      <div>
                        <p className="text-sm mb-3" style={{ color: '#6b7280' }}>
                          Upload a professional photo. Students are 3× more likely to book tutors with a clear profile picture.
                        </p>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={handleAvatarChoose}
                          className="px-4 py-2 rounded-xl text-sm border"
                          style={{ borderColor: 'rgba(122,184,186,0.4)', color: '#7ab8ba', background: 'rgba(122,184,186,0.06)' }}>
                          Upload New Photo
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
                      <Field label="Professional Title">
                        <input value={title} onChange={(e) => setTitle(e.target.value)}
                          className={inputCls} style={inputStyle} placeholder="e.g. Senior Python Engineer & Tutor" />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Tagline (shown below your name)">
                          <input value={tagline} onChange={(e) => setTagline(e.target.value)}
                            className={inputCls} style={inputStyle} placeholder="A short, catchy sentence about what you offer" />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label="About Me (Bio)">
                          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5}
                            className={`${inputCls} resize-none`} style={inputStyle}
                            placeholder="Tell students about your background, passion, and teaching philosophy..." />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>Minimum 100 characters recommended</span>
                            <span className="text-xs" style={{ color: bio.length >= 100 ? '#10b981' : '#9ca3af' }}>{bio.length}/500</span>
                          </div>
                        </Field>
                      </div>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── TEACHING ── */}
              {activeTab === 'teaching' && (
                <motion.div key="teaching"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Subjects You Teach" icon={BookOpen} color="#7ab8ba">
                    <TagInput
                      label="Add the subjects you can teach (up to 6)"
                      placeholder="Search subjects..."
                      values={subjects} all={ALL_SUBJECTS} max={6}
                      onAdd={(v) => setSubjects((p) => [...p, v])}
                      onRemove={(v) => setSubjects((p) => p.filter((x) => x !== v))}
                    />
                  </Section>

                  <Section title="Skills & Technologies" icon={Layers} color="#8b5cf6">
                    <TagInput
                      label="Specific skills / tools / technologies (up to 10)"
                      placeholder="Search skills..."
                      values={skills} all={ALL_SKILLS} max={10} color="#8b5cf6"
                      onAdd={(v) => setSkills((p) => [...p, v])}
                      onRemove={(v) => setSkills((p) => p.filter((x) => x !== v))}
                    />
                  </Section>

                  <Section title="Session Types Offered" icon={Sparkles} color="#f59e0b">
                    <p className="text-sm mb-4" style={{ color: '#6b7280' }}>What kind of sessions can students book with you?</p>
                    <div className="flex flex-wrap gap-2">
                      {SESSION_TYPES.map((s) => {
                        const active = sessionTypes.includes(s);
                        return (
                          <motion.button key={s} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => toggleSessionType(s)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                            style={active
                              ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1.5px solid rgba(245,158,11,0.4)' }
                              : { background: '#f9fafb', color: '#6b7280', border: '1.5px solid rgba(0,0,0,0.08)' }}>
                            {active && <Check className="w-3.5 h-3.5" />}
                            {s}
                          </motion.button>
                        );
                      })}
                    </div>
                  </Section>

                  <Section title="Teaching Style & Approach" icon={GraduationCap} color="#10b981">
                    <div className="space-y-4">
                      <Field label="Your Teaching Style">
                        <textarea value={teachingStyle} onChange={(e) => setTeachingStyle(e.target.value)} rows={3}
                          className={`${inputCls} resize-none`} style={inputStyle}
                          placeholder="Describe your teaching methods — project-based, Socratic, etc." />
                      </Field>
                      <Field label="Who Is Your Ideal Student?">
                        <textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} rows={3}
                          className={`${inputCls} resize-none`} style={inputStyle}
                          placeholder="Describe the type of students you work best with" />
                      </Field>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── PRICING ── */}
              {activeTab === 'pricing' && (
                <motion.div key="pricing"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Credit Rate" icon={DollarSign} color="#10b981">
                    <div className="mb-6">
                      <Field label="Minutes per 1 Credit">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#10b981' }}>⏱</span>
                          <input type="number" value={creditRate} onChange={(e) => setCreditRate(Math.max(1, +e.target.value || 1))}
                            min={1} max={240}
                            className={inputCls} style={{ ...inputStyle, paddingLeft: '3rem' }} />
                        </div>
                      </Field>
                      <div className="mt-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#10b981' }}>
                          💡 Your rate: <strong>{creditRate} min = 1 credit</strong>
                        </p>
                        <div className="space-y-1">
                          {[30, 60, 90, 120].map((dur) => (
                            <p key={dur} className="text-xs" style={{ color: '#6b7280' }}>
                              {dur} min session = <strong style={{ color: '#10b981' }}>{Math.ceil(dur / creditRate)} credit{Math.ceil(dur / creditRate) !== 1 ? 's' : ''}</strong>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── AVAILABILITY ── */}
              {activeTab === 'availability' && (
                <motion.div key="availability"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Available Days" icon={Clock} color="#6366f1">
                    <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Which days are you generally available to teach?</p>
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

                  <Section title="Time Slots" icon={Clock} color="#f59e0b">
                    <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select your preferred teaching hours</p>
                    <div className="grid sm:grid-cols-2 gap-3">
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
                  </Section>

                  <Section title="Session Settings" icon={Info} color="#7ab8ba">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Default Session Length (minutes)">
                        <select value={sessionLength} onChange={(e) => setSessionLength(e.target.value)}
                          className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="">Select default duration</option>
                          {['30', '45', '60', '90', '120'].map((v) => (
                            <option key={v} value={v}>{v} minutes</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Your Timezone">
                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                          className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="">Select timezone</option>
                          {['UTC+5 (PKT)', 'UTC+0 (GMT)', 'UTC-5 (EST)', 'UTC-8 (PST)', 'UTC+1 (CET)', 'UTC+8 (CST)'].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── CREDENTIALS ── */}
              {activeTab === 'credentials' && (
                <motion.div key="credentials"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}>

                  <Section title="Education" icon={GraduationCap} color="#7ab8ba">
                    <div className="space-y-3 mb-4">
                      {education.map((edu, i) => (
                        <div key={i} className="flex gap-3 p-4 rounded-xl" style={{ background: '#f9fafb', border: '1.5px solid rgba(0,0,0,0.06)' }}>
                          <GraduationCap className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#7ab8ba' }} />
                          <div className="flex-1 grid sm:grid-cols-3 gap-3">
                            <Field label="Degree">
                              <select value={edu.degree}
                                onChange={(e) => setEducation((p) => p.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))}
                                className={inputCls} style={{ ...inputStyle, padding: '0.5rem 0.75rem', cursor: 'pointer' }}>
                                <option value="">Select degree</option>
                                {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </Field>
                            <Field label="Institution">
                              <input value={edu.institution}
                                onChange={(e) => setEducation((p) => p.map((x, j) => j === i ? { ...x, institution: e.target.value } : x))}
                                className={inputCls} style={{ ...inputStyle, padding: '0.5rem 0.75rem' }} />
                            </Field>
                            <Field label="Year">
                              <input value={edu.year}
                                onChange={(e) => setEducation((p) => p.map((x, j) => j === i ? { ...x, year: e.target.value } : x))}
                                className={inputCls} style={{ ...inputStyle, padding: '0.5rem 0.75rem' }} />
                            </Field>
                          </div>
                          <button onClick={() => setEducation((p) => p.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setEducation((p) => [...p, { degree: '', institution: '', year: '' }])}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-dashed"
                      style={{ borderColor: 'rgba(122,184,186,0.5)', color: '#7ab8ba', background: 'rgba(122,184,186,0.05)' }}>
                      <Plus className="w-4 h-4" /> Add Education
                    </motion.button>
                  </Section>

                  <Section title="Experience & Languages" icon={Briefcase} color="#1a2332">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="Years of Experience">
                        <select value={experience} onChange={(e) => setExperience(e.target.value)}
                          className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="">Select experience</option>
                          {EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </Field>
                      <div>
                        <TagInput
                          label="Languages You Can Teach In"
                          placeholder="Search languages..."
                          values={languages} all={LANGUAGES} max={5} color="#1a2332"
                          onAdd={(v) => setLanguages((p) => [...p, v])}
                          onRemove={(v) => setLanguages((p) => p.filter((x) => x !== v))}
                        />
                      </div>
                    </div>
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
