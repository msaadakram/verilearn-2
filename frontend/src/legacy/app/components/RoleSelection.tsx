import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'motion/react';
import {
  GraduationCap, Users, BookOpen, TrendingUp,
  Calendar, Award, ArrowRight, CheckCircle2,
} from 'lucide-react';

const STUDENT_FEATURES = [
  { icon: BookOpen,   title: 'Browse 1,000+ courses',       sub: 'Across 50+ subjects and skills' },
  { icon: Calendar,   title: 'Flexible scheduling',          sub: 'Book sessions at your convenience' },
  { icon: TrendingUp, title: 'Track your progress',          sub: 'See how far you\'ve come' },
];

const TUTOR_FEATURES = [
  { icon: Users,    title: 'Reach 10,000+ students',    sub: 'Connect with learners globally' },
  { icon: Calendar, title: 'Set your own schedule',     sub: 'Work when it suits you' },
  { icon: Award,    title: 'Build your reputation',     sub: 'Grow with verified reviews' },
];

interface RoleCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: typeof STUDENT_FEATURES;
  icon: React.ReactNode;
  accentColor: string;
  bgGradient: string;
  ctaText: string;
  ctaHref: string;
  ctaStyle: React.CSSProperties;
  delay: number;
  badge: string;
}

function RoleCard({
  title, subtitle, description, features, icon,
  accentColor, bgGradient, ctaText, ctaHref, ctaStyle, delay, badge,
}: RoleCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="relative group rounded-3xl overflow-hidden"
      style={{
        background: bgGradient,
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.8)',
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
        style={{ background: `radial-gradient(400px circle at 50% 0%, ${accentColor}18, transparent 70%)` }}
      />

      {/* Top accent bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ delay: delay + 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="relative p-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: delay + 0.2 }}
          className="absolute top-6 right-6 px-3 py-1 rounded-full text-xs"
          style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30`, fontWeight: 600 }}
        >
          {badge}
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={inView ? { scale: 1, rotate: 0 } : {}}
          transition={{ delay: delay + 0.15, type: 'spring', stiffness: 240, damping: 18 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, boxShadow: `0 8px 24px ${accentColor}40` }}
          whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
        >
          {icon}
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: delay + 0.25 }}
        >
          <p className="text-xs mb-1" style={{ color: accentColor, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {subtitle}
          </p>
          <h3 className="mb-3" style={{ fontSize: '1.75rem', fontFamily: 'Georgia, serif', color: '#1a2332' }}>{title}</h3>
          <p className="mb-7 leading-relaxed" style={{ color: '#6b7280' }}>{description}</p>
        </motion.div>

        {/* Feature list */}
        <div className="space-y-3 mb-8">
          {features.map(({ icon: FIcon, title: t, sub }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: delay + 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 p-3 rounded-xl group/item transition-all hover:shadow-sm"
              style={{ background: 'rgba(255,255,255,0.6)' }}
              whileHover={{ x: 4, background: 'rgba(255,255,255,0.9)' }}
            >
              <motion.div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${accentColor}15` }}
                whileHover={{ scale: 1.1 }}
              >
                <FIcon className="w-4 h-4" style={{ color: accentColor }} />
              </motion.div>
              <div>
                <div className="text-sm" style={{ color: '#1a2332', fontWeight: 600 }}>{t}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>{sub}</div>
              </div>
              <CheckCircle2 className="w-4 h-4 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" style={{ color: accentColor }} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: delay + 0.65 }}
        >
          <Link to={ctaHref} className="block">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: `0 0 32px ${accentColor}50` }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white"
              style={ctaStyle}
            >
              <span style={{ fontWeight: 600 }}>{ctaText}</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function RoleSelection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' });

  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-64 -right-64 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ border: '2px dashed #7ab8ba' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ border: '2px dashed #1a2332' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div ref={titleRef} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm"
            style={{ background: 'rgba(122,184,186,0.1)', color: '#5a9fa1', fontWeight: 600, border: '1px solid rgba(122,184,186,0.25)' }}
          >
            <Users className="w-4 h-4" /> Who are you?
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: 'Georgia, serif', color: '#1a2332', letterSpacing: '-0.02em' }}
            className="mb-4"
          >
            Choose your path
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ color: '#6b7280', fontSize: '1.125rem' }}
            className="max-w-xl mx-auto"
          >
            Whether you're here to learn or teach, we've built the perfect platform for you.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <RoleCard
            title="I'm a Student"
            subtitle="For learners"
            description="Find the perfect tutor, book sessions that fit your schedule, and achieve your learning goals with personalized guidance."
            features={STUDENT_FEATURES}
            icon={<GraduationCap className="w-8 h-8 text-white" />}
            accentColor="#7ab8ba"
            bgGradient="linear-gradient(145deg, #f0f9f9 0%, #f8fffe 100%)"
            ctaText="Start Learning Today"
            ctaHref="/signup"
            ctaStyle={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)', boxShadow: '0 8px 28px rgba(122,184,186,0.4)' }}
            delay={0.1}
            badge="Most popular"
          />
          <RoleCard
            title="I'm a Tutor"
            subtitle="For educators"
            description="Share your expertise, build your reputation, and earn money teaching what you love to eager students worldwide."
            features={TUTOR_FEATURES}
            icon={<Users className="w-8 h-8 text-white" />}
            accentColor="#1a2332"
            bgGradient="linear-gradient(145deg, #f5f6f8 0%, #ffffff 100%)"
            ctaText="Become a Tutor"
            ctaHref="/signup"
            ctaStyle={{ background: 'linear-gradient(135deg, #1a2332, #273447)', boxShadow: '0 8px 28px rgba(26,35,50,0.3)' }}
            delay={0.22}
            badge="Earn income"
          />
        </div>
      </div>
    </section>
  );
}
