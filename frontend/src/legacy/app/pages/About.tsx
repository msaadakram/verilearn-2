import { Link } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Target, Heart, Globe, Users, BookOpen, Award } from 'lucide-react';

const stats = [
  { label: 'Active Students', value: '50,000+' },
  { label: 'Expert Tutors', value: '3,500+' },
  { label: 'Subjects Covered', value: '200+' },
  { label: 'Countries Reached', value: '120+' },
];

const values = [
  { icon: Target, title: 'Mission-Driven', description: 'We believe every student deserves access to world-class education, regardless of location or background.' },
  { icon: Heart, title: 'Student-First', description: 'Everything we build starts with the learner. Our platform is designed to make learning personal, effective, and enjoyable.' },
  { icon: Globe, title: 'Global Access', description: 'We connect students and tutors across borders, breaking down barriers to quality education worldwide.' },
];

const team = [
  { name: 'Sarah Chen', role: 'CEO & Co-Founder', bio: 'Former education researcher at Stanford with 15 years in EdTech.' },
  { name: 'Marcus Williams', role: 'CTO & Co-Founder', bio: 'Previously led engineering at two successful SaaS startups.' },
  { name: 'Dr. Amara Okafor', role: 'Head of Curriculum', bio: 'PhD in Education, passionate about adaptive learning methodologies.' },
  { name: 'James Rivera', role: 'Head of Design', bio: 'Award-winning UX designer focused on accessible digital experiences.' },
];

export function About() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-[var(--teal-50)] to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-[var(--teal-100)] text-[var(--teal-600)] rounded-full text-sm mb-6">
                About Verilearn
              </span>
              <h1 className="text-4xl md:text-5xl text-[var(--navy-900)] mb-6" style={{ lineHeight: 1.15 }}>
                Reimagining education for a connected world
              </h1>
              <p className="text-[var(--muted-foreground)] text-lg leading-relaxed">
                Founded in 2023, Verilearn was born from a simple idea: that the right tutor can transform a student's
                relationship with learning. We're building the bridge between passionate learners and expert educators.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758691736975-9f7f643d178e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwdGVhbSUyMGNvbGxhYm9yYXRpb24lMjBvZmZpY2V8ZW58MXx8fHwxNzc2NjcyODg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Verilearn team"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[var(--navy-900)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl text-[var(--teal-300)] mb-2">{s.value}</div>
              <div className="text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1664223308156-3d374ea8d7eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjB0dXRvcmluZyUyMGVkdWNhdGlvbiUyMGxhcHRvcHxlbnwxfHx8fDE3NzY2OTQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Online tutoring session"
                className="w-full h-80 object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl text-[var(--navy-900)] mb-6">Our Story</h2>
              <p className="text-[var(--muted-foreground)] leading-relaxed mb-4">
                Verilearn started when our founders, both lifelong learners, realized that finding the right tutor was
                needlessly difficult. Great teachers existed everywhere, but students couldn't find them.
              </p>
              <p className="text-[var(--muted-foreground)] leading-relaxed mb-4">
                We built a platform that uses smart matching to pair students with tutors who fit their learning style,
                schedule, and goals. Our proprietary verification system ensures every tutor meets rigorous quality standards.
              </p>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                Today, Verilearn serves students in over 120 countries, facilitating thousands of learning sessions every day.
                But we're just getting started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[var(--teal-50)]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl text-[var(--navy-900)] mb-4">Our Values</h2>
          <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto mb-12">
            These principles guide everything we do — from the features we build to the tutors we welcome.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-8 shadow-sm">
                <div className="w-14 h-14 bg-[var(--teal-100)] rounded-xl flex items-center justify-center mx-auto mb-5">
                  <v.icon className="w-7 h-7 text-[var(--teal-500)]" />
                </div>
                <h3 className="text-[var(--navy-900)] mb-3">{v.title}</h3>
                <p className="text-[var(--muted-foreground)] leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl text-[var(--navy-900)] mb-4">Meet the Team</h2>
          <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto mb-12">
            A passionate group of educators, engineers, and designers working to make learning better for everyone.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {team.map((t) => (
              <div key={t.name} className="bg-[var(--muted)] rounded-xl p-6">
                <div className="w-20 h-20 bg-[var(--teal-200)] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-[var(--teal-600)]" />
                </div>
                <h4 className="text-[var(--navy-900)]">{t.name}</h4>
                <p className="text-[var(--teal-500)] text-sm mb-2">{t.role}</p>
                <p className="text-[var(--muted-foreground)] text-sm">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--navy-900)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl text-white mb-4">Ready to start learning?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of students and tutors already on Verilearn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center px-8 py-3 bg-[var(--teal-300)] text-white rounded-xl hover:bg-[var(--teal-400)] transition-colors">
              Get Started Free
            </Link>
            <Link to="/help" className="inline-flex items-center justify-center px-8 py-3 border-2 border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}