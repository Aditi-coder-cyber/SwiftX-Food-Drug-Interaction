import React, { useState } from 'react';
import { Clock, Search, Filter, Calendar, ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
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

interface HistoryPageProps {
  history: InteractionResult[];
  onNavigate: (page: any) => void;
  user: User;
  onLogout: () => void;
  currentPage: string;
}

export function HistoryPage({ history, onNavigate, user, onLogout, currentPage }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'risk'>('newest');

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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (timestamp: string) => {
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
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(timestamp);
  };

  // Filter and sort history
  const filteredHistory = history.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.food.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = filterRisk === 'all' || item.riskLevel === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'oldest':
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      case 'risk':
        const riskOrder = { severe: 0, moderate: 1, mild: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      default:
        return 0;
    }
  });

  // Statistics
  const stats = {
    total: history.length,
    mild: history.filter(h => h.riskLevel === 'mild').length,
    moderate: history.filter(h => h.riskLevel === 'moderate').length,
    severe: history.filter(h => h.riskLevel === 'severe').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Navbar */}
      <Navbar user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interaction History</h1>
          <p className="text-gray-600">Review your past food-drug interaction checks</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Checks</div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.mild}</div>
            <div className="text-sm text-gray-600">Mild Risk</div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.moderate}</div>
            <div className="text-sm text-gray-600">Moderate Risk</div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.severe}</div>
            <div className="text-sm text-gray-600">Severe Risk</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Medication or food..."
                />
              </div>
            </div>

            {/* Risk Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Levels</option>
                  <option value="mild">Mild Only</option>
                  <option value="moderate">Moderate Only</option>
                  <option value="severe">Severe Only</option>
                </select>
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="risk">Risk Level</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        {sortedHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Clock className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterRisk !== 'all' ? 'No matches found' : 'No history yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterRisk !== 'all' 
                ? 'Try adjusting your filters'
                : 'Your interaction checks will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHistory.map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(item.riskLevel)}`}>
                        {getRiskEmoji(item.riskLevel)} {item.riskLevel.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.medication} + {item.food}
                    </h3>
                    <p className="text-gray-600 text-sm">{item.explanation}</p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-blue-600">{item.confidence}%</div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>

                {/* Expandable Details */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View Details
                  </summary>
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Clinical Impact:</h4>
                      <p className="text-gray-600 text-sm">{item.clinicalImpact}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {item.recommendations.map((rec, i) => (
                          <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Timing Guidance:</h4>
                      <p className="text-gray-600 text-sm">{item.timing}</p>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {sortedHistory.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {sortedHistory.length} of {history.length} total checks
          </div>
        )}
      </div>
    </div>
  );
}