import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Mail, Lock, User, Eye, EyeOff, GraduationCap, Users } from 'lucide-react';
import { Button } from './Button';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: 'signin' | 'signup' | 'forgot';
}

export function AuthModal({ open, onOpenChange, defaultView = 'signin' }: AuthModalProps) {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot'>(defaultView);

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'teacher'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', view, formData);
    onOpenChange(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl text-[var(--navy-900)]" style={{ fontFamily: 'Georgia, serif' }}>
                {view === 'signin' && 'Welcome back'}
                {view === 'signup' && 'Create account'}
                {view === 'forgot' && 'Reset password'}
              </Dialog.Title>
              <Dialog.Close className="text-[var(--muted-foreground)] hover:text-[var(--navy-900)] transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-[var(--muted-foreground)] mb-6">
              {view === 'signin' && 'Sign in to your account to continue'}
              {view === 'signup' && 'Join Verilearn and start your learning journey'}
              {view === 'forgot' && "Enter your email and we'll send you a reset link"}
            </Dialog.Description>

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm text-[var(--navy-900)] mb-3">
                      I want to join as
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'student'
                            ? 'border-[var(--teal-300)] bg-[var(--teal-50)]'
                            : 'border-[var(--border)] bg-white hover:border-[var(--teal-200)]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.role === 'student' ? 'bg-[var(--teal-300)]' : 'bg-[var(--input-background)]'
                        }`}>
                          <GraduationCap className={`w-5 h-5 ${
                            formData.role === 'student' ? 'text-white' : 'text-[var(--muted-foreground)]'
                          }`} />
                        </div>
                        <div className="text-left">
                          <div className={`text-sm ${
                            formData.role === 'student' ? 'text-[var(--navy-900)]' : 'text-[var(--foreground)]'
                          }`}>
                            Student
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">Learn & grow</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'teacher' }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'teacher'
                            ? 'border-[var(--teal-300)] bg-[var(--teal-50)]'
                            : 'border-[var(--border)] bg-white hover:border-[var(--teal-200)]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.role === 'teacher' ? 'bg-[var(--teal-300)]' : 'bg-[var(--input-background)]'
                        }`}>
                          <Users className={`w-5 h-5 ${
                            formData.role === 'teacher' ? 'text-white' : 'text-[var(--muted-foreground)]'
                          }`} />
                        </div>
                        <div className="text-left">
                          <div className={`text-sm ${
                            formData.role === 'teacher' ? 'text-[var(--navy-900)]' : 'text-[var(--foreground)]'
                          }`}>
                            Teacher
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">Teach & earn</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm text-[var(--navy-900)] mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm text-[var(--navy-900)] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                    required
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <label htmlFor="password" className="block text-sm text-[var(--navy-900)] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--navy-900)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-[var(--navy-900)] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {view === 'signin' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--teal-300)] focus:ring-[var(--teal-300)]"
                    />
                    <span className="text-sm text-[var(--muted-foreground)]">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm text-[var(--teal-400)] hover:text-[var(--teal-500)] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" size="lg">
                {view === 'signin' && 'Sign In'}
                {view === 'signup' && 'Create Account'}
                {view === 'forgot' && 'Send Reset Link'}
              </Button>

              {view === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="w-full text-center text-sm text-[var(--muted-foreground)] hover:text-[var(--navy-900)] transition-colors"
                >
                  Back to sign in
                </button>
              )}
            </form>

            {view !== 'forgot' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[var(--muted-foreground)]">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[var(--border)] rounded-xl hover:bg-[var(--input-background)] transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm text-[var(--navy-900)]">Google</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[var(--border)] rounded-xl hover:bg-[var(--input-background)] transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-sm text-[var(--navy-900)]">Facebook</span>
                  </button>
                </div>

                <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                  {view === 'signin' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setView('signup')}
                        className="text-[var(--teal-400)] hover:text-[var(--teal-500)] transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setView('signin')}
                        className="text-[var(--teal-400)] hover:text-[var(--teal-500)] transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
