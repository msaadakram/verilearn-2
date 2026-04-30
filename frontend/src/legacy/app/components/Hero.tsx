import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform, useSpring, useInView } from 'motion/react';
import { GraduationCap, Users, ArrowRight, Star, Play, Sparkles, TrendingUp, Clock } from 'lucide-react';

/* ── Animated counter ─────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Floating particle ────────────────────────────────────── */
function Particle({ x, y, delay, size }: { x: string; y: string; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: 'rgba(122,184,186,0.35)' }}
      animate={{ y: [-8, 8, -8], opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

/* ── Orbiting badge ───────────────────────────────────────── */
function FloatingBadge({
  children, className, delay, x, y,
}: { children: React.ReactNode; className?: string; delay: number; x: string; y: string }) {
  return (
    <motion.div
      className={`absolute flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-xl border border-white/60 backdrop-blur-sm z-10 ${className}`}
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.06, y: -4 }}
    >
      {children}
    </motion.div>
  );
}

const PARTICLES = [
  { x: '8%',  y: '20%', delay: 0,   size: 6  },
  { x: '15%', y: '70%', delay: 0.8, size: 4  },
  { x: '80%', y: '15%', delay: 1.2, size: 8  },
  { x: '88%', y: '60%', delay: 0.4, size: 5  },
  { x: '50%', y: '5%',  delay: 1.6, size: 4  },
  { x: '92%', y: '85%', delay: 0.6, size: 6  },
  { x: '3%',  y: '50%', delay: 2,   size: 5  },
  { x: '60%', y: '90%', delay: 1,   size: 4  },
];

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const springY1 = useSpring(y1, { stiffness: 80, damping: 20 });
  const springY2 = useSpring(y2, { stiffness: 60, damping: 20 });

  /* Mouse spotlight */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const textVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };
  const wordVariant = {
    hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 180, damping: 22 } },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #f0f9f9 0%, #e8f4f5 30%, #f5f3ff 70%, #f8fafc 100%)' }}
      onMouseMove={handleMouse}
    >
      {/* Mouse spotlight glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(122,184,186,0.08), transparent 50%)`,
        }}
      />

      {/* Animated background blobs */}
      <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 65%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -bottom-40 -right-40 w-[800px] h-[800px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 65%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1a2332" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </motion.div>

      {/* Floating particles */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      <motion.div
        style={{ opacity, scale }}
        className="relative max-w-7xl mx-auto px-6 pt-28 pb-16 min-h-screen flex items-center"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* ── Left column ── */}
          <motion.div style={{ y: springY2, zIndex: 1 }} className="relative">

            {/* Badge pill */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 cursor-default"
              style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(122,184,186,0.3)', boxShadow: '0 4px 20px rgba(122,184,186,0.15)' }}
              whileHover={{ scale: 1.04 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4" style={{ color: '#7ab8ba' }} />
              </motion.div>
              <span className="text-sm" style={{ color: '#5a9fa1', fontWeight: 600 }}>
                Welcome to the future of learning
              </span>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#10b981' }}
              />
            </motion.div>

            {/* Headline */}
            <motion.div
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              {['Learn anything,', 'anytime,', 'anywhere.'].map((word, i) => (
                <motion.div key={i} variants={wordVariant}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                      lineHeight: 1.1,
                      fontFamily: 'Georgia, serif',
                      color: i === 1 ? '#7ab8ba' : '#1a2332',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {word}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10 max-w-lg leading-relaxed"
              style={{ color: '#6b7280', fontSize: '1.125rem' }}
            >
              Connect with expert tutors or start your learning journey as a student.
              Verilearn makes personalized education accessible to everyone.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(122,184,186,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-7 py-4 rounded-2xl text-white group"
                  style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)', boxShadow: '0 8px 32px rgba(122,184,186,0.35)' }}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span style={{ fontWeight: 600 }}>Start as Student</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </Link>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(26,35,50,0.2)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-7 py-4 rounded-2xl group"
                  style={{ background: '#1a2332', color: '#fff', boxShadow: '0 8px 24px rgba(26,35,50,0.2)' }}
                >
                  <Users className="w-5 h-5" />
                  <span style={{ fontWeight: 600 }}>Become a Tutor</span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex items-center gap-6"
            >
              {[
                { value: 10000, suffix: '+', label: 'Students' },
                { value: 500,   suffix: '+', label: 'Tutors'   },
                { value: 50,    suffix: '+', label: 'Subjects' },
              ].map(({ value, suffix, label }, i) => (
                <div key={label} className="flex items-center gap-6">
                  {i > 0 && <div className="h-10 w-px" style={{ background: 'rgba(0,0,0,0.1)' }} />}
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>
                      <Counter to={value} suffix={suffix} />
                    </div>
                    <div className="text-sm" style={{ color: '#6b7280' }}>{label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right column — floating cards ── */}
          <motion.div
            style={{ y: springY1, zIndex: 1 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Main visual orb */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[420px] h-[420px] rounded-full"
              style={{ background: 'conic-gradient(from 0deg, rgba(122,184,186,0.15), rgba(139,92,246,0.1), rgba(122,184,186,0.15))', border: '1px dashed rgba(122,184,186,0.25)' }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[320px] h-[320px] rounded-full"
              style={{ border: '1px dashed rgba(139,92,246,0.2)' }}
            />

            {/* Center icon */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #1a2332, #273447)', boxShadow: '0 20px 60px rgba(26,35,50,0.4)' }}
            >
              <GraduationCap className="w-14 h-14 text-white" />
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
                style={{ background: 'rgba(122,184,186,0.4)' }}
              />
            </motion.div>

            {/* Floating badges */}
            <FloatingBadge delay={0.5} x="-24px" y="30px">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Star className="w-4 h-4" style={{ color: '#10b981' }} />
              </div>
              <div>
                <div className="text-xs text-gray-400">Average rating</div>
                <div style={{ fontWeight: 700, color: '#1a2332' }}>4.9 / 5.0</div>
              </div>
            </FloatingBadge>

            <FloatingBadge delay={0.8} x="60%" y="-20px">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(122,184,186,0.12)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#7ab8ba' }} />
              </div>
              <div>
                <div className="text-xs text-gray-400">Sessions today</div>
                <div style={{ fontWeight: 700, color: '#1a2332' }}>1,248</div>
              </div>
            </FloatingBadge>

            <FloatingBadge delay={1.1} x="65%" y="72%">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
                <Clock className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <div className="text-xs text-gray-400">Response time</div>
                <div style={{ fontWeight: 700, color: '#1a2332' }}>&lt; 2 min</div>
              </div>
            </FloatingBadge>

            <FloatingBadge delay={0.6} x="-32px" y="72%">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <Play className="w-4 h-4" style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <div className="text-xs text-gray-400">Live sessions</div>
                <div style={{ fontWeight: 700, color: '#1a2332' }}>326 now</div>
              </div>
            </FloatingBadge>

            {/* Orbiting dots */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{ background: i % 2 === 0 ? '#7ab8ba' : '#8b5cf6' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
                initial={{ rotate: i * 90 }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ transform: `translateX(${190 + i * 15}px)` }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ zIndex: 2 }}>
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none" style={{ height: 80, display: 'block' }}>
          <motion.path
            initial={{ d: 'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z' }}
            animate={{ d: ['M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z', 'M0,20 C400,60 1040,10 1440,50 L1440,80 L0,80 Z', 'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}