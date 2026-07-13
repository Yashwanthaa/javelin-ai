'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNavbar from '@/components/dashboard/TopNavbar';
import Link from 'next/link';
import { ArrowLeft, Trash2, Calendar, MapPin, Cloud, Target, TrendingUp, Search, Filter, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface PracticeSession {
  id: string;
  session_date: string;
  distance: number;
  release_angle: number | null;
  wind_speed: number | null;
  weather: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export default function PracticeHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    personalBest: 0,
    averageDistance: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Load filter and sort from localStorage on mount
  useEffect(() => {
    const savedFilter = localStorage.getItem('practice-filter');
    const savedSort = localStorage.getItem('practice-sort');
    if (savedFilter) setSelectedFilter(savedFilter);
    if (savedSort) setSortBy(savedSort);
  }, []);

  // Save filter and sort to localStorage when changed
  useEffect(() => {
    localStorage.setItem('practice-filter', selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    localStorage.setItem('practice-sort', sortBy);
  }, [sortBy]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false });

      if (error) throw error;

      setSessions(data || []);

      // Calculate statistics
      if (data && data.length > 0) {
        const distances = data.map(s => s.distance);
        const totalSessions = data.length;
        const personalBest = Math.max(...distances);
        const averageDistance = distances.reduce((a, b) => a + b, 0) / totalSessions;

        setStats({
          totalSessions,
          personalBest,
          averageDistance: Math.round(averageDistance * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setShowDeleteModal(false);
      setDeleteId(null);
      fetchSessions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter and sort sessions
  const filteredSessions = sessions.filter(session => {
    // Search by location and notes
    const matchesSearch = 
      (session.location && session.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (session.notes && session.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by criteria
    const matchesFilter = () => {
      switch (selectedFilter) {
        case 'all':
          return true;
        case 'this-week':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return new Date(session.session_date) >= oneWeekAgo;
        case 'this-month':
          const now = new Date();
          const sessionDate = new Date(session.session_date);
          return (
            sessionDate.getMonth() === now.getMonth() &&
            sessionDate.getFullYear() === now.getFullYear()
          );
        case 'personal-best':
          return session.distance === stats.personalBest;
        default:
          return true;
      }
    };

    return matchesSearch && matchesFilter();
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.session_date).getTime() - new Date(a.session_date).getTime();
      case 'oldest':
        return new Date(a.session_date).getTime() - new Date(b.session_date).getTime();
      case 'highest':
        return b.distance - a.distance;
      case 'lowest':
        return a.distance - b.distance;
      default:
        return 0;
    }
  });

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <TopNavbar />
        <div className="p-4 sm:p-6 lg:p-8 pt-24">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/practice"
              className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Practice
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Practice History</h1>
            <p className="text-slate-400">View all your training sessions</p>
          </div>

          {/* Summary Cards */}
          {!loading && sessions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {/* Total Sessions */}
              <div className="group relative bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalSessions}</div>
                <div className="text-slate-400 text-sm">Total Sessions</div>
              </div>

              {/* Personal Best */}
              <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.personalBest.toFixed(1)}m</div>
                <div className="text-slate-400 text-sm">Personal Best</div>
              </div>

              {/* Average Distance */}
              <div className="group relative bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-6 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.averageDistance.toFixed(1)}m</div>
                <div className="text-slate-400 text-sm">Average Distance</div>
              </div>
            </div>
          )}

          {/* Search, Filter, and Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by location or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'this-week', label: 'This Week' },
                  { value: 'this-month', label: 'This Month' },
                  { value: 'personal-best', label: 'Personal Best' },
                ].map((filter) => (
                  <motion.button
                    key={filter.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedFilter === filter.value
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Distance</option>
                  <option value="lowest">Lowest Distance</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Results Count */}
            <p className="text-slate-400 text-sm mt-3">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </p>
          </motion.div>

          {/* Sessions List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No practice sessions yet.</h3>
                <p className="text-slate-400 mb-6">Start your first practice session to begin tracking your progress.</p>
                <Link
                  href="/practice/new"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                >
                  New Practice
                </Link>
              </div>
            </motion.div>
          ) : filteredSessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No matching sessions</h3>
                <p className="text-slate-400 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 gap-4">
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300"
                  >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                          <Target className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{session.distance.toFixed(1)}m</h3>
                          <div className="flex items-center text-slate-400 text-sm">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(session.session_date)}
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {session.weather && (
                          <div className="flex items-center text-slate-400">
                            <Cloud className="w-4 h-4 mr-1" />
                            {session.weather}
                          </div>
                        )}
                        {session.location && (
                          <div className="flex items-center text-slate-400">
                            <MapPin className="w-4 h-4 mr-1" />
                            {session.location}
                          </div>
                        )}
                        {session.release_angle && (
                          <div className="flex items-center text-slate-400">
                            <span className="mr-1">Angle:</span>
                            {session.release_angle}°
                          </div>
                        )}
                        {session.wind_speed && (
                          <div className="flex items-center text-slate-400">
                            <span className="mr-1">Wind:</span>
                            {session.wind_speed} m/s
                          </div>
                        )}
                      </div>

                      {session.notes && (
                        <p className="mt-3 text-slate-400 text-sm italic">{session.notes}</p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(session.id)}
                      className="flex-shrink-0 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete Session</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete this practice session? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
