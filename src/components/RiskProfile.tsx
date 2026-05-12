import React, { useState, useEffect } from 'react';
import { User, Heart, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Navbar } from './Navbar';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

interface RiskProfileData {
  age: string;
  conditions: string[];
  allergies: string[];
}

interface RiskProfileProps {
  onSave: (profile: RiskProfileData) => void;
  onNavigate: (page: any) => void;
  existingProfile: RiskProfileData | null;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
}

export function RiskProfile({ onSave, onNavigate, existingProfile, user, onLogout, currentPage }: RiskProfileProps) {
  const [age, setAge] = useState(existingProfile?.age || '');
  const [conditions, setConditions] = useState<string[]>(existingProfile?.conditions || []);
  const [allergies, setAllergies] = useState<string[]>(existingProfile?.allergies || []);
  const [customAllergy, setCustomAllergy] = useState('');

  const ageGroups = ['18-30', '31-45', '46-64', '65+'];
  
  const commonConditions = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Kidney Disease',
    'Liver Disease', 'Asthma', 'COPD', 'Thyroid Disorder',
    'Arthritis', 'Osteoporosis', 'Depression', 'Anxiety'
  ];

  const commonAllergies = [
    'Penicillin', 'Sulfa Drugs', 'Aspirin', 'NSAIDs',
    'Latex', 'Peanuts', 'Shellfish', 'Eggs', 'Milk', 'Soy'
  ];

  const toggleCondition = (condition: string) => {
    setConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev =>
      prev.includes(allergy)
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies(prev => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ age, conditions, allergies });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Navbar */}
      <Navbar user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="size-5" />
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
            <User className="size-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {existingProfile ? 'Update Your Risk Profile' : 'Create Your Risk Profile'}
          </h1>
          <p className="text-gray-600">
            Help us provide more accurate and personalized safety recommendations
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <CheckCircle className="size-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Why This Matters</h3>
              <p className="text-gray-700">
                Your age, health conditions, and allergies can significantly affect how medications 
                interact with food. This information helps our AI provide more accurate risk assessments 
                tailored specifically to you.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Age Selection */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="size-6 text-red-500" />
              Age Group
            </h2>
            <p className="text-gray-600 mb-4">Select your age range</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ageGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setAge(group)}
                  className={`p-4 rounded-lg border-2 font-medium transition-all ${
                    age === group
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-purple-300 text-gray-700'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Health Conditions */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="size-6 text-orange-500" />
              Chronic Health Conditions
            </h2>
            <p className="text-gray-600 mb-4">Select all that apply (optional but recommended)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commonConditions.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleCondition(condition)}
                  className={`p-4 rounded-lg border-2 font-medium text-left transition-all ${
                    conditions.includes(condition)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-purple-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{condition}</span>
                    {conditions.includes(condition) && (
                      <CheckCircle className="size-5 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            {conditions.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Selected conditions:</strong> {conditions.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="size-6 text-red-500" />
              Known Allergies
            </h2>
            <p className="text-gray-600 mb-4">Select all known allergies (optional but important for safety)</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {commonAllergies.map((allergy) => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    allergies.includes(allergy)
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-red-300 text-gray-700'
                  }`}
                >
                  {allergy}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Add custom allergy..."
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Add
              </button>
            </div>

            {allergies.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Known allergies:</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-red-300 text-red-700 rounded-full text-sm"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        className="hover:text-red-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="size-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Data is Private & Secure</h3>
                <p className="text-gray-700 text-sm">
                  All health information is encrypted and stored securely. We never share your 
                  personal health data with third parties. You can update or delete your profile at any time.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!age}
            className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {existingProfile ? 'Update Profile' : 'Save Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}