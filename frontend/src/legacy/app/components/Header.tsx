import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from './Button';
import {
  GraduationCap, House, Menu, X, MessageCircle, Bell, Medal,
  BookOpen, LayoutDashboard, ChevronDown, LogOut, ArrowRight,
  Settings, User, HelpCircle, Info, Star, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useMessages } from '../context/MessageContext';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  getPostAuthRoute,
  getStoredAuthUser,
  persistAuthSession,
  switchAccountMode,
} from '../services/auth';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useMessages();
  const isSignedIn = Boolean(currentUser);
  const dualDashboardUnlocked = currentUser?.teacherOnboarding?.dashboardUnlocked === true;
  const dashboardHomeRoute = currentUser ? getPostAuthRoute(currentUser.profession) : '/';
  const teacherPassedAssessment = currentUser?.profession === 'teacher'
    && currentUser.teacherOnboarding?.assessment?.passed === true;
  const dashboardRoleLabel = dualDashboardUnlocked
    ? 'Student + Verified Tutor'
    : currentUser?.profession === 'teacher'
      ? 'Teacher Onboarding'
      : 'Pro Student';
  const nextAccountMode = currentUser?.profession === 'teacher' ? 'student' : 'teacher';
  const messageBadge = unreadCount > 0 ? unreadCount : undefined;

  const isMessages = location.pathname.startsWith('/messages');

  const profileMenuItems = !currentUser
    ? []
    : currentUser.profession === 'teacher'
      ? [
        { icon: <ArrowRight className="w-4 h-4" />, label: 'Switch to Student Mode', action: 'switch' as const },
        { icon: <User className="w-4 h-4" />, label: 'My Profile', to: '/teacher-dashboard/edit-profile' },
        { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', to: '/teacher-dashboard' },
        { icon: <MessageCircle className="w-4 h-4" />, label: 'Messages', to: '/messages', badge: messageBadge },
        { icon: <Settings className="w-4 h-4" />, label: 'Settings', to: '/teacher-dashboard/edit-profile' },
        { icon: <HelpCircle className="w-4 h-4" />, label: 'Help & Support', to: '/help' },
      ]
      : [
        { icon: <ArrowRight className="w-4 h-4" />, label: 'Switch to Teacher Mode', action: 'switch' as const },
        { icon: <User className="w-4 h-4" />, label: 'My Profile', to: '/student-dashboard/edit-profile' },
        { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', to: '/student-dashboard' },
        { icon: <MessageCircle className="w-4 h-4" />, label: 'Messages', to: '/messages', badge: messageBadge },
        { icon: <Settings className="w-4 h-4" />, label: 'Settings', to: '/student-dashboard/edit-profile' },
        { icon: <HelpCircle className="w-4 h-4" />, label: 'Help & Support', to: '/help' },
      ];

  const handleSwitchAccount = async () => {
    if (!currentUser) {
      return;
    }

    setSwitchingAccount(true);

    try {
      const response = await switchAccountMode({ profession: nextAccountMode });
      persistAuthSession(response);
      setCurrentUser(response.user);
      setProfileOpen(false);
      setNotifOpen(false);
      setMobileOpen(false);
      navigate(getPostAuthRoute(response.user.profession), { replace: true });
    } finally {
      setSwitchingAccount(false);
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    setCurrentUser(null);
    setProfileOpen(false);
    setNotifOpen(false);
    setMobileOpen(false);
    navigate('/signin', { replace: true });
  };

  useEffect(() => {
    const syncAuthSession = () => {
      setCurrentUser(getStoredAuthUser());
    };

    syncAuthSession();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthSession);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthSession);
    };
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const notifications = [
    { id: 1, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100', name: 'Sarah Johnson', text: 'replied to your message', time: '2m ago', unread: true },
    { id: 2, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', name: 'Michael Chen', text: 'confirmed your session for Thu 3 PM', time: '1h ago', unread: true },
    { id: 3, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100', name: 'Emily Rodriguez', text: 'left you a new review', time: 'Yesterday', unread: false },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link to={isSignedIn ? dashboardHomeRoute : '/'} className="flex items-center gap-2 flex-shrink-0">
            <GraduationCap className="w-8 h-8 text-[var(--teal-300)]" />
            <span
              className="text-2xl tracking-tight text-[var(--navy-900)]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Verilearn
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          {isSignedIn ? (
            /* Dashboard nav links */
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to={dashboardHomeRoute}
                label="Dashboard"
                icon={<LayoutDashboard className="w-4 h-4" />}
                active={location.pathname === dashboardHomeRoute || location.pathname.startsWith(`${dashboardHomeRoute}/`)}
              />
              <NavLink to="/messages" label="Messages" icon={<MessageCircle className="w-4 h-4" />} active={isMessages} badge={messageBadge} />
              <NavLink to="/help" label="Help" icon={<HelpCircle className="w-4 h-4" />} active={location.pathname === '/help'} />
            </nav>
          ) : (
            /* Public nav links */
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="flex items-center gap-1.5 text-[var(--foreground)] hover:text-[var(--teal-300)] transition-colors">
                <House className="w-4 h-4" />
                Home
              </Link>
              <Link to="/about" className="flex items-center gap-1.5 text-[var(--foreground)] hover:text-[var(--teal-300)] transition-colors">
                <Info className="w-4 h-4" />
                About
              </Link>
              <Link to="/help" className="flex items-center gap-1.5 text-[var(--foreground)] hover:text-[var(--teal-300)] transition-colors">
                <HelpCircle className="w-4 h-4" />
                Help
              </Link>
            </nav>
          )}

          {/* ── Right section ── */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {isSignedIn ? (
              /* Logged-in right section */
              <>
                {/* Credit wallet badge */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                  style={{
                    borderColor: 'rgba(245,158,11,0.25)',
                    background: 'rgba(245,158,11,0.06)',
                  }}
                  title="Your credit balance"
                >
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">
                    {currentUser?.learningCredits ?? 0}
                  </span>
                </motion.div>
                {/* Notification / Bronze pass badge */}
                {teacherPassedAssessment ? (
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      title="Teacher assessment passed"
                      style={{
                        borderColor: 'rgba(205,127,50,0.35)',
                        background: 'rgba(205,127,50,0.12)',
                        boxShadow: '0 0 18px rgba(205,127,50,0.22)',
                      }}
                    >
                      <Medal className="w-5 h-5" style={{ color: '#cd7f32' }} />
                    </div>
                  </div>
                ) : (
                  <div ref={notifRef} className="relative">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
                      className="relative w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border)] bg-white hover:border-[var(--primary)] transition-all"
                    >
                      <Bell className="w-4.5 h-4.5 text-[var(--foreground)]" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white" />
                    </motion.button>

                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
                          style={{ zIndex: 100 }}
                        >
                          <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-[var(--border)]">
                            <span className="text-[var(--foreground)] text-sm" style={{ fontWeight: 600 }}>Notifications</span>
                            <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
                              {notifications.filter((n) => n.unread).length} new
                            </span>
                          </div>
                          <div className="divide-y divide-[var(--border)]">
                            {notifications.map((n) => (
                              <motion.div
                                key={n.id}
                                whileHover={{ backgroundColor: 'var(--muted)' }}
                                className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                              >
                                <div className="relative flex-shrink-0">
                                  <ImageWithFallback src={n.avatar} alt={n.name} className="w-9 h-9 rounded-xl object-cover" />
                                  {n.unread && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--primary)] rounded-full border-2 border-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[var(--foreground)]">
                                    <span style={{ fontWeight: 600 }}>{n.name}</span>{' '}
                                    <span className="text-[var(--muted-foreground)]">{n.text}</span>
                                  </p>
                                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{n.time}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <div className="px-4 py-2.5 border-t border-[var(--border)]">
                            <button className="w-full text-center text-xs text-[var(--primary)] hover:text-[var(--teal-500)] transition-colors">
                              View all notifications
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
                    className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--primary)] transition-all"
                  >
                    <div className="relative">
                      <ImageWithFallback
                        src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={currentUser?.name || 'User'}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[1.5px] border-white" />
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-sm text-[var(--foreground)] leading-none mb-0.5" style={{ fontWeight: 600 }}>{currentUser?.name || 'Alex Morgan'}</div>
                      <div className="text-xs text-[var(--muted-foreground)] leading-none">{dashboardRoleLabel}</div>
                    </div>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
                        style={{ zIndex: 100 }}
                      >
                        {/* Profile header */}
                        <div className="px-4 py-3 border-b border-[var(--border)]"
                          style={{ background: 'linear-gradient(135deg, rgba(122,184,186,0.08), rgba(139,92,246,0.05))' }}>
                          <div className="flex items-center gap-2.5">
                            <ImageWithFallback
                              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                              alt={currentUser?.name || 'User'}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                            <div>
                              <div className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>{currentUser?.name || 'Alex Morgan'}</div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-[var(--muted-foreground)]">{dashboardRoleLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1.5">
                          {profileMenuItems.map(({ icon, label, to, badge, action }) => (
                            action === 'switch' ? (
                              <button
                                key={label}
                                type="button"
                                onClick={() => { void handleSwitchAccount(); }}
                                disabled={switchingAccount}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                              >
                                <span className="text-[var(--muted-foreground)]">{icon}</span>
                                {switchingAccount ? 'Switching…' : label}
                              </button>
                            ) : (
                              <Link
                                key={label}
                                to={to}
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                              >
                                <span className="text-[var(--muted-foreground)]">{icon}</span>
                                {label}
                                {badge && (
                                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs text-white"
                                    style={{ background: 'var(--primary)' }}>
                                    {badge}
                                  </span>
                                )}
                              </Link>
                            )
                          ))}
                        </div>

                        <div className="border-t border-[var(--border)] py-1.5">
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Public right section */
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen
              ? <X className="w-6 h-6 text-[var(--navy-900)]" />
              : <Menu className="w-6 h-6 text-[var(--navy-900)]" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-[var(--border)] bg-white overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {isSignedIn ? (
                <>
                  {/* Dashboard user card */}
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-2"
                    style={{ background: 'linear-gradient(135deg, rgba(122,184,186,0.1), rgba(139,92,246,0.06))' }}>
                    <div className="relative">
                      <ImageWithFallback
                        src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={currentUser?.name || 'User'}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <div className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>{currentUser?.name || 'Alex Morgan'}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{dashboardRoleLabel} · <span className="text-amber-600 font-semibold">{currentUser?.learningCredits ?? 0} credits</span></div>
                    </div>
                  </div>
                  <MobileLink to={dashboardHomeRoute} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => setMobileOpen(false)} />
                  <MobileLink to="/messages" icon={<MessageCircle className="w-4 h-4" />} label="Messages" badge={messageBadge} onClick={() => setMobileOpen(false)} />
                  <MobileLink to="/help" icon={<HelpCircle className="w-4 h-4" />} label="Help" onClick={() => setMobileOpen(false)} />
                  <div className="border-t border-[var(--border)] mt-3 pt-3">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <MobileLink to="/" icon={<House className="w-4 h-4" />} label="Home" onClick={() => setMobileOpen(false)} />
                  <MobileLink to="/about" icon={<Info className="w-4 h-4" />} label="About" onClick={() => setMobileOpen(false)} />
                  <MobileLink to="/help" icon={<HelpCircle className="w-4 h-4" />} label="Help" onClick={() => setMobileOpen(false)} />
                  <div className="border-t border-[var(--border)] mt-3 pt-4 flex flex-col gap-2">
                    <Link to="/signin" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" size="md" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" size="md" className="w-full">Get Started</Button>
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── Desktop NavLink ── */
function NavLink({
  to, label, icon, active, badge,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
      style={{
        color: active ? 'var(--primary)' : 'var(--foreground)',
        background: active ? 'rgba(122,184,186,0.1)' : 'transparent',
        fontWeight: active ? 600 : 400,
      }}
    >
      {icon && <span style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}>{icon}</span>}
      {label}
      {badge && (
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white"
          style={{ background: 'var(--primary)' }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ── Mobile Link ── */
function MobileLink({
  to, label, icon, badge, onClick,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--teal-50)] hover:text-[var(--teal-500)] transition-colors"
    >
      {icon && <span className="text-[var(--muted-foreground)]">{icon}</span>}
      {label}
      {badge && (
        <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
          style={{ background: 'var(--primary)' }}>
          {badge}
        </span>
      )}
    </Link>
  );
}