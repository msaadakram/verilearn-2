import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, Star,
  BookOpen, Target, Zap, ChevronRight, RotateCcw,
  Share2, Home, Award, Brain,
} from 'lucide-react';
import {
  useQuiz, getBadgeForScore, BADGE_META,
  type QuizQuestion, type BadgeTier,
} from '../context/QuizContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  getQualifiedStudentTeacherById,
  type StudentTeacherDirectoryItem,
} from '../services/auth';

interface QuizTeacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  color: string;
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

function mapTeacherForQuiz(teacher: StudentTeacherDirectoryItem): QuizTeacher {
  return {
    id: teacher.id,
    name: teacher.name,
    subject: teacher.subject || 'General',
    avatar: teacher.avatarUrl || defaultTeacherAvatar,
    color: buildTeacherColor(teacher.id),
  };
}

/* ── Timer ring ─────────────────────────────── */
function TimerRing({ timeLeft, total, color }: { timeLeft: number; total: number; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct  = timeLeft / total;
  const offset = circ * (1 - pct);
  const danger = timeLeft <= Math.ceil(total * 0.3);
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#f0f9f9" strokeWidth="5" />
      <motion.circle cx="32" cy="32" r={r} fill="none"
        stroke={danger ? '#ef4444' : color}
        strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: 'linear' }} />
    </svg>
  );
}

/* ── Score ring ─────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#f0f9f9" strokeWidth="10" />
        <motion.circle cx="72" cy="72" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          style={{ fontSize: '2rem', fontWeight: 800, color }}>
          {score}%
        </motion.div>
        <div className="text-xs" style={{ color: '#9ca3af' }}>score</div>
      </div>
    </div>
  );
}

/* ── Badge card ─────────────────────────────── */
function BadgeCard({ badge }: { badge: BadgeTier }) {
  const m = BADGE_META[badge];
  return (
    <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 1 }}
      className="relative w-32 h-32 mx-auto flex flex-col items-center justify-center rounded-3xl"
      style={{ background: m.bg, border: `2px solid ${m.color}40`, boxShadow: `0 8px 40px ${m.color}30` }}>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: '3rem' }}>
        {m.emoji}
      </motion.div>
      <div className="text-xs font-bold mt-1" style={{ color: m.color }}>{m.label}</div>
      {/* Glow pulse */}
      <motion.div className="absolute inset-0 rounded-3xl"
        animate={{ boxShadow: [`0 0 0px ${m.color}00`, `0 0 30px ${m.color}60`, `0 0 0px ${m.color}00`] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export function StudentQuizTaker() {
  const { quizId }                 = useParams<{ quizId: string }>();
  const navigate                   = useNavigate();
  const { quizzes, saveResult, getResultForQuiz } = useQuiz();

  const quiz    = quizzes.find((q) => q.id === quizId);
  const [teacher, setTeacher] = useState<QuizTeacher | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const prev    = quiz ? getResultForQuiz(quiz.id) : undefined;

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!quiz?.teacherId) {
        if (mounted) {
          setTeacher(null);
          setTeacherLoading(false);
        }
        return;
      }

      try {
        setTeacherLoading(true);
        const response = await getQualifiedStudentTeacherById(quiz.teacherId);

        if (!mounted) {
          return;
        }

        setTeacher(mapTeacherForQuiz(response.teacher));
      } catch {
        if (!mounted) {
          return;
        }

        setTeacher(null);
      } finally {
        if (mounted) {
          setTeacherLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [quiz?.teacherId]);

  /* ── Phase ── */
  type Phase = 'intro' | 'playing' | 'review' | 'results';
  const [phase, setPhase] = useState<Phase>('intro');

  /* ── Playing ── */
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]        = useState<number[]>([]);
  const [selected, setSelected]      = useState<number | null>(null);
  const [revealed, setRevealed]      = useState(false);
  const [timeLeft, setTimeLeft]      = useState(0);
  const [startTime]                  = useState(Date.now());
  const timerRef                     = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Results ── */
  const [result, setResult]          = useState<{ score: number; correct: number; badge: BadgeTier | null } | null>(null);

  const questions: QuizQuestion[] = quiz?.questions ?? [];
  const currentQ = questions[currentIdx];

  /* ── Timer ── */
  useEffect(() => {
    if (phase !== 'playing' || revealed) return;
    setTimeLeft(quiz!.timePerQuestion);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleReveal(-1); // timed out
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, phase]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    clearInterval(timerRef.current!);
    setSelected(idx);
    handleReveal(idx);
  };

  const handleReveal = (idx: number) => {
    setSelected(idx);
    setRevealed(true);
  };

  const handleNext = () => {
    const ans = [...answers, selected ?? -1];
    setAnswers(ans);
    setSelected(null);
    setRevealed(false);
    if (currentIdx + 1 >= questions.length) {
      finishQuiz(ans);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const finishQuiz = (ans: number[]) => {
    const correct = ans.filter((a, i) => a === questions[i].correctIndex).length;
    const score   = Math.round((correct / questions.length) * 100);
    const badge   = getBadgeForScore(score);
    const r = {
      quizId: quiz!.id,
      teacherId: quiz!.teacherId,
      quizTitle: quiz!.title,
      subject: quiz!.subject,
      score,
      correctCount: correct,
      totalCount: questions.length,
      badge,
      timeTaken: Math.round((Date.now() - startTime) / 1000),
      completedAt: new Date().toISOString(),
      answers: ans,
    };
    saveResult(r);
    setResult({ score, correct, badge });
    setPhase('results');
  };

  /* ── Not found ── */
  if (!quiz || (!teacher && !teacherLoading)) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f0f9f9, #f8fafc)' }}>
        <div className="text-center p-10 bg-white rounded-3xl shadow-xl">
          <h2 className="mb-2">Quiz not found</h2>
          <Link to="/student-dashboard" className="text-[var(--primary)] underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f0f9f9, #f8fafc)' }}>
        <div className="text-center p-10 bg-white rounded-3xl shadow-xl">
          <h2 className="mb-2">Loading quiz…</h2>
        </div>
      </div>
    );
  }

  const tColor = teacher.color;

  return (
    <div className="min-h-screen pt-[73px]"
      style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${tColor} 0%, transparent 70%)` }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-10" style={{ zIndex: 1 }}>

        <AnimatePresence mode="wait">

          {/* ══ INTRO ══ */}
          {phase === 'intro' && (
            <motion.div key="intro"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}>
              {/* Back */}
              <Link to={`/student-dashboard/tutors/${teacher.id}`}
                className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
                style={{ color: '#6b7280' }}>
                <ArrowLeft className="w-4 h-4" /> Back to {teacher.name.split(' ')[0]}'s profile
              </Link>

              {/* Quiz card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden"
                style={{ boxShadow: `0 8px 50px ${tColor}20`, border: `1px solid ${tColor}20` }}>
                {/* Hero */}
                <div className="relative h-40 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, #1a2332, #273447, ${tColor}44)` }}>
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
                    style={{ background: `radial-gradient(circle, ${tColor} 0%, transparent 70%)` }} />
                  <div className="absolute inset-0 flex items-center gap-5 px-8">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
                      style={{ boxShadow: `0 0 0 3px ${tColor}60` }}>
                      <ImageWithFallback src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Quiz by</div>
                      <div className="text-white font-semibold">{teacher.name}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{teacher.subject}</div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <h1 style={{ fontSize: '1.5rem', color: '#1a2332', fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>
                    {quiz.title}
                  </h1>
                  <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                    {quiz.topic}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                      { icon: <BookOpen className="w-4 h-4" />, value: `${questions.length}`, label: 'Questions' },
                      { icon: <Clock className="w-4 h-4" />,    value: `${quiz.timePerQuestion}s`, label: 'Per question' },
                      { icon: <Target className="w-4 h-4" />,    value: quiz.difficulty, label: 'Difficulty' },
                      { icon: <Star className="w-4 h-4" />,      value: `${quiz.avgScore}%`, label: 'Avg score' },
                    ].map(({ icon, value, label }) => (
                      <div key={label} className="text-center p-3 rounded-2xl"
                        style={{ background: `${tColor}08`, border: `1px solid ${tColor}20` }}>
                        <div className="flex justify-center mb-1" style={{ color: tColor }}>{icon}</div>
                        <div className="text-sm font-bold" style={{ color: '#1a2332' }}>{value}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Badge tiers */}
                  <div className="mb-6 p-4 rounded-2xl" style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="text-xs font-semibold mb-3" style={{ color: '#6b7280' }}>Badge Thresholds</div>
                    <div className="grid grid-cols-4 gap-2">
                      {(['platinum', 'gold', 'silver', 'bronze'] as BadgeTier[]).map((tier) => {
                        const m = BADGE_META[tier];
                        const threshold = tier === 'platinum' ? '95%+' : tier === 'gold' ? '85%+' : tier === 'silver' ? '70%+' : '50%+';
                        return (
                          <div key={tier} className="text-center p-2 rounded-xl"
                            style={{ background: m.bg, border: `1px solid ${m.color}30` }}>
                            <div style={{ fontSize: '1.3rem' }}>{m.emoji}</div>
                            <div className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</div>
                            <div className="text-xs" style={{ color: '#9ca3af' }}>{threshold}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Previous result */}
                  {prev && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                      style={{ background: 'rgba(122,184,186,0.08)', border: '1px solid rgba(122,184,186,0.2)' }}>
                      <div style={{ fontSize: '1.5rem' }}>{prev.badge ? BADGE_META[prev.badge].emoji : '📝'}</div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: '#1a2332' }}>
                          Previous attempt: {prev.score}%
                          {prev.badge && <span style={{ color: BADGE_META[prev.badge].color }}> · {BADGE_META[prev.badge].label}</span>}
                        </div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>
                          {prev.correctCount}/{prev.totalCount} correct · Retake to improve your badge
                        </div>
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: `0 0 40px ${tColor}50` }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setCurrentIdx(0); setAnswers([]); setSelected(null); setRevealed(false); setPhase('playing'); }}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white"
                    style={{ background: `linear-gradient(135deg, ${tColor}, ${tColor}cc)` }}>
                    <Zap className="w-5 h-5" />
                    {prev ? 'Retake Quiz' : 'Start Quiz'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ PLAYING ══ */}
          {phase === 'playing' && currentQ && (
            <motion.div key={`q-${currentIdx}`}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

              {/* Top bar */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setPhase('intro')} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: '#6b7280' }}>
                  <ArrowLeft className="w-4 h-4" /> Exit
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <TimerRing timeLeft={timeLeft} total={quiz.timePerQuestion} color={tColor} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: timeLeft <= Math.ceil(quiz.timePerQuestion * 0.3) ? '#ef4444' : tColor }}>
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: '#6b7280' }}>
                    {currentIdx + 1} / {questions.length}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: '#f0f9f9' }}>
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  style={{ background: `linear-gradient(90deg, ${tColor}, ${tColor}bb)` }} />
              </div>

              {/* Question card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden mb-5"
                style={{ boxShadow: `0 8px 50px ${tColor}15`, border: `1px solid ${tColor}15` }}>
                <div className="px-8 py-6 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs"
                      style={{
                        background: currentQ.difficulty === 'Easy' ? '#d1fae5' : currentQ.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2',
                        color: currentQ.difficulty === 'Easy' ? '#065f46' : currentQ.difficulty === 'Medium' ? '#92400e' : '#7f1d1d',
                      }}>
                      {currentQ.difficulty}
                    </span>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>{currentQ.points} pts</span>
                  </div>
                  <h2 style={{ fontSize: '1.15rem', color: '#1a2332', lineHeight: 1.5 }}>
                    {currentQ.question}
                  </h2>
                </div>

                <div className="p-6 space-y-3">
                  {currentQ.options.map((opt, oi) => {
                    const isSelected = selected === oi;
                    const isCorrect  = oi === currentQ.correctIndex;
                    let bg = '#f9fafb', border = 'rgba(0,0,0,0.08)', color = '#374151';
                    if (revealed) {
                      if (isCorrect)       { bg = 'rgba(16,185,129,0.08)'; border = 'rgba(16,185,129,0.4)'; color = '#065f46'; }
                      else if (isSelected) { bg = 'rgba(239,68,68,0.08)';  border = 'rgba(239,68,68,0.4)';  color = '#7f1d1d'; }
                    } else if (isSelected) { bg = `${tColor}12`; border = `${tColor}50`; color = '#1a2332'; }
                    return (
                      <motion.button key={oi}
                        whileHover={!revealed ? { x: 6, scale: 1.01 } : {}}
                        whileTap={!revealed ? { scale: 0.98 } : {}}
                        onClick={() => handleSelect(oi)}
                        disabled={revealed}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                        style={{ background: bg, border: `2px solid ${border}`, cursor: revealed ? 'default' : 'pointer' }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{
                            background: revealed && isCorrect ? '#10b981' : revealed && isSelected && !isCorrect ? '#ef4444' : isSelected ? tColor : '#e5e7eb',
                            color: (revealed && isCorrect) || (revealed && isSelected) || isSelected ? '#fff' : '#6b7280',
                          }}>
                          {revealed && isCorrect ? <CheckCircle2 className="w-4 h-4" /> : revealed && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                        </div>
                        <span className="flex-1 text-sm" style={{ color }}>{opt}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {revealed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="mx-6 mb-6 px-5 py-4 rounded-2xl"
                        style={{ background: 'rgba(122,184,186,0.08)', border: '1px solid rgba(122,184,186,0.2)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="w-3.5 h-3.5" style={{ color: '#7ab8ba' }} />
                          <span className="text-xs font-semibold" style={{ color: '#7ab8ba' }}>Explanation</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{currentQ.explanation}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Next button */}
              <AnimatePresence>
                {revealed && (
                  <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white"
                    style={{ background: `linear-gradient(135deg, ${tColor}, ${tColor}cc)`, boxShadow: `0 4px 24px ${tColor}40` }}>
                    {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══ RESULTS ══ */}
          {phase === 'results' && result && (
            <motion.div key="results"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}>
              {/* Hero */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden mb-5"
                style={{ boxShadow: `0 12px 60px ${result.badge ? BADGE_META[result.badge].color + '30' : '#00000010'}`, border: '1px solid rgba(0,0,0,0.07)' }}>
                <div className="relative py-10 px-8 text-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a2332, #273447)' }}>
                  {[...Array(6)].map((_, i) => (
                    <motion.div key={i}
                      animate={{ opacity: [0, 0.8, 0], y: [0, -20, 0] }}
                      transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-white"
                      style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }} />
                  ))}
                  <h2 className="text-white text-xl mb-1">Quiz Complete! 🎊</h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{quiz.title}</p>
                </div>

                <div className="px-8 py-8">
                  <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                    {/* Score ring */}
                    <div className="flex-shrink-0">
                      <ScoreRing score={result.score}
                        color={result.badge ? BADGE_META[result.badge].color : '#9ca3af'} />
                    </div>

                    {/* Badge */}
                    {result.badge ? (
                      <div className="flex-1 text-center sm:text-left">
                        <BadgeCard badge={result.badge} />
                        <p className="text-sm mt-4" style={{ color: '#6b7280' }}>
                          {BADGE_META[result.badge].desc}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 text-center sm:text-left">
                        <div className="text-4xl mb-3">😔</div>
                        <div className="text-lg font-semibold mb-1" style={{ color: '#1a2332' }}>No badge this time</div>
                        <p className="text-sm" style={{ color: '#6b7280' }}>Score 50%+ to earn a Bronze badge. Keep practising!</p>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { icon: <CheckCircle2 className="w-4 h-4" />, value: result.correct, label: 'Correct', color: '#10b981' },
                      { icon: <XCircle className="w-4 h-4" />,      value: result.correct !== result.correct ? result.correct : questions.length - result.correct, label: 'Incorrect', color: '#ef4444' },
                      { icon: <Clock className="w-4 h-4" />,         value: `${Math.floor((Date.now() - (Date.now() - (getResultForQuiz(quiz.id)?.timeTaken ?? 0) * 1000)) / 60000) || Math.floor((getResultForQuiz(quiz.id)?.timeTaken ?? 0) / 60)}m`, label: 'Time', color: tColor },
                    ].map(({ icon, value, label, color }) => (
                      <div key={label} className="text-center p-4 rounded-2xl"
                        style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                        <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
                        <div className="text-xl font-bold" style={{ color }}>{value}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Question breakdown */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold mb-3" style={{ color: '#6b7280' }}>Question Breakdown</div>
                    <div className="space-y-2">
                      {questions.map((q, i) => {
                        const userAns = getResultForQuiz(quiz.id)?.answers[i] ?? -1;
                        const correct = userAns === q.correctIndex;
                        return (
                          <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: correct ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                            {correct
                              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                              : <XCircle className="w-4 h-4 flex-shrink-0 text-red-400" />}
                            <span className="text-xs flex-1 truncate" style={{ color: '#374151' }}>
                              Q{i + 1}. {q.question}
                            </span>
                            <span className="text-xs flex-shrink-0 font-semibold" style={{ color: correct ? '#10b981' : '#ef4444' }}>
                              {correct ? `+${q.points}pts` : '0pts'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { setCurrentIdx(0); setAnswers([]); setSelected(null); setRevealed(false); setPhase('playing'); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm"
                      style={{ borderColor: `${tColor}40`, color: tColor, background: `${tColor}08` }}>
                      <RotateCcw className="w-4 h-4" /> Retake Quiz
                    </motion.button>
                    <Link to="/student-dashboard" className="flex-1">
                      <motion.button whileHover={{ scale: 1.03, boxShadow: `0 0 24px ${tColor}40` }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm"
                        style={{ background: `linear-gradient(135deg, ${tColor}, ${tColor}cc)` }}>
                        <Home className="w-4 h-4" /> Dashboard
                      </motion.button>
                    </Link>
                    <Link to={`/student-dashboard/tutors/${teacher.id}`} className="flex-1">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm"
                        style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#374151', background: '#f9fafb' }}>
                        <Award className="w-4 h-4" /> Tutor Profile
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
