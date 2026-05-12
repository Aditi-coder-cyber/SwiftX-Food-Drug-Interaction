import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle, Search, Bell, FileText, TrendingUp, Users, Award, BookOpen, Eye, Zap, Heart, Pill, Apple } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LandingPageProps {
  onNavigate: (page: 'login' | 'signup' | 'check' | 'learning' | 'trust') => void;
  onGuestCheck: () => void;
}

export function LandingPage({ onNavigate, onGuestCheck }: LandingPageProps) {
  const [activeSection, setActiveSection] = useState<string>('home');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Enhanced Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-teal-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-gradient-to-br from-teal-500 to-green-500 p-2 rounded-lg">
                <Shield className="size-6 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                SafeMed AI
              </span>
            </button>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('home')}
                className={`text-sm font-medium transition-colors hover:text-teal-600 ${activeSection === 'home' ? 'text-teal-600 border-b-2 border-teal-600 pb-1' : 'text-gray-700'
                  }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className={`text-sm font-medium transition-colors hover:text-teal-600 ${activeSection === 'how-it-works' ? 'text-teal-600 border-b-2 border-teal-600 pb-1' : 'text-gray-700'
                  }`}
              >
                How It Works
              </button>
              <button
                onClick={() => onNavigate('learning')}
                className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
              >
                Learning Hub
              </button>
              <button
                onClick={() => onNavigate('trust')}
                className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
              >
                Trust & Safety
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`text-sm font-medium transition-colors hover:text-teal-600 ${activeSection === 'contact' ? 'text-teal-600 border-b-2 border-teal-600 pb-1' : 'text-gray-700'
                  }`}
              >
                Contact
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-sm font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-green-600 rounded-lg hover:from-teal-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-teal-200 shadow-sm">
                <Shield className="size-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">AI-Powered Medication Safety</span>
              </div>

              {/* Main Headline */}
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Prevent Harmful
                  <span className="block bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                    Food–Drug Interactions
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
                  Make safer health decisions with intelligent analysis, personalized alerts, and clear guidance you can trust. No medical jargon, just actionable insights.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGuestCheck}
                  className="group px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Check Interaction Now
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-8 py-4 bg-white text-teal-700 font-semibold rounded-xl border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
                >
                  Create Free Account
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-green-600" />
                  <span className="text-sm text-gray-600">No Login Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-green-600" />
                  <span className="text-sm text-gray-600">Evidence-Based</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-green-600" />
                  <span className="text-sm text-gray-600">Always Free</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1080&q=80"
                  alt="Indian healthcare professional"
                  className="w-full h-auto"
                />
                {/* Overlay Card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Heart className="size-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">10,000+ Safety Checks</div>
                      <div className="text-sm text-gray-600">Trusted by users worldwide</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border border-teal-100">
                <div className="flex items-center gap-2">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <Shield className="size-4 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">AI-Powered</div>
                    <div className="text-xs text-gray-600">Real-time analysis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 rounded-full mb-4">
              <Zap className="size-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Simple & Fast</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get personalized safety insights in four simple steps
            </p>
          </div>

          {/* Visual Steps */}
          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8 border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-lg group">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-teal-600 to-green-600 text-white size-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  1
                </div>
                <div className="bg-white p-4 rounded-xl mb-4 inline-block group-hover:scale-110 transition-transform">
                  <Pill className="size-8 text-teal-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Input Medication</h3>
                <p className="text-gray-600 text-sm">
                  Enter your medication name or upload a prescription photo
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8 border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-lg group">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-teal-600 to-green-600 text-white size-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  2
                </div>
                <div className="bg-white p-4 rounded-xl mb-4 inline-block group-hover:scale-110 transition-transform">
                  <Apple className="size-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Add Food Item</h3>
                <p className="text-gray-600 text-sm">
                  Select from common foods or type your own meal details
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8 border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-lg group">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-teal-600 to-green-600 text-white size-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  3
                </div>
                <div className="bg-white p-4 rounded-xl mb-4 inline-block group-hover:scale-110 transition-transform">
                  <Search className="size-8 text-teal-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">AI Risk Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Our AI analyzes millions of clinical data points instantly
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8 border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-lg group">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-teal-600 to-green-600 text-white size-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  4
                </div>
                <div className="bg-white p-4 rounded-xl mb-4 inline-block group-hover:scale-110 transition-transform">
                  <Bell className="size-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Smart Safety Alerts</h3>
                <p className="text-gray-600 text-sm">
                  Get clear color-coded results with actionable recommendations
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <button
              onClick={onGuestCheck}
              className="px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              Try It Now - No Signup Required
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-teal-50 via-blue-50 to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Safety Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for medication safety in one place
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-teal-100 to-green-100 p-3 rounded-xl inline-block mb-4">
                <TrendingUp className="size-6 text-teal-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Personalized Risk Profiles</h3>
              <p className="text-gray-600">
                Create your health profile for customized risk assessments based on your conditions and allergies
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-teal-100 to-green-100 p-3 rounded-xl inline-block mb-4">
                <BookOpen className="size-6 text-teal-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Learning Hub</h3>
              <p className="text-gray-600">
                Access educational content about common interactions, myths vs facts, and safety tips
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-green-100 to-teal-100 p-3 rounded-xl inline-block mb-4">
                <FileText className="size-6 text-green-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">History Tracking</h3>
              <p className="text-gray-600">
                Keep track of all your checks with detailed records and trend analysis over time
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-teal-100 to-green-100 p-3 rounded-xl inline-block mb-4">
                <Eye className="size-6 text-teal-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Trust & Transparency</h3>
              <p className="text-gray-600">
                Understand how our AI works with explainable results and evidence-based sources
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-green-100 to-teal-100 p-3 rounded-xl inline-block mb-4">
                <Shield className="size-6 text-green-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Color-Coded Risk Levels</h3>
              <p className="text-gray-600">
                Instantly understand severity with intuitive green (safe), yellow (caution), red (danger) indicators
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-teal-100 to-green-100 p-3 rounded-xl inline-block mb-4">
                <Users className="size-6 text-teal-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Guest & Registered Access</h3>
              <p className="text-gray-600">
                Use instantly without signup, or create an account for personalized features and history
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 rounded-full mb-6">
                <Award className="size-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">Evidence-Based & Transparent</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built on Trust & Medical Science
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Clinically Validated Data</h4>
                    <p className="text-gray-600">Our AI is trained on peer-reviewed medical literature and FDA databases</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Privacy First</h4>
                    <p className="text-gray-600">Your health data is encrypted and never shared with third parties</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Explainable AI</h4>
                    <p className="text-gray-600">Every result includes confidence scores and evidence sources</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Not Medical Advice</h4>
                    <p className="text-gray-600">Always consult healthcare professionals for personalized medical guidance</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('trust')}
                className="mt-8 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
              >
                Learn More About Our Methodology
                <ArrowRight className="size-5" />
              </button>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1080&q=80"
                  alt="Modern medical technology"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gradient-to-br from-teal-600 to-green-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Check Your Medication Safety?
          </h2>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users making safer health decisions every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGuestCheck}
              className="px-8 py-4 bg-white text-teal-700 font-semibold rounded-xl hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Check Now
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 border-2 border-white/20 transition-all"
            >
              Create Account
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-12 pt-12 border-t border-teal-500">
            <p className="text-teal-100 mb-4">Have questions? We're here to help.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-teal-100">
              <span>📧 support@safemed-ai.com</span>
              <span className="hidden sm:inline">•</span>
              <span>🌐 Available 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-teal-500 to-green-500 p-2 rounded-lg">
                  <Shield className="size-5 text-white" />
                </div>
                <span className="font-bold text-white">SafeMed AI</span>
              </div>
              <p className="text-sm">
                Making medication safety accessible to everyone through AI-powered analysis.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white">How It Works</button></li>
                <li><button onClick={() => onNavigate('learning')} className="hover:text-white">Learning Hub</button></li>
                <li><button onClick={() => onNavigate('trust')} className="hover:text-white">Trust & Safety</button></li>
                <li><button onClick={onGuestCheck} className="hover:text-white">Try It Free</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white">About Us</button></li>
                <li><button className="hover:text-white">Privacy Policy</button></li>
                <li><button className="hover:text-white">Terms of Service</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <p className="text-sm">
                This tool is for informational purposes only and does not constitute medical advice. Always consult healthcare professionals.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© 2026 SafeMed AI. All rights reserved. Built with care for your health.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}