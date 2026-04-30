import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'motion/react';
import { GraduationCap, ArrowUpRight, Heart } from 'lucide-react';

const LINKS = {
  'For Students': [
    { label: 'How It Works', href: '/about' },
    { label: 'Pricing', href: '/help' },
  ],
  'For Tutors': [
    { label: 'Become a Tutor', href: '/signup' },
    { label: 'Tutor Resources', href: '/help' },
    { label: 'Success Stories', href: '/about' },
    { label: 'Support', href: '/help' },
  ],
  'Company': [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '/help' },
  ],
};

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.footer
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1a2332 0%, #0f1a28 100%)' }}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 13, repeat: Infinity, delay: 3 }}
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-10">

        {/* Top divider glow */}
        <motion.div
          className="h-px mb-14"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(122,184,186,0.5), transparent)' }}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="grid md:grid-cols-4 gap-12 mb-14">

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <motion.div
              className="flex items-center gap-2.5 mb-5"
              whileHover={{ scale: 1.04 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                Verilearn
              </span>
            </motion.div>
            <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              Connecting passionate learners with expert tutors worldwide.
            </p>

            {/* Social dots */}
            <div className="flex gap-3 mt-6">
              {['#7ab8ba', '#8b5cf6', '#f59e0b'].map((color, i) => (
                <motion.div
                  key={color}
                  whileHover={{ scale: 1.2, y: -3 }}
                  className="w-8 h-8 rounded-xl cursor-pointer"
                  style={{ background: `${color}25`, border: `1px solid ${color}40` }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Links */}
          {Object.entries(LINKS).map(([heading, links], colIdx) => (
            <motion.div
              key={heading}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.18 + colIdx * 0.08, duration: 0.6 }}
            >
              <h4 className="text-white mb-5" style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(({ label, href }, i) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.25 + colIdx * 0.08 + i * 0.05 }}
                  >
                    <Link
                      to={href}
                      className="group flex items-center gap-1 text-sm transition-all duration-200"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      <motion.span
                        whileHover={{ color: '#7ab8ba', x: 4 }}
                        style={{ display: 'inline-block' }}
                        className="transition-colors duration-200 hover:text-[#7ab8ba]"
                      >
                        {label}
                      </motion.span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" style={{ color: '#7ab8ba' }} />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © 2026 Verilearn. Made with
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Heart className="w-3.5 h-3.5 fill-current" style={{ color: '#ef4444' }} />
            </motion.span>
            for learners everywhere.
          </p>
          <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <motion.a
                key={item}
                href="#"
                whileHover={{ color: '#7ab8ba' }}
                className="transition-colors duration-200 hover:text-[#7ab8ba]"
              >
                {item}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
