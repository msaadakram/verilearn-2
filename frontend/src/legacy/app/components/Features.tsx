import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { Video, MessageSquare, Shield, Star, Globe, Zap, ArrowUpRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Video,
    title: 'Live Video Sessions',
    description: 'Connect face-to-face with tutors through HD video calls and interactive whiteboards.',
    color: '#7ab8ba',
    bgFrom: '#f0f9f9',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Stay connected with instant messaging and get quick answers to your questions.',
    color: '#8b5cf6',
    bgFrom: '#f5f3ff',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Safe and encrypted payment processing with multiple payment options available.',
    color: '#10b981',
    bgFrom: '#f0fdf4',
  },
  {
    icon: Star,
    title: 'Verified Reviews',
    description: 'Make informed decisions with authentic reviews from real students and tutors.',
    color: '#f59e0b',
    bgFrom: '#fffbeb',
  },
  {
    icon: Globe,
    title: 'Global Community',
    description: 'Learn from tutors around the world in any timezone that works for you.',
    color: '#3b82f6',
    bgFrom: '#eff6ff',
  },
  {
    icon: Zap,
    title: 'Instant Matching',
    description: 'Find the perfect tutor in minutes with our smart matching algorithm.',
    color: '#ef4444',
    bgFrom: '#fff1f2',
  },
];

function FeatureCard({
  icon: Icon, title, description, color, bgFrom, index,
}: typeof FEATURES[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const delay = (index % 3) * 0.1 + Math.floor(index / 3) * 0.05;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className="group relative rounded-3xl p-7 cursor-default overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${bgFrom}, #ffffff)`, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
    >
      {/* Hover glow overlay */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(300px circle at 50% 0%, ${color}14, transparent 70%)` }}
      />

      {/* Corner accent */}
      <motion.div
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-all duration-500"
        style={{ background: `${color}08` }}
      />

      {/* Top accent line */}
      <motion.div
        className="absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      {/* Icon */}
      <motion.div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.08, transition: { duration: 0.4 } }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `2px solid ${color}` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
        />
      </motion.div>

      <h3 className="mb-2" style={{ fontSize: '1.1rem', color: '#1a2332', fontWeight: 600 }}>{title}</h3>
      <p className="leading-relaxed text-sm" style={{ color: '#6b7280' }}>{description}</p>

      {/* Arrow link */}
      <motion.div
        className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{ color, fontSize: '0.8rem', fontWeight: 600 }}
        initial={false}
        whileHover={{ x: 4 }}
      >
        Learn more <ArrowUpRight className="w-3.5 h-3.5" />
      </motion.div>
    </motion.div>
  );
}

/* ── How it works section ─────────────────────────────────── */
const STEPS = [
  { num: '01', title: 'Create your profile', desc: 'Sign up in seconds and tell us what you want to learn or teach.', color: '#7ab8ba' },
  { num: '02', title: 'Get matched',          desc: 'Our algorithm connects you with the best-fit tutors instantly.',  color: '#8b5cf6' },
  { num: '03', title: 'Start learning',       desc: 'Book a session and begin your journey with your personal tutor.',  color: '#10b981' },
];

function StepCard({ num, title, desc, color, index }: typeof STEPS[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center text-center group"
    >
      {/* Connector line */}
      {index < STEPS.length - 1 && (
        <motion.div
          className="hidden md:block absolute top-10 left-[calc(50%+3.5rem)] right-[calc(-50%+3.5rem)] h-px"
          style={{ background: `linear-gradient(90deg, ${color}60, ${STEPS[index + 1].color}60)` }}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ delay: index * 0.15 + 0.4, duration: 0.8 }}
        />
      )}

      <motion.div
        className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 8px 28px ${color}40` }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>{num}</span>
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `2px solid ${color}` }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.7 }}
        />
      </motion.div>

      <h3 className="mb-2" style={{ color: '#1a2332', fontWeight: 600 }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#6b7280' }}>{desc}</p>
    </motion.div>
  );
}

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-60px' });

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const bg = useTransform(scrollYProgress, [0, 1], ['#ffffff', '#f0f9f9']);

  return (
    <motion.section ref={sectionRef} style={{ backgroundColor: bg }} className="py-28 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="feat-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1a2332" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#feat-grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div ref={titleRef} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={titleInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm"
            style={{ background: 'rgba(122,184,186,0.1)', color: '#5a9fa1', fontWeight: 600, border: '1px solid rgba(122,184,186,0.25)' }}
          >
            <Zap className="w-4 h-4" /> Platform features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: 'Georgia, serif', color: '#1a2332', letterSpacing: '-0.02em' }}
            className="mb-4"
          >
            Everything you need to succeed
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-xl mx-auto"
            style={{ color: '#6b7280', fontSize: '1.125rem' }}
          >
            Our platform is designed with both students and tutors in mind.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-28">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>

        {/* How it works */}
        <div className="relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm"
              style={{ background: 'rgba(26,35,50,0.06)', color: '#1a2332', fontWeight: 600, border: '1px solid rgba(26,35,50,0.1)' }}
            >
              How it works
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontFamily: 'Georgia, serif', color: '#1a2332' }}
              className="mb-4"
            >
              Up and running in 3 steps
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{ color: '#6b7280' }}
            >
              From signup to your first session — it's that simple.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <StepCard key={step.num} {...step} index={i} />
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 relative rounded-3xl overflow-hidden p-12 text-center"
          style={{ background: 'linear-gradient(135deg, #1a2332 0%, #273447 50%, #1a3a3c 100%)' }}
        >
          {/* BG orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute -top-16 -left-16 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 9, repeat: Infinity, delay: 2 }}
            className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
          />

          <div className="relative">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-white mb-4"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontFamily: 'Georgia, serif' }}
            >
              Ready to start your journey?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="mb-8 mx-auto max-w-md"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              Join thousands of students and tutors already transforming education on Verilearn.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.a
                href="/signup"
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(122,184,186,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-[#1a2332]"
                style={{ background: 'linear-gradient(135deg, #7ab8ba, #a8d5d7)', fontWeight: 600 }}
              >
                Get started free <ArrowUpRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="/about"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, backdropFilter: 'blur(8px)' }}
              >
                Learn more
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
