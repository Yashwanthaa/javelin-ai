'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { Target, CheckCircle, Clock, AlertCircle, Plus, Award, TrendingUp, Calendar, Search, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_distance: number;
  current_distance: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}

export default function GoalsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

  // Load filter from localStorage on mount
  useEffect(() => {
    const savedFilter = localStorage.getItem('goals-filter');
    if (savedFilter) {
      setSelectedFilter(savedFilter);
    }
  }, []);

  // Save filter to localStorage when changed
  useEffect(() => {
    localStorage.setItem('goals-filter', selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    async function fetchGoals() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setLoading(false);
          return;
        }

        setUser(user);

        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setGoals(goalsData || []);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchGoals();
  }, []);

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Calculate overdue goals
  const overdueGoals = goals.filter(g => {
    if (g.status !== 'active') return false;
    const deadline = new Date(g.deadline);
    const today = new Date();
    return deadline < today;
  }).length;

  // Calculate average progress for active goals
  const averageProgress = goals.length > 0 ? Math.round(
    goals.reduce((sum, goal) => {
      const progress = goal.target_distance > 0 
        ? (goal.current_distance / goal.target_distance) * 100 
        : 0;
      return sum + progress;
    }, 0) / goals.length
  ) : 0;

  // Filter and sort goals
  const filteredGoals = goals.filter(goal => {
    // Search by title and notes
    const matchesSearch = 
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (goal.notes && goal.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by status and other criteria
    const matchesFilter = () => {
      switch (selectedFilter) {
        case 'all':
          return true;
        case 'active':
          return goal.status === 'active';
        case 'completed':
          return goal.status === 'completed';
        case 'overdue':
          if (goal.status !== 'active') return false;
          const deadline = new Date(goal.deadline);
          const today = new Date();
          return deadline < today;
        case 'high-priority':
          return goal.priority === 'high';
        default:
          return true;
      }
    };

    return matchesSearch && matchesFilter();
  }).sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        return aPriority - bPriority;
      case 'progress':
        const aProgress = a.target_distance > 0 ? (a.current_distance / a.target_distance) * 100 : 0;
        const bProgress = b.target_distance > 0 ? (b.current_distance / b.target_distance) * 100 : 0;
        return bProgress - aProgress;
      case 'recently-created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <TopNavbar />
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24">
            <div className="mb-8">
              <div className="h-10 w-32 bg-slate-800 rounded-lg animate-pulse mb-2" />
              <div className="h-6 w-64 bg-slate-800 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <div className="h-12 w-12 bg-slate-800 rounded-xl animate-pulse mb-4" />
                  <div className="h-6 w-24 bg-slate-800 rounded-lg animate-pulse mb-2" />
                  <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
                </div>
              ))}
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Goals</h1>
              <p className="text-slate-400">Track your training goals and progress</p>
            </div>
            <Link
              href="/goals/new"
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <Plus className="w-5 h-5" />
              Create Goal
            </Link>
          </motion.div>

          {/* Goal Progress Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Summary Cards */}
              <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Active Goals */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Active Goals</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{activeGoals}</p>
                </motion.div>

                {/* Completed Goals */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Completed</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{completedGoals}</p>
                </motion.div>

                {/* Overdue Goals */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Overdue</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{overdueGoals}</p>
                </motion.div>

                {/* Average Progress */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Avg Progress</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{averageProgress}%</p>
                </motion.div>
              </div>

              {/* Circular Overall Progress */}
              <motion.div
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center hover:border-slate-700 transition-all duration-300"
              >
                <h3 className="text-sm font-medium text-slate-400 mb-4">Overall Progress</h3>
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: completionRate / 100 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      style={{
                        strokeDasharray: "251.2",
                        strokeDashoffset: "251.2"
                      }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{completionRate}%</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

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
                  placeholder="Search goals by title or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'high-priority', label: 'High Priority' },
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
                  <option value="deadline">Sort by Deadline</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="progress">Sort by Progress</option>
                  <option value="recently-created">Sort by Recently Created</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Results Count */}
            <p className="text-slate-400 text-sm mt-3">
              Showing {filteredGoals.length} of {goals.length} goals
            </p>
          </motion.div>

          {/* Goals Grid */}
          {filteredGoals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {goals.length === 0 ? 'No Goals Yet' : 'No Matching Goals'}
              </h3>
              <p className="text-slate-400 mb-6">
                {goals.length === 0 
                  ? 'Create your first goal to start tracking your progress' 
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {goals.length === 0 && (
                <Link
                  href="/goals/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  Create Goal
                </Link>
              )}
            </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => {
                const progress = goal.target_distance > 0 
                  ? Math.round((goal.current_distance / goal.target_distance) * 100) 
                  : 0;
                const daysUntil = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={goal.id}
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{goal.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(goal.status)}`}>
                          {getStatusIcon(goal.status)}
                          {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Target Distance */}
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm text-slate-400">Target</p>
                        <p className="text-lg font-semibold text-white">{goal.target_distance}m</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Progress</span>
                        <span className="text-sm font-medium text-white">{goal.current_distance}m / {goal.target_distance}m</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-right text-sm text-slate-400 mt-1">{progress}%</p>
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">
                        {daysUntil > 0 ? `${daysUntil} days remaining` : daysUntil === 0 ? 'Due today' : 'Overdue'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
