import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, GraduationCap, Mail } from 'lucide-react';

import { AuthBackground } from '../components/AuthBackground';
import { Button } from '../components/Button';
import {
  resendEmailVerificationCode,
  verifyEmailVerificationCode,
} from '../services/auth';

type VerifyEmailLocationState = {
  infoMessage?: string;
  developmentVerificationCode?: string;
};

export function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state as VerifyEmailLocationState | null) ?? null;
  const initialQueryState = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      email: params.get('email') || '',
    };
  }, [location.search]);
  const initialInfoMessage = useMemo(() => {
    const baseMessage = locationState?.infoMessage || 'Enter the 6-digit code sent to your email.';

    if (locationState?.developmentVerificationCode) {
      return `${baseMessage} Development verification code: ${locationState.developmentVerificationCode}`;
    }

    return baseMessage;
  }, [locationState]);

  const [email, setEmail] = useState(initialQueryState.email);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState(initialInfoMessage);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!/^\d{6}$/.test(code.trim())) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifyEmailVerificationCode({
        email,
        code: code.trim(),
      });

      setInfoMessage(response.message || 'Email verified successfully.');
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to verify email right now.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email to resend the code.');
      return;
    }

    try {
      setIsResending(true);
      const response = await resendEmailVerificationCode({ email: email.trim() });
      const baseMessage = response.message || 'A new verification code has been sent.';
      const nextInfoMessage = response.developmentVerificationCode
        ? `${baseMessage} Development verification code: ${response.developmentVerificationCode}`
        : baseMessage;
      setInfoMessage(nextInfoMessage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to resend verification code right now.');
    } finally {
      setIsResending(false);
    }
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

        <div className="bg-white rounded-2xl shadow-xl p-8 relative backdrop-blur-sm">
          <h1 className="text-3xl text-[var(--navy-900)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Verify your email
          </h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            Please verify your email before signing in.
          </p>

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 rounded-xl border border-[var(--teal-200)] bg-[var(--teal-50)] px-4 py-3 text-sm text-[var(--navy-900)]">
              {infoMessage}
            </div>
          )}

          {!isSuccess ? (
            <form onSubmit={handleVerify} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="verificationCode" className="block text-sm text-[var(--navy-900)] mb-2">
                  6-digit verification code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={code}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(next);
                  }}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  className="w-full px-4 py-3 tracking-[0.35em] text-center bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                  required
                />
              </div>

              <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Verify Email'}
              </Button>

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full text-sm text-[var(--teal-400)] hover:text-[var(--teal-500)] transition-colors"
              >
                {isResending ? 'Resending code...' : 'Resend verification code'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[var(--teal-100)] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[var(--teal-400)]" />
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                className="w-full"
                size="lg"
                onClick={() => navigate('/signin', { replace: true })}
              >
                Continue to Sign In
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--navy-900)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
