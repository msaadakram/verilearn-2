import { useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import {
  Search, ChevronDown, ChevronUp, BookOpen, CreditCard, Users, Settings,
  MessageCircle, Mail, Phone, HelpCircle, GraduationCap, Shield, Clock
} from 'lucide-react';

const categories = [
  { id: 'getting-started', icon: BookOpen, label: 'Getting Started', count: 6 },
  { id: 'account', icon: Settings, label: 'Account & Settings', count: 5 },
  { id: 'billing', icon: CreditCard, label: 'Billing & Payments', count: 4 },
  { id: 'tutors', icon: Users, label: 'Finding Tutors', count: 5 },
  { id: 'sessions', icon: Clock, label: 'Sessions & Scheduling', count: 4 },
  { id: 'safety', icon: Shield, label: 'Trust & Safety', count: 3 },
];

const faqs: Record<string, { q: string; a: string }[]> = {
  'getting-started': [
    { q: 'How do I create an account?', a: 'Click "Get Started" on the homepage and choose whether you\'re a student or tutor. Fill in your details, verify your email, and you\'re ready to go.' },
    { q: 'Is Verilearn free to use?', a: 'Creating an account is free. Students pay per session based on the tutor\'s rate. Tutors keep 85% of their earnings with no upfront costs.' },
    { q: 'What subjects are available?', a: 'We cover 200+ subjects across academics (math, science, languages), test prep (SAT, GRE, GMAT), professional skills, music, and more.' },
    { q: 'How does tutor matching work?', a: 'Our smart matching algorithm considers your learning goals, preferred schedule, budget, and learning style to recommend the best tutors for you.' },
    { q: 'Can I try a session before committing?', a: 'Yes! Many tutors offer a discounted or free introductory session so you can see if it\'s a good fit before booking regular sessions.' },
    { q: 'What devices can I use?', a: 'Verilearn works on any modern web browser. We support desktop, tablet, and mobile devices. A stable internet connection and webcam are recommended for video sessions.' },
  ],
  'account': [
    { q: 'How do I reset my password?', a: 'Go to the Sign In page and click "Forgot Password." Enter your email and we\'ll send you a 6-digit verification code to reset your password.' },
    { q: 'Can I change my email address?', a: 'Yes, go to Settings > Account and update your email. You\'ll need to verify the new email address before the change takes effect.' },
    { q: 'How do I delete my account?', a: 'Go to Settings > Account > Delete Account. Please note this action is permanent and all your data will be removed after a 30-day grace period.' },
    { q: 'Can I switch between student and tutor roles?', a: 'Yes! You can add a tutor profile to an existing student account (or vice versa) from your dashboard settings.' },
    { q: 'How do I update my profile photo?', a: 'Click your avatar in the top right corner, go to Profile, and click the camera icon on your profile photo to upload a new one.' },
  ],
  'billing': [
    { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and bank transfers in select countries.' },
    { q: 'How do refunds work?', a: 'If a session is cancelled by the tutor or doesn\'t meet quality standards, you\'ll receive a full refund within 5-7 business days.' },
    { q: 'When do tutors get paid?', a: 'Tutors are paid weekly every Friday for sessions completed the previous week. Payments are sent via direct deposit or PayPal.' },
    { q: 'Are there any hidden fees?', a: 'No hidden fees. The price you see on a tutor\'s profile is the price you pay. There\'s a small platform fee included in the displayed rate.' },
  ],
  'tutors': [
    { q: 'How are tutors verified?', a: 'All tutors go through our rigorous verification process including identity verification, credential checks, subject proficiency tests, and a mock teaching session review.' },
    { q: 'Can I choose my own tutor?', a: 'Absolutely. You can browse tutors by subject, rating, price, and availability, or use our matching system for personalized recommendations.' },
    { q: 'What if I\'m not satisfied with my tutor?', a: 'You can switch tutors at any time at no cost. If a session didn\'t meet your expectations, contact support and we\'ll help resolve the issue.' },
    { q: 'How do I become a tutor?', a: 'Sign up as a tutor, complete your profile with qualifications and experience, pass our verification process, and set your availability and rates.' },
    { q: 'What qualifications do tutors need?', a: 'Requirements vary by subject but generally include relevant academic credentials, teaching experience, and passing our subject proficiency assessment.' },
  ],
  'sessions': [
    { q: 'How long are sessions?', a: 'Sessions are typically 30, 45, or 60 minutes. You and your tutor can agree on the best duration for your needs.' },
    { q: 'Can I reschedule a session?', a: 'Yes, you can reschedule up to 4 hours before the session start time at no charge. Late cancellations may incur a fee.' },
    { q: 'Are sessions recorded?', a: 'Sessions are not recorded by default for privacy reasons. Both the student and tutor must consent to enable recording.' },
    { q: 'What tools are available during sessions?', a: 'Our virtual classroom includes video/audio, screen sharing, a collaborative whiteboard, file sharing, and an integrated chat.' },
  ],
  'safety': [
    { q: 'How do you protect my personal information?', a: 'We use industry-standard encryption, never share your data with third parties without consent, and comply with GDPR and CCPA regulations.' },
    { q: 'How do I report inappropriate behavior?', a: 'Use the "Report" button available in every session and on every profile page. Our trust & safety team reviews all reports within 24 hours.' },
    { q: 'Is there parental oversight for minors?', a: 'Yes. Accounts for users under 18 require parental consent, and parents can monitor session history and tutor communications from a linked parent account.' },
  ],
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--muted)] transition-colors"
      >
        <span className="text-[var(--navy-900)] pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-[var(--muted-foreground)] leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export function Help() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const activeFaqs = faqs[activeCategory] || [];

  const filteredFaqs = searchQuery.trim()
    ? Object.values(faqs).flat().filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeFaqs;

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-[var(--teal-50)] to-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <div className="w-16 h-16 bg-[var(--teal-100)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-[var(--teal-500)]" />
          </div>
          <h1 className="text-4xl md:text-5xl text-[var(--navy-900)] mb-4" style={{ lineHeight: 1.15 }}>
            How can we help?
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg mb-8">
            Search our knowledge base or browse categories below.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
            />
          </div>
        </div>
      </section>

      {/* Categories + FAQ */}
      <section className="py-16 flex-1">
        <div className="max-w-7xl mx-auto px-6">
          {!searchQuery.trim() && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all ${
                    activeCategory === cat.id
                      ? 'border-[var(--teal-300)] bg-[var(--teal-50)] text-[var(--teal-600)]'
                      : 'border-[var(--border)] hover:border-[var(--teal-200)] text-[var(--muted-foreground)]'
                  }`}
                >
                  <cat.icon className="w-6 h-6" />
                  <span className="text-sm text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            {searchQuery.trim() && (
              <p className="text-[var(--muted-foreground)] mb-6">
                {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            )}
            <div className="space-y-3">
              {filteredFaqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
              {filteredFaqs.length === 0 && (
                <div className="text-center py-12 text-[var(--muted-foreground)]">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No results found. Try a different search term or browse the categories above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl text-[var(--navy-900)] mb-4">Still need help?</h2>
          <p className="text-[var(--muted-foreground)] mb-10 max-w-xl mx-auto">
            Our support team is here for you. Reach out through any of these channels.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-[var(--teal-100)] rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-[var(--teal-500)]" />
              </div>
              <h4 className="text-[var(--navy-900)] mb-1">Live Chat</h4>
              <p className="text-[var(--muted-foreground)] text-sm mb-3">Available 24/7</p>
              <Button variant="secondary" size="sm">Start Chat</Button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-[var(--teal-100)] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-[var(--teal-500)]" />
              </div>
              <h4 className="text-[var(--navy-900)] mb-1">Email Us</h4>
              <p className="text-[var(--muted-foreground)] text-sm mb-3">support@verilearn.com</p>
              <Button variant="outline" size="sm">Send Email</Button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-[var(--teal-100)] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-[var(--teal-500)]" />
              </div>
              <h4 className="text-[var(--navy-900)] mb-1">Call Us</h4>
              <p className="text-[var(--muted-foreground)] text-sm mb-3">Mon–Fri, 9am–6pm</p>
              <Button variant="outline" size="sm">1-800-LEARN</Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}