import React, { useState } from 'react';
import { Search, Pill, Apple, Upload, Mic, ArrowLeft, ArrowRight, Loader } from 'lucide-react';
import { Navbar } from './Navbar';
import { api } from '../services/api';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

interface InteractionCheckProps {
  onComplete: (medication: string, food: string, inputType: 'text' | 'voice' | 'image') => void;
  onNavigate: (page: any) => void;
  isGuest: boolean;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
}

export function InteractionCheck({ onComplete, onNavigate, isGuest, user, onLogout, currentPage }: InteractionCheckProps) {
  const [step, setStep] = useState<'medication' | 'food'>('medication');
  const [medication, setMedication] = useState('');
  const [food, setFood] = useState('');
  const [inputType, setInputType] = useState<'text' | 'voice' | 'image'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const commonMedications = [
    'Warfarin', 'Metformin', 'Lisinopril', 'Atorvastatin', 'Levothyroxine',
    'Amlodipine', 'Omeprazole', 'Losartan', 'Gabapentin', 'Hydrochlorothiazide'
  ];

  const commonFoods = [
    'Grapefruit', 'Spinach', 'Banana', 'Coffee', 'Alcohol',
    'Milk', 'Orange Juice', 'Broccoli', 'Soy Products', 'Green Tea'
  ];

  const handleMedicationNext = () => {
    if (medication.trim()) {
      setStep('food');
    }
  };

  const handleFoodSubmit = async () => {
    if (food.trim()) {
      setIsAnalyzing(true);
      try {
        await onComplete(medication, food, inputType);
      } catch (err) {
        console.error('Analysis failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    setIsProcessing(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMedication(transcript);
      setInputType('voice');
      setIsProcessing(false);
    };

    recognition.onerror = () => {
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsProcessing(false);
    };
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await api.analyzeImage(base64);
        if (res.success && res.data?.medicationName) {
          setMedication(res.data.medicationName);
          setInputType('image');
        } else {
          alert('Could not extract medication name from image. Please try again or type manually.');
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Navbar */}
      <Navbar user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Check Food-Drug Interaction
          </h1>
          <p className="text-gray-600">
            Enter your medication and food to analyze potential interactions
          </p>
        </div>

        {isAnalyzing ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
              <Loader className="size-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Interaction...</h2>
            <p className="text-gray-600">Our AI is evaluating the safety profile</p>
          </div>
        ) : step === 'medication' ? (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Pill className="size-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter Your Medication</h1>
              <p className="text-gray-600">Type the name of the medication you're taking</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <label htmlFor="medication" className="block text-sm font-medium text-gray-700 mb-2">
                Medication Name
              </label>
              <div className="relative">
                {isProcessing ? (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-blue-500">
                    <Loader className="animate-spin" />
                  </div>
                ) : (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                )}
                <input
                  type="text"
                  id="medication"
                  value={medication}
                  onChange={(e) => {
                    setMedication(e.target.value);
                    setInputType('text');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleMedicationNext()}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isProcessing ? "Processing..." : "e.g., Warfarin, Lisinopril..."}
                  autoFocus
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleFileUploadClick}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <Upload className="size-4" />
                  <span className="text-sm">Upload Prescription</span>
                </button>
                <button
                  onClick={startVoiceInput}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <Mic className="size-4" />
                  <span className="text-sm">Voice Input</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <button
                onClick={handleMedicationNext}
                disabled={!medication.trim() || isProcessing}
                className="w-full mt-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next: Add Food
                <ArrowRight className="size-5" />
              </button>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Common Medications</h3>
              <div className="flex flex-wrap gap-2">
                {commonMedications.map((med) => (
                  <button
                    key={med}
                    onClick={() => {
                      setMedication(med);
                      setInputType('text');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-300"
                  >
                    {med}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <Apple className="size-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Food Item</h1>
              <p className="text-gray-600">What food or beverage do you plan to consume?</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Checking interaction with:</strong> {medication}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <label htmlFor="food" className="block text-sm font-medium text-gray-700 mb-2">
                Food or Beverage
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  id="food"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFoodSubmit()}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Grapefruit, Spinach, Coffee..."
                  autoFocus
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Upload className="size-4" />
                  <span className="text-sm">Upload Food Image</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Mic className="size-4" />
                  <span className="text-sm">Voice Input</span>
                </button>
              </div>

              <button
                onClick={handleFoodSubmit}
                disabled={!food.trim()}
                className="w-full mt-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Interaction
              </button>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Common Foods & Beverages</h3>
              <div className="flex flex-wrap gap-2">
                {commonFoods.map((foodItem) => (
                  <button
                    key={foodItem}
                    onClick={() => setFood(foodItem)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 border border-transparent hover:border-green-300"
                  >
                    {foodItem}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}