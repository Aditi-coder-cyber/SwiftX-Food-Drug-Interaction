import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Lightbulb, FileText, Share2, Save, ArrowLeft, TrendingUp } from 'lucide-react';
import { Navbar } from './Navbar';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
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

interface ResultPageProps {
  result: InteractionResult;
  onNavigate: (page: any) => void;
  onNewCheck: () => void;
  isGuest: boolean;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
}

export function ResultPage({ result, onNavigate, onNewCheck, isGuest, user, onLogout, currentPage }: ResultPageProps) {
  const getRiskConfig = () => {
    switch (result.riskLevel) {
      case 'mild':
        return {
          color: 'green',
          emoji: '🟢',
          icon: CheckCircle,
          badge: 'bg-green-100 text-green-700 border-green-300',
          gradient: 'from-green-50 to-white',
          action: '✔ Safe to Consume with Monitoring'
        };
      case 'moderate':
        return {
          color: 'yellow',
          emoji: '🟡',
          icon: AlertTriangle,
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',
          gradient: 'from-yellow-50 to-white',
          action: '⚠ Consume with Caution'
        };
      case 'severe':
        return {
          color: 'red',
          emoji: '🔴',
          icon: Shield,
          badge: 'bg-red-100 text-red-700 border-red-300',
          gradient: 'from-red-50 to-white',
          action: '🚫 Avoid This Combination'
        };
    }
  };

  const config = getRiskConfig();
  const RiskIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Navbar */}
      <Navbar user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={onNewCheck}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="size-5" />
          Start New Check
        </button>

        {/* Risk Badge */}
        <div className="text-center mb-8 animate-in fade-in duration-500">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 border-4 ${config.badge}`}>
            <RiskIcon className="size-10" />
          </div>
          <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold mb-4 border-2 ${config.badge}`}>
            {config.emoji} {result.riskLevel.toUpperCase()} RISK
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.action}</h1>
          <p className="text-xl text-gray-600">
            <strong>{result.medication}</strong> + <strong>{result.food}</strong>
          </p>
        </div>

        {/* AI Confidence Score */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-blue-600" />
              <span className="font-semibold text-gray-900">AI Confidence Score</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{result.confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${result.confidence}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Based on verified medical databases and peer-reviewed research
          </p>
        </div>

        {/* Explanation Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="size-6 text-blue-600" />
            What This Means
          </h2>
          <p className="text-gray-700 mb-6 text-lg leading-relaxed">{result.explanation}</p>

          <div className={`p-4 rounded-lg mb-6 border-2 ${config.badge.replace('text', 'bg').replace('100', '50')}`}>
            <h3 className="font-semibold text-gray-900 mb-2">Clinical Impact:</h3>
            <p className="text-gray-700">{result.clinicalImpact}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Example:</h3>
            <p className="text-gray-700">{result.example}</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="size-6 text-yellow-500" />
            Recommendations
          </h2>
          <ul className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timing & Alternatives */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Timing Guidance</h3>
            </div>
            <p className="text-gray-700">{result.timing}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="size-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Safer Alternatives</h3>
            </div>
            <ul className="space-y-2">
              {result.alternatives.map((alt, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">{alt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Medical Advisory */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 border-2 ${config.badge}`}>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Important Medical Advisory
          </h3>
          <p className="text-gray-700">
            {result.riskLevel === 'severe' 
              ? 'This is a serious interaction. Contact your doctor or pharmacist immediately before consuming this combination.'
              : result.riskLevel === 'moderate'
              ? 'Consult with your pharmacist about the best timing for this medication and food combination.'
              : 'While generally safe, monitor for any unusual symptoms and consult your healthcare provider if concerns arise.'
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={onNewCheck}
            className="flex-1 min-w-[200px] py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            Check Another Interaction
          </button>
          
          {!isGuest && (
            <>
              <button className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2">
                <Save className="size-5" />
                Save
              </button>
              <button className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2">
                <Share2 className="size-5" />
                Share
              </button>
            </>
          )}
        </div>

        {/* Guest Prompt */}
        {isGuest && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Want to Save Your Results?</h3>
            <p className="mb-6 text-blue-100">
              Create a free account to save your interaction history, get personalized alerts, 
              and access your risk profile.
            </p>
            <button
              onClick={() => onNavigate('landing')}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
            >
              Sign Up Free
            </button>
          </div>
        )}

        {/* Trust Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => onNavigate('trust')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Data Sources & Transparency Report →
          </button>
        </div>
      </div>
    </div>
  );
}