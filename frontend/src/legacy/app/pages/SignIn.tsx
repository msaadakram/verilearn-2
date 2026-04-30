import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthBackground } from '../components/AuthBackground';
import { getPostAuthRoute, persistAuthSession, signIn } from '../services/auth';

export function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setIsSubmitting(true);

      const response = await signIn({
        email: formData.email,
        password: formData.password,
      });

      persistAuthSession(response);
      navigate(getPostAuthRoute(response.user.profession), { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';

      if (/not verified/i.test(message) && formData.email) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`, { replace: true });
        return;
      }

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <GraduationCap className="w-10 h-10 text-[var(--teal-300)]" />
            <span className="text-3xl tracking-tight text-[var(--navy-900)]" style={{ fontFamily: 'Georgia, serif' }}>
              Verilearn
            </span>
          </Link>
        </div>

        <div className="relative">
          {/* Decorative background behind card */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[var(--teal-300)] to-[var(--teal-400)] rounded-3xl opacity-10 blur-2xl"></div>
          <div className="absolute -inset-2 bg-gradient-to-br from-[var(--teal-200)] via-[var(--teal-300)] to-[var(--teal-400)] rounded-3xl opacity-5"></div>

          {/* Decorative corner accents */}
          <div className="absolute -top-3 -left-3 w-20 h-20 border-t-4 border-l-4 border-[var(--teal-300)]/30 rounded-tl-3xl"></div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 border-b-4 border-r-4 border-[var(--teal-400)]/30 rounded-br-3xl"></div>

          {/* Floating dots decoration */}
          <div className="absolute -top-8 right-8 flex gap-2">
            <div className="w-3 h-3 bg-[var(--teal-300)] rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-[var(--teal-400)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 relative backdrop-blur-sm">
          <h1 className="text-3xl text-[var(--navy-900)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Welcome back
          </h1>
          <p className="text-[var(--muted-foreground)] mb-8">
            Sign in to your account to continue
          </p>

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--teal-300)] focus:ring-[var(--teal-300)]"
                />
                <span className="text-sm text-[var(--muted-foreground)]">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[var(--teal-400)] hover:text-[var(--teal-500)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

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
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-[var(--teal-400)] hover:text-[var(--teal-500)] transition-colors"
            >
              Sign up
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
