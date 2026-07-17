'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Target,
  FileText,
  Clock,
  Award,
  TrendingUp,
  Search,
  ChevronDown,
  Medal,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { motion } from 'framer-motion';

interface Competition {
  id: string;
  user_id: string;
  competition_name: string;
  venue: string;
  competition_date: string;
  target_distance: number;
  notes: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
  final_throw_distance?: number;
  position?: number;
  medal?: 'gold' | 'silver' | 'bronze' | null;
}

export default function CompetitionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    bestResult: 0,
    nextCompetitionDays: 0,
  });
  const [performanceStats, setPerformanceStats] = useState({
    bestCompetitionResult: 0,
    averageCompetitionDistance: 0,
    totalMedals: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-newest');

  useEffect(() => {
    fetchCompetitions();
  }, []);

  // Load filter and sort from localStorage on mount
  useEffect(() => {
    const savedFilter = localStorage.getItem('competition-filter');
    const savedSort = localStorage.getItem('competition-sort');
    if (savedFilter) setSelectedFilter(savedFilter);
    if (savedSort) setSortBy(savedSort);
  }, []);

  // Save filter and sort to localStorage when changed
  useEffect(() => {
    localStorage.setItem('competition-filter', selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    localStorage.setItem('competition-sort', sortBy);
  }, [sortBy]);

  async function fetchCompetitions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('user_id', user.id)
        .order('competition_date', {
          ascending: true,
        });

      if (error) throw error;

      setCompetitions(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const upcoming = data.filter(c => c.status === 'upcoming').length;
        const completed = data.filter(c => c.status === 'completed').length;
        const bestResult = Math.max(...data.map(c => c.target_distance));
        
        // Find next upcoming competition
        const upcomingCompetitions = data
          .filter(c => c.status === 'upcoming')
          .sort((a, b) => new Date(a.competition_date).getTime() - new Date(b.competition_date).getTime());
        
        const nextCompetitionDays = upcomingCompetitions.length > 0
          ? Math.ceil((new Date(upcomingCompetitions[0].competition_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        setStats({
          upcoming,
          completed,
          bestResult,
          nextCompetitionDays: nextCompetitionDays > 0 ? nextCompetitionDays : 0,
        });

        // Calculate performance stats for completed competitions
        const completedCompetitions = data.filter(c => c.status === 'completed' && c.final_throw_distance);
        if (completedCompetitions.length > 0) {
          const bestCompetitionResult = Math.max(...completedCompetitions.map(c => c.final_throw_distance || 0));
          const averageCompetitionDistance = completedCompetitions.reduce((sum, c) => sum + (c.final_throw_distance || 0), 0) / completedCompetitions.length;
          const totalMedals = completedCompetitions.filter(c => c.medal && c.medal !== null).length;

          setPerformanceStats({
            bestCompetitionResult: Math.round(bestCompetitionResult * 10) / 10,
            averageCompetitionDistance: Math.round(averageCompetitionDistance * 10) / 10,
            totalMedals,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400';

      case 'completed':
        return 'bg-green-500/20 text-green-400';

      case 'cancelled':
        return 'bg-red-500/20 text-red-400';

      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  }

  // Get comparison with previous competition
  const getComparison = (competition: Competition, allCompetitions: Competition[]) => {
    const completedCompetitions = allCompetitions
      .filter(c => c.status === 'completed' && c.final_throw_distance)
      .sort((a, b) => new Date(a.competition_date).getTime() - new Date(b.competition_date).getTime());
    
    const currentIndex = completedCompetitions.findIndex(c => c.id === competition.id);
    if (currentIndex <= 0 || !competition.final_throw_distance) return null;
    
    const previousCompetition = completedCompetitions[currentIndex - 1];
    const currentDistance = competition.final_throw_distance;
    const previousDistance = previousCompetition.final_throw_distance || 0;
    
    if (currentDistance > previousDistance) return 'improved';
    if (currentDistance < previousDistance) return 'declined';
    return 'no-change';
  };

  // Get medal color
  const getMedalColor = (medal: string | null | undefined) => {
    switch (medal) {
      case 'gold':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'silver':
        return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
      case 'bronze':
        return 'bg-orange-700/20 text-orange-400 border-orange-700/30';
      default:
        return '';
    }
  };

  // Check if personal best
  const isPersonalBest = (competition: Competition) => {
    return competition.final_throw_distance === performanceStats.bestCompetitionResult;
  };

  // Filter and sort competitions
  const filteredCompetitions = competitions.filter(competition => {
    // Search by competition name and venue
    const matchesSearch = 
      competition.competition_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      competition.venue.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by criteria
    const matchesFilter = () => {
      const now = new Date();
      const competitionDate = new Date(competition.competition_date);
      
      switch (selectedFilter) {
        case 'all':
          return true;
        case 'upcoming':
          return competition.status === 'upcoming';
        case 'completed':
          return competition.status === 'completed';
        case 'this-month':
          return (
            competitionDate.getMonth() === now.getMonth() &&
            competitionDate.getFullYear() === now.getFullYear()
          );
        case 'this-year':
          return competitionDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    };

    return matchesSearch && matchesFilter();
  }).sort((a, b) => {
    // Sort logic
    switch (sortBy) {
      case 'date-newest':
        return new Date(b.competition_date).getTime() - new Date(a.competition_date).getTime();
      case 'date-oldest':
        return new Date(a.competition_date).getTime() - new Date(b.competition_date).getTime();
      case 'venue-az':
        return a.venue.localeCompare(b.venue);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <TopNavbar />
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24">
            <div className="space-y-6">
              <div className="h-10 w-48 bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-6 w-96 bg-slate-800 rounded-lg animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-pulse">
                    <div className="h-6 w-3/4 bg-slate-800 rounded-lg mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 w-1/2 bg-slate-800 rounded" />
                      <div className="h-4 w-1/3 bg-slate-800 rounded" />
                      <div className="h-4 w-2/3 bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <TopNavbar />
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400">Please log in to view competitions.</p>
              <Link href="/login" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
                Go to login
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <TopNavbar />
        <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Competition Planner
            </h1>

            <p className="text-slate-400 mt-2">
              Plan and manage your competitions.
            </p>
          </div>

          <Link
            href="/competition/new"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          >
            <Plus className="w-5 h-5" />
            Add Competition
          </Link>
        </div>

        {/* Summary Cards */}
        {!loading && competitions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
          >
            {/* Upcoming Competitions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Upcoming</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
              <p className="text-xs text-slate-400 mt-1">competitions</p>
            </motion.div>

            {/* Completed Competitions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Completed</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.completed}</p>
              <p className="text-xs text-slate-400 mt-1">competitions</p>
            </motion.div>

            {/* Best Competition Result */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Best Result</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.bestResult}m</p>
              <p className="text-xs text-slate-400 mt-1">target distance</p>
            </motion.div>

            {/* Next Competition Countdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Next Competition</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.nextCompetitionDays > 0 ? `${stats.nextCompetitionDays}d` : 'None'}
              </p>
              <p className="text-xs text-slate-400 mt-1">until next event</p>
            </motion.div>
          </motion.div>
        )}

        {/* Search, Filter, and Sort */}
        {!loading && competitions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-6"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by competition name or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'this-month', label: 'This Month' },
                  { value: 'this-year', label: 'This Year' },
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
              <div className="flex items-center gap-4">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-48 pl-4 pr-10 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="date-newest">Date (Newest First)</option>
                    <option value="date-oldest">Date (Oldest First)</option>
                    <option value="venue-az">Venue (A–Z)</option>
                    <option value="status">Status</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>

                {/* Results Count */}
                <p className="text-slate-400 text-sm">
                  Showing {filteredCompetitions.length} of {competitions.length} competitions
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Performance Summary Card */}
        {!loading && stats.completed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Medal className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Performance Summary</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Best Competition Result</p>
                  <p className="text-2xl font-bold text-purple-400">{performanceStats.bestCompetitionResult}m</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Average Competition Distance</p>
                  <p className="text-2xl font-bold text-blue-400">{performanceStats.averageCompetitionDistance}m</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total Medals Earned</p>
                  <p className="text-2xl font-bold text-yellow-400">{performanceStats.totalMedals}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Competition Results Section */}
        {!loading && stats.completed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Competition Results</h2>
            </div>
            
            {competitions.filter(c => c.status === 'completed' && c.final_throw_distance).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-12 text-center"
              >
                <Medal className="mx-auto w-16 h-16 text-slate-500 mb-6" />
                <h2 className="text-3xl font-bold text-white mb-3">No competition results yet</h2>
                <p className="text-slate-400 mb-8">Complete a competition and record your results to see your performance</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {competitions
                  .filter(c => c.status === 'completed' && c.final_throw_distance)
                  .sort((a, b) => new Date(b.competition_date).getTime() - new Date(a.competition_date).getTime())
                  .map((competition, index) => {
                    const comparison = getComparison(competition, competitions);
                    const personalBest = isPersonalBest(competition);
                    
                    return (
                      <motion.div
                        key={competition.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">{competition.competition_name}</h3>
                            <p className="text-sm text-slate-400">{formatDate(competition.competition_date)}</p>
                          </div>
                          {competition.medal && (
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getMedalColor(competition.medal)}`}>
                              {competition.medal.charAt(0).toUpperCase() + competition.medal.slice(1)}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Final Throw</span>
                            <span className="text-white font-semibold">{competition.final_throw_distance}m</span>
                          </div>
                          {competition.position && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Position</span>
                              <span className="text-white font-semibold">#{competition.position}</span>
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {personalBest && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                                className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium border border-purple-500/30"
                              >
                                Personal Best
                              </motion.div>
                            )}
                            {comparison && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 + 0.15 }}
                                className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${
                                  comparison === 'improved' 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : comparison === 'declined'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                }`}
                              >
                                {comparison === 'improved' && <ArrowUp className="w-3 h-3" />}
                                {comparison === 'declined' && <ArrowDown className="w-3 h-3" />}
                                {comparison === 'no-change' && <Minus className="w-3 h-3" />}
                                {comparison === 'improved' ? 'Improved' : comparison === 'declined' ? 'Declined' : 'No Change'}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}

        {competitions.length === 0 ? (

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-12 text-center"
          >

            <Trophy className="mx-auto w-16 h-16 text-slate-500 mb-6" />

            <h2 className="text-3xl font-bold text-white mb-3">
              No competitions yet
            </h2>

            <p className="text-slate-400 mb-8">
              Create your first competition and start planning your season.
            </p>

            <Link
              href="/competition/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <Plus className="w-5 h-5" />
              Add Competition
            </Link>

          </motion.div>

        ) : filteredCompetitions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-12 text-center"
          >
            <Trophy className="mx-auto w-16 h-16 text-slate-500 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-3">No competitions match your filters</h2>
            <p className="text-slate-400 mb-8">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
                setSortBy('date-newest');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredCompetitions.map((competition, index) => (
              <motion.div
                key={competition.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={`/competition/${competition.id}`}
                  className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 block cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-5">
                    <h2 className="text-xl font-bold text-white">
                      {competition.competition_name}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        competition.status
                      )}`}
                    >
                      {competition.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-slate-400">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4" />
                      {competition.venue}
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      {formatDate(competition.competition_date)}
                    </div>

                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4" />
                      {competition.target_distance} m
                    </div>

                    {competition.notes && (
                      <div className="flex items-start gap-3 pt-2">
                        <FileText className="w-4 h-4 mt-1" />
                        <p>{competition.notes}</p>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        </div>
      </main>
    </div>
  );
}