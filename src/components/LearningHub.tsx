import React, { useState } from 'react';
import { BookOpen, Shield, AlertTriangle, Users, TrendingUp, Heart, ArrowLeft, ChevronRight } from 'lucide-react';
import { Navbar } from './Navbar';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

interface LearningHubProps {
  onNavigate: (page: any) => void;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
}

export function LearningHub({ onNavigate, user, onLogout, currentPage }: LearningHubProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = [
    {
      id: 'why-matters',
      icon: AlertTriangle,
      color: 'teal',
      title: 'Why Food-Drug Interactions Matter',
      summary: 'Understanding the basics of how food affects medications',
      content: [
        'Food can significantly alter how your body absorbs, metabolizes, and eliminates medications.',
        'Some foods can increase drug levels in your blood, leading to potential toxicity.',
        'Other foods can decrease drug effectiveness, causing treatment failure.',
        'Timing of food consumption relative to medication can be crucial for optimal results.',
      ]
    },
    {
      id: 'common-interactions',
      icon: Heart,
      color: 'green',
      title: 'Most Common Interactions',
      summary: 'Learn about frequently occurring food-drug combinations',
      content: [
        'Grapefruit + Statins: Can increase drug levels and risk of side effects',
        'Leafy Greens + Warfarin: High vitamin K can reduce blood-thinning effects',
        'Dairy + Antibiotics: Calcium can interfere with antibiotic absorption',
        'Alcohol + Pain Medications: Increases risk of liver damage and side effects',
      ]
    },
    {
      id: 'risk-levels',
      icon: TrendingUp,
      color: 'teal',
      title: 'Understanding Risk Levels',
      summary: 'How we classify interaction severity',
      content: [
        'Mild (🟢): Minor effects, generally safe with monitoring',
        'Moderate (🟡): Significant effects, requires timing adjustments',
        'Severe (🔴): Dangerous combination, avoid or consult doctor immediately',
        'Risk levels can change based on individual factors like age and health conditions',
      ]
    },
    {
      id: 'elderly-care',
      icon: Users,
      color: 'green',
      title: 'Special Considerations for Elderly',
      summary: 'Why seniors need extra caution',
      content: [
        'Older adults often take multiple medications (polypharmacy)',
        'Age-related changes in metabolism affect drug processing',
        'Reduced kidney and liver function can lead to drug accumulation',
        'Higher sensitivity to food-drug interactions requires careful monitoring',
      ]
    },
    {
      id: 'timing-tips',
      icon: Shield,
      color: 'green',
      title: 'Timing & Safety Tips',
      summary: 'Best practices for medication timing',
      content: [
        'Take medications at the same time each day for consistency',
        'Some medications work best on an empty stomach (1 hour before or 2 hours after meals)',
        'Others need to be taken with food to reduce stomach upset',
        'Always read medication labels and follow pharmacist instructions',
      ]
    },
    {
      id: 'when-consult',
      icon: AlertTriangle,
      color: 'teal',
      title: 'When to Consult Healthcare Provider',
      summary: 'Red flags that require professional advice',
      content: [
        'You\'re starting a new medication and unsure about food interactions',
        'You experience unexpected side effects or symptoms',
        'You\'re taking multiple medications from different doctors',
        'You have chronic conditions that may complicate interactions',
      ]
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: 'text-teal-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' },
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
          <BookOpen className="size-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Learning Hub</h1>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto">
            Empower yourself with knowledge about food-drug interactions and medication safety
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {selectedTopic ? (
          // Detailed Topic View
          <div className="animate-in fade-in duration-300">
            <button
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 font-medium"
            >
              <ArrowLeft className="size-5" />
              Back to All Topics
            </button>

            {(() => {
              const topic = topics.find(t => t.id === selectedTopic);
              if (!topic) return null;
              const colors = getColorClasses(topic.color);
              const TopicIcon = topic.icon;

              return (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className={`p-8 border-b-4 ${colors.border}`}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${colors.bg} rounded-full mb-4`}>
                      <TopicIcon className={`size-8 ${colors.icon}`} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{topic.title}</h2>
                    <p className="text-gray-600 text-lg">{topic.summary}</p>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="font-semibold text-xl text-gray-900 mb-6">Key Points:</h3>
                    <div className="space-y-6">
                      {topic.content.map((point, index) => (
                        <div key={index} className={`flex gap-4 p-4 ${colors.bg} rounded-lg border ${colors.border}`}>
                          <div className={`flex-shrink-0 w-8 h-8 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center font-bold border-2 ${colors.border}`}>
                            {index + 1}
                          </div>
                          <p className="text-gray-700 leading-relaxed pt-1">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          // Topic Grid View
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => {
              const colors = getColorClasses(topic.color);
              const TopicIcon = topic.icon;

              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-teal-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${colors.bg} rounded-lg mb-4`}>
                    <TopicIcon className={`size-6 ${colors.icon}`} />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{topic.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{topic.summary}</p>
                  <div className="flex items-center text-teal-600 font-medium text-sm">
                    <span>Learn More</span>
                    <ChevronRight className="size-4 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Additional Resources */}
        {!selectedTopic && (
          <div className="mt-12 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <Shield className="size-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Stay Informed, Stay Safe</h2>
              <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
                Understanding food-drug interactions is a crucial part of medication safety. 
                Always consult your healthcare provider for personalized medical advice.
              </p>
              {!user && (
                <button
                  onClick={() => onNavigate('landing')}
                  className="px-8 py-3 bg-white text-teal-600 rounded-lg hover:bg-teal-50 font-medium"
                >
                  Create Free Account
                </button>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="size-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Educational Purpose Only</h3>
              <p className="text-gray-700 text-sm">
                The information provided in this learning hub is for educational purposes only and 
                does not replace professional medical advice, diagnosis, or treatment. Always seek 
                the advice of your physician or other qualified health provider with any questions 
                you may have regarding a medical condition or medication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}