import React from 'react';
import { Shield, Database, Award, FileText, Users, Lock, ArrowLeft, CheckCircle, Eye, TrendingUp } from 'lucide-react';
import { Navbar } from './Navbar';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

interface TrustPanelProps {
  onNavigate: (page: any) => void;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
}

export function TrustPanel({ onNavigate, user, onLogout, currentPage }: TrustPanelProps) {
  const dataSources = [
    {
      name: 'FDA Drug Database',
      description: 'Official FDA-approved medication information and safety data',
      credibility: 'Government Authority',
      icon: Shield,
      color: 'teal'
    },
    {
      name: 'PubMed Research',
      description: 'Peer-reviewed clinical studies on drug-food interactions',
      credibility: 'Scientific Literature',
      icon: FileText,
      color: 'green'
    },
    {
      name: 'DrugBank',
      description: 'Comprehensive pharmaceutical knowledge base',
      credibility: 'Academic Database',
      icon: Database,
      color: 'teal'
    },
    {
      name: 'Clinical Pharmacology',
      description: 'Evidence-based pharmacological interaction data',
      credibility: 'Medical Reference',
      icon: Award,
      color: 'green'
    }
  ];

  const aiMetrics = [
    { label: 'Average Confidence Score', value: '92%', description: 'Across all predictions' },
    { label: 'Data Sources Used', value: '4+', description: 'Verified databases' },
    { label: 'Clinical Studies Referenced', value: '10,000+', description: 'Peer-reviewed papers' },
    { label: 'Regular Updates', value: 'Monthly', description: 'Database refresh cycle' }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    };
    return colors[color];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Navbar */}
      <Navbar user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-green-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Shield className="size-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Trust & Transparency</h1>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto">
            Understanding how we analyze food-drug interactions and ensure accuracy
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Our Commitment */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Commitment to You</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 text-teal-600 rounded-full mb-4">
                <Shield className="size-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verified Data</h3>
              <p className="text-gray-600 text-sm">
                All information sourced from trusted medical and scientific databases
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <TrendingUp className="size-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Transparent AI</h3>
              <p className="text-gray-600 text-sm">
                Every prediction includes confidence scores and reasoning
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 text-teal-600 rounded-full mb-4">
                <Lock className="size-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Privacy First</h3>
              <p className="text-gray-600 text-sm">
                Your health data is encrypted and never shared with third parties
              </p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Data Sources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {dataSources.map((source, index) => {
              const colors = getColorClasses(source.color);
              const SourceIcon = source.icon;
              
              return (
                <div key={index} className={`bg-white rounded-xl shadow-lg p-6 border-2 ${colors.border}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <SourceIcon className={`size-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{source.name}</h3>
                        <CheckCircle className="size-5 text-green-600 flex-shrink-0" />
                      </div>
                      <p className="text-gray-600 mb-3 text-sm">{source.description}</p>
                      <span className={`inline-block px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}>
                        {source.credibility}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Confidence Metrics */}
        <div className="bg-gradient-to-br from-teal-600 to-green-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">AI Performance Metrics</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {aiMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold mb-2">{metric.value}</div>
                <div className="font-semibold mb-1">{metric.label}</div>
                <div className="text-sm text-teal-100">{metric.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How AI Works */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How Our AI Analyzes Interactions</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Data Collection</h3>
                <p className="text-gray-600">
                  We gather medication and food information from your input and cross-reference 
                  with our verified databases.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pattern Recognition</h3>
                <p className="text-gray-600">
                  Our AI analyzes known interaction patterns from thousands of clinical studies 
                  and FDA reports.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Risk Classification</h3>
                <p className="text-gray-600">
                  Interactions are classified as Mild, Moderate, or Severe based on clinical 
                  significance and potential impact.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Personalization</h3>
                <p className="text-gray-600">
                  If you've created a risk profile, we adjust recommendations based on your age, 
                  conditions, and allergies.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Confidence Scoring</h3>
                <p className="text-gray-600">
                  Each prediction includes a confidence score (typically 85-98%) showing how 
                  certain we are about the analysis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Limitations */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="size-6 text-yellow-600" />
            Understanding AI Limitations
          </h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>AI is a tool, not a doctor:</strong> Our system provides informational guidance 
              based on general patterns and research. It cannot replace personalized medical advice 
              from your healthcare provider.
            </p>
            <p>
              <strong>Individual variation:</strong> Every person's body responds differently to 
              medications and food. Factors like genetics, other medications, and overall health 
              can affect interactions in ways AI cannot fully predict.
            </p>
            <p>
              <strong>Emerging research:</strong> Medical science is constantly evolving. While we 
              update our databases monthly, new interactions may be discovered that aren't yet in 
              our system.
            </p>
            <p>
              <strong>Always consult professionals:</strong> For any concerns about your medications, 
              please speak with your doctor, pharmacist, or other qualified healthcare provider.
            </p>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Medical Disclaimer</h2>
          <div className="space-y-3 text-gray-700 text-sm">
            <p>
              <strong>This is an educational tool only.</strong> The information provided by SafeMed AI 
              is for informational and educational purposes only. It is not intended as a substitute 
              for professional medical advice, diagnosis, or treatment.
            </p>
            <p>
              Always seek the advice of your physician or other qualified health provider with any 
              questions you may have regarding a medical condition or medication. Never disregard 
              professional medical advice or delay in seeking it because of information provided by 
              this application.
            </p>
            <p>
              If you think you may have a medical emergency, call your doctor or emergency services 
              immediately.
            </p>
            <p className="font-semibold">
              By using this service, you acknowledge that you understand and agree to these terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}