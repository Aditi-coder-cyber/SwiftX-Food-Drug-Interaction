import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Dashboard } from './components/Dashboard';
import { InteractionCheck } from './components/InteractionCheck';
import { ResultPage } from './components/ResultPage';
import { RiskProfile } from './components/RiskProfile';
import { LearningHub } from './components/LearningHub';
import { TrustPanel } from './components/TrustPanel';
import { HistoryPage } from './components/HistoryPage';
import { Chatbot } from './components/Chatbot';

type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'check' | 'result' | 'profile' | 'learning' | 'trust' | 'history';

interface RiskProfileData {
  age: string;
  conditions: string[];
  allergies: string[];
}

interface InteractionResult {
  medication: string;
  food: string;
  riskLevel: 'mild' | 'moderate' | 'severe';
  explanation: string;
  clinicalImpact: string;
  example: string;
  recommendations: string[];
  alternatives: string[];
  timing: string;
  confidence: number;
  timestamp: string;
}

function AppContent() {
  const { user, login, signup, loginAsGuest, logout, loading, error, clearError, refreshUser, twoFactorPending, verify2FA, resend2FAOTP, cancel2FA } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [riskProfile, setRiskProfile] = useState<RiskProfileData | null>(null);
  const [currentResult, setCurrentResult] = useState<InteractionResult | null>(null);
  const [history, setHistory] = useState<InteractionResult[]>([]);

  // Auto-navigate based on auth state
  useEffect(() => {
    if (!loading && user && !user.isGuest && currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  }, [loading, user]);

  // Load risk profile and history when user is authenticated
  useEffect(() => {
    if (user && !user.isGuest) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    // Load risk profile
    const profileRes = await api.getProfile();
    if (profileRes.success && profileRes.data) {
      setRiskProfile(profileRes.data.riskProfile);
    }

    // Load history
    const historyRes = await api.getHistory();
    if (historyRes.success && historyRes.data) {
      setHistory(historyRes.data.interactions);
    }
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const handleLogin = async (email: string, password: string, isGuest: boolean = false) => {
    if (isGuest) {
      loginAsGuest();
      navigateTo('check');
      return;
    }

    const result = await login(email, password);
    if (result === true) {
      navigateTo('dashboard');
    }
    // If result === '2fa', stay on login page — LoginPage will show 2FA UI
  };

  const handleVerify2FA = async (code: string): Promise<boolean> => {
    const success = await verify2FA(code);
    if (success) {
      navigateTo('dashboard');
    }
    return success;
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const success = await signup(name, email, password);
    if (success) {
      navigateTo('dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    setRiskProfile(null);
    setHistory([]);
    setCurrentResult(null);
    navigateTo('landing');
  };

  const handleCheckStart = () => {
    navigateTo('check');
  };

  const handleCheckComplete = async (medication: string, food: string, inputType: 'text' | 'voice' | 'image' = 'text') => {
    const res = await api.checkInteraction(medication, food, inputType);
    if (res.success && res.data) {
      const result: InteractionResult = {
        ...res.data.interaction,
      };
      setCurrentResult(result);

      // Refresh history if user is authenticated
      if (user && !user.isGuest) {
        const historyRes = await api.getHistory();
        if (historyRes.success && historyRes.data) {
          setHistory(historyRes.data.interactions);
        }
      }

      navigateTo('result');
    }
  };

  const handleSaveProfile = async (profile: RiskProfileData) => {
    const res = await api.updateProfile(profile);
    if (res.success && res.data) {
      setRiskProfile(res.data.riskProfile);
      await refreshUser();
      navigateTo('dashboard');
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
            <svg className="size-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-gray-600">Loading SafeMed AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global floating chatbot widget */}
      <Chatbot />
      {currentPage === 'landing' && (
        <LandingPage onNavigate={navigateTo} onGuestCheck={handleCheckStart} />
      )}
      {currentPage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onNavigate={navigateTo}
          authError={error}
          onClearError={clearError}
          twoFactorPending={twoFactorPending}
          onVerify2FA={handleVerify2FA}
          onResend2FAOTP={resend2FAOTP}
          onCancel2FA={cancel2FA}
        />
      )}
      {currentPage === 'signup' && (
        <SignupPage onSignup={handleSignup} onNavigate={navigateTo} authError={error} onClearError={clearError} />
      )}
      {currentPage === 'dashboard' && user && (
        <Dashboard
          user={user}
          onNavigate={navigateTo}
          onLogout={handleLogout}
          hasRiskProfile={!!riskProfile}
          recentChecks={history.slice(0, 3)}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'check' && (
        <InteractionCheck
          onComplete={handleCheckComplete}
          onNavigate={navigateTo}
          isGuest={user?.isGuest || false}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'result' && currentResult && (
        <ResultPage
          result={currentResult}
          onNavigate={navigateTo}
          onNewCheck={handleCheckStart}
          isGuest={user?.isGuest || false}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'profile' && (
        <RiskProfile
          onSave={handleSaveProfile}
          onNavigate={navigateTo}
          existingProfile={riskProfile}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'learning' && (
        <LearningHub
          onNavigate={navigateTo}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'trust' && (
        <TrustPanel
          onNavigate={navigateTo}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'history' && user && (
        <HistoryPage
          history={history}
          onNavigate={navigateTo}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}

      {/* Footer Disclaimer */}
      <footer className="mt-auto py-6 text-center text-gray-500 text-xs md:text-sm border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4">
          SafeMed AI is for educational purposes only and does not replace professional medical advice.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}