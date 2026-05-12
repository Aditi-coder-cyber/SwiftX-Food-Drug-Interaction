import React, { useState } from 'react';
import { Shield, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SignupPageProps {
  onSignup: (name: string, email: string, password: string) => void;
  onNavigate: (page: 'login' | 'landing') => void;
  authError?: string | null;
  onClearError?: () => void;
}

export function SignupPage({ onSignup, onNavigate, authError, onClearError }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password && password === confirmPassword && agreeToTerms) {
      setIsLoading(true);
      await onSignup(name, email, password);
      setIsLoading(false);
    }
  };

  const handleNavigate = (page: 'login' | 'landing') => {
    onClearError?.();
    onNavigate(page);
  };

  const passwordsMatch = password === confirmPassword;
  const passwordStrength = password.length >= 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="size-10 text-blue-600" />
            <span className="font-bold text-2xl text-gray-900">SafeMed AI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Start protecting your health in just a few steps</p>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-900 mb-3">Free account includes:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="size-4 text-green-600" />
              Unlimited interaction checks
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="size-4 text-green-600" />
              Personalized risk profile
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="size-4 text-green-600" />
              Interaction history & alerts
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="size-4 text-green-600" />
              Access to learning resources
            </li>
          </ul>
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

        {/* Signup Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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

            <div className="mb-4">
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
              {password && (
                <p className={`text-xs mt-1 ${passwordStrength ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordStrength ? '✓ Strong password' : 'Password must be at least 8 characters'}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              {confirmPassword && (
                <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? '✓ Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="text-sm text-gray-600">
                  I agree to the Terms of Service and Privacy Policy. I understand this tool
                  does not replace professional medical advice.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!passwordsMatch || !passwordStrength || !agreeToTerms || isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <strong>Medical Disclaimer:</strong> This is an educational tool. Always consult
                healthcare professionals for medical decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => handleNavigate('login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Log in
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
