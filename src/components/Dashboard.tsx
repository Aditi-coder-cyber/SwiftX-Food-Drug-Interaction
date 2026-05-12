import React, { useState } from 'react';
import { Shield, Search, User, Clock, BookOpen, Activity, AlertCircle, Settings, LogOut, TrendingUp, KeyRound } from 'lucide-react';
import { Navbar } from './Navbar';
import { TwoFactorSetup } from './TwoFactorSetup';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

interface RecentCheck {
  medication: string;
  food: string;
  riskLevel: 'mild' | 'moderate' | 'severe';
  timestamp: string;
}

interface DashboardProps {
  user: User;
  onNavigate: (page: 'check' | 'history' | 'profile' | 'learning' | 'trust' | 'landing' | 'dashboard') => void;
  onLogout: () => void;
  hasRiskProfile: boolean;
  recentChecks: RecentCheck[];
  currentPage: string;
}

export function Dashboard({ user, onNavigate, onLogout, hasRiskProfile, recentChecks, currentPage }: DashboardProps) {
  const [show2FASetup, setShow2FASetup] = useState(false);
  const getRiskColor = (level: 'mild' | 'moderate' | 'severe') => {
    switch (level) {
      case 'mild': return 'bg-green-100 text-green-700 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'severe': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getRiskEmoji = (level: 'mild' | 'moderate' | 'severe') => {
    switch (level) {
      case 'mild': return '🟢';
      case 'moderate': return '🟡';
      case 'severe': return '🔴';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Navbar */}
      <Navbar user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600">Here's your medication safety overview</p>
        </div>

        {/* Profile Alert */}
        {!hasRiskProfile && (
          <div className="bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-xl">
                <AlertCircle className="size-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Complete Your Health Profile</h3>
                <p className="text-gray-600 mb-4">
                  Get personalized risk assessments by adding your health conditions and allergies.
                </p>
                <button
                  onClick={() => onNavigate('profile')}
                  className="px-6 py-2 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-lg hover:from-teal-700 hover:to-green-700 transition-all font-medium"
                >
                  Set Up Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => onNavigate('check')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Search className="size-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">New Safety Check</h3>
            <p className="text-blue-100">Analyze food-drug interactions</p>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow hover:shadow-md transition-shadow text-left hover:border-blue-300"
          >
            <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center mb-4">
              <Clock className="size-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">View History</h3>
            <p className="text-gray-600">Review past interactions</p>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow hover:shadow-md transition-shadow text-left hover:border-blue-300"
          >
            <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center mb-4">
              <User className="size-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">
              {hasRiskProfile ? 'Update Profile' : 'Risk Profile'}
            </h3>
            <p className="text-gray-600">
              {hasRiskProfile ? 'Manage your information' : 'Set up personalization'}
            </p>
          </button>

          {!user.isGuest && (
            <button
              onClick={() => setShow2FASetup(true)}
              className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow hover:shadow-md transition-shadow text-left hover:border-purple-300"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center mb-4">
                <KeyRound className="size-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Security (2FA)</h3>
              <p className="text-gray-600">Manage two-factor authentication</p>
            </button>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Checks</span>
              <TrendingUp className="size-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{recentChecks.length}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Safe Results</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {recentChecks.filter(c => c.riskLevel === 'mild').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Mild interactions</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Moderate</span>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {recentChecks.filter(c => c.riskLevel === 'moderate').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Needs caution</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Severe</span>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {recentChecks.filter(c => c.riskLevel === 'severe').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Avoid these</p>
          </div>
        </div>

        {/* Recent Checks */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Safety Checks</h2>
              <button
                onClick={() => onNavigate('history')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>

          {recentChecks.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="size-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-gray-900 mb-2">No checks yet</h3>
              <p className="text-gray-600 mb-4">
                Start by checking your first food-drug interaction
              </p>
              <button
                onClick={() => onNavigate('check')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Run Safety Check
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentChecks.map((check, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(check.riskLevel)}`}>
                          {getRiskEmoji(check.riskLevel)} {check.riskLevel.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(check.timestamp)}</span>
                      </div>
                      <p className="text-gray-900 mb-1">
                        <strong>{check.medication}</strong> + <strong>{check.food}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Educational Resources */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <button
            onClick={() => onNavigate('learning')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-xl text-left hover:shadow-md transition-shadow"
          >
            <BookOpen className="size-8 text-purple-600 mb-4" />
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Learning Hub</h3>
            <p className="text-gray-600">
              Understand why food-drug interactions matter and how to stay safe
            </p>
          </button>

          <button
            onClick={() => onNavigate('trust')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-xl text-left hover:shadow-md transition-shadow"
          >
            <Shield className="size-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Trust & Transparency</h3>
            <p className="text-gray-600">
              Learn about our data sources, AI confidence, and medical disclaimers
            </p>
          </button>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && <TwoFactorSetup onClose={() => setShow2FASetup(false)} />}
    </div>
  );
}