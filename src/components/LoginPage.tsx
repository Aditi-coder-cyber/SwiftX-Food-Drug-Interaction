import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Mail, AlertCircle, KeyRound, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface TwoFactorChallenge {
  tempToken: string;
  method: 'email' | 'totp';
}

interface LoginPageProps {
  onLogin: (email: string, password: string, isGuest?: boolean) => void;
  onNavigate: (page: 'signup' | 'landing') => void;
  authError?: string | null;
  onClearError?: () => void;
  twoFactorPending?: TwoFactorChallenge | null;
  onVerify2FA?: (code: string) => Promise<boolean>;
  onResend2FAOTP?: () => Promise<boolean>;
  onCancel2FA?: () => void;
}

export function LoginPage({
  onLogin,
  onNavigate,
  authError,
  onClearError,
  twoFactorPending,
  onVerify2FA,
  onResend2FAOTP,
  onCancel2FA,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first digit when 2FA challenge appears
  useEffect(() => {
    if (twoFactorPending) {
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
    }
  }, [twoFactorPending]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      await onLogin(email, password, false);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onLogin('', '', true);
  };

  const handleNavigate = (page: 'signup' | 'landing') => {
    onClearError?.();
    onNavigate(page);
  };

  /* ─── OTP Digit Handling ──────────────────────────────────────────── */

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // single digit
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (value && index === 5) {
      const code = newDigits.join('');
      if (code.length === 6) {
        handleVerifyOTP(code);
      }
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setOtpDigits(newDigits);
      digitRefs.current[5]?.focus();
      handleVerifyOTP(pasted);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    if (!onVerify2FA) return;
    setIsVerifying(true);
    onClearError?.();
    await onVerify2FA(code);
    setIsVerifying(false);
    // If failed, clear digits
    setOtpDigits(['', '', '', '', '', '']);
    setTimeout(() => digitRefs.current[0]?.focus(), 100);
  };

  const handleResendOTP = async () => {
    if (!onResend2FAOTP || resendCooldown > 0) return;
    const success = await onResend2FAOTP();
    if (success) setResendCooldown(30);
  };

  const handleCancel2FA = () => {
    setOtpDigits(['', '', '', '', '', '']);
    onClearError?.();
    onCancel2FA?.();
  };

  /* ─── 2FA Verification UI ────────────────────────────────────────── */

  if (twoFactorPending) {
    const isEmailMethod = twoFactorPending.method === 'email';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Language Switcher */}
          <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
          {/* Header */}
          <div className="text-center mb-8">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              }}
            >
              {isEmailMethod ? (
                <Mail className="size-8 text-white" />
              ) : (
                <Smartphone className="size-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Two-Factor Verification
            </h1>
            <p className="text-gray-600 text-sm">
              {isEmailMethod
                ? 'Enter the 6-digit code sent to your email'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            </div>
          )}

          {/* OTP Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            {/* Method badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                background: isEmailMethod ? '#eff6ff' : '#f5f3ff',
                marginBottom: 24,
                justifyContent: 'center',
              }}
            >
              {isEmailMethod ? (
                <Mail className="size-4 text-blue-600" />
              ) : (
                <KeyRound className="size-4 text-purple-600" />
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isEmailMethod ? '#2563eb' : '#7c3aed',
                }}
              >
                {isEmailMethod ? 'Email OTP' : 'Authenticator App'}
              </span>
            </div>

            {/* 6-digit input */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { digitRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  onPaste={i === 0 ? handleDigitPaste : undefined}
                  disabled={isVerifying}
                  style={{
                    width: 48,
                    height: 56,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    border: '2px solid',
                    borderColor: digit ? '#3b82f6' : '#e5e7eb',
                    borderRadius: 12,
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: digit ? '#eff6ff' : '#f9fafb',
                    color: '#1e293b',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? '#3b82f6' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={() => handleVerifyOTP(otpDigits.join(''))}
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>

            {/* Resend / Back */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleCancel2FA}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </button>

              {isEmailMethod && (
                <button
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  <RefreshCw className="size-4" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              )}
            </div>
          </div>

          {/* Security note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Shield className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <strong>Secure verification.</strong> This code expires in 5 minutes.
                Never share your verification code with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Standard Login UI ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="size-10 text-blue-600" />
            <span className="font-bold text-2xl text-gray-900">SafeMed AI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Log in to access your personalized safety dashboard</p>
        </div>

        {/* Error Banner */}
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {!showForgotPassword ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Continue as Guest
              </button>
            </form>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
              <p className="text-gray-600 mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              <div className="mb-4">
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="email"
                    id="reset-email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mb-4">
                Send Reset Link
              </button>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Shield className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <strong>Your privacy is protected.</strong> We use industry-standard encryption
                and never share your medical information with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <strong>Medical Disclaimer:</strong> This tool provides informational guidance
                and does not replace professional medical advice. Always consult your healthcare provider.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => handleNavigate('signup')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up free
            </button>
          </p>
          <button
            onClick={() => handleNavigate('landing')}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
