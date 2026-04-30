import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, GraduationCap, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthBackground } from '../components/AuthBackground';
import {
  requestForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPasswordWithCode,
} from '../services/auth';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const clearMessages = () => {
    setErrorMessage('');
    setInfoMessage('');
  };

  const handleSendCode = async () => {
    clearMessages();

    try {
      setIsSubmitting(true);
      const response = await requestForgotPasswordCode({ email });
      setInfoMessage(response.message || 'Verification code sent.');
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendCode();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    clearMessages();

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await verifyForgotPasswordCode({ email, code: otpCode });
      setInfoMessage(response.message || 'Verification successful.');
      setVerifiedCode(otpCode);
      setStep('newPassword');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    clearMessages();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(passwords.newPassword)) {
      setErrorMessage('Password must be at least 8 characters and include letters and numbers.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await resetPasswordWithCode({
        email,
        code: verifiedCode || otp.join(''),
        newPassword: passwords.newPassword,
      });

      setInfoMessage(response.message || 'Password reset successful.');
      setStep('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords(prev => ({
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

          {step === 'email' && (
            <>
              <h1 className="text-3xl text-[var(--navy-900)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Reset password
              </h1>
              <p className="text-[var(--muted-foreground)] mb-8">
                Enter your email and we'll send you a verification code
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/signin"
                  className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--navy-900)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}

          {step === 'otp' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--teal-100)] rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[var(--teal-400)]" />
              </div>

              <h2 className="text-2xl text-[var(--navy-900)] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Enter verification code
              </h2>

              <p className="text-[var(--muted-foreground)] mb-8">
                We sent a 6-digit code to <strong className="text-[var(--navy-900)]">{email}</strong>
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl bg-[var(--input-background)] border-2 border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] focus:border-[var(--teal-300)] transition-all"
                      required
                    />
                  ))}
                </div>

                <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>

              <div className="mt-6 space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSubmitting}
                  className="text-sm text-[var(--teal-400)] hover:text-[var(--teal-500)] transition-colors"
                >
                  Resend code
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp(['', '', '', '', '', '']);
                      setVerifiedCode('');
                      clearMessages();
                    }}
                    className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--navy-900)] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change email
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'newPassword' && (
            <>
              <h2 className="text-3xl text-[var(--navy-900)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Set new password
              </h2>
              <p className="text-[var(--muted-foreground)] mb-8">
                Create a strong password for your account
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm text-[var(--navy-900)] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
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
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="bg-[var(--teal-50)] border border-[var(--teal-200)] rounded-xl p-4">
                  <p className="text-sm text-[var(--navy-900)] mb-2">Password requirements:</p>
                  <ul className="text-xs text-[var(--muted-foreground)] space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[var(--teal-400)] rounded-full"></div>
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[var(--teal-400)] rounded-full"></div>
                      At least one letter and one number
                    </li>
                  </ul>
                </div>

                <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[var(--teal-100)] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-[var(--teal-400)]" />
              </div>

              <h2 className="text-2xl text-[var(--navy-900)] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Password reset successful!
              </h2>

              <p className="text-[var(--muted-foreground)] mb-8">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>

              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={() => navigate('/signin')}
              >
                Continue to Sign In
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
