'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { Target, CheckCircle, Clock, AlertCircle, Plus, Award, TrendingUp, Calendar, Search, Filter, ChevronDown, PieChart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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

  // Calculate deadline countdown
  const getDeadlineCountdown = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, color: 'red' };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'yellow' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'yellow' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: 'yellow' };
    } else {
      return { text: `${diffDays} days left`, color: 'green' };
    }
  };

  // Get countdown color class
  const getCountdownColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-400';
      case 'yellow':
        return 'text-yellow-400';
      case 'red':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Calculate milestone status
  const getMilestones = (progress: number) => {
    const milestones = [
      { percentage: 25, label: '25%' },
      { percentage: 50, label: '50%' },
      { percentage: 75, label: '75%' },
      { percentage: 100, label: '100%' },
    ];
    return milestones.map(m => ({
      ...m,
      completed: progress >= m.percentage
    }));
  };

  // Get completion date from goal (if completed, use deadline as completion date)
  const getCompletionDate = (goal: Goal) => {
    if (goal.status === 'completed') {
      return new Date(goal.deadline).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return null;
  };

  // Calculate analytics data
  const goalCompletionRate = goals.length > 0 
    ? Math.round((completedGoals / goals.length) * 100) 
    : 0;

  const goalsCompletedThisMonth = goals.filter(goal => {
    if (goal.status !== 'completed') return false;
    const completionDate = new Date(goal.deadline);
    const now = new Date();
    return (
      completionDate.getMonth() === now.getMonth() &&
      completionDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const hasInsufficientData = goals.length === 0;

  // Data for Active vs Completed pie chart
  const pieChartData = [
    { name: 'Active', value: activeGoals, color: '#3b82f6' },
    { name: 'Completed', value: completedGoals, color: '#22c55e' },
  ].filter(item => item.value > 0);

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

          {/* Goal Analytics Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            {hasInsufficientData ? (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
                <PieChart className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Insufficient Data for Analytics</h3>
                <p className="text-slate-400 text-sm">Create some goals to see your analytics dashboard</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Goal Completion Rate */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Completion Rate</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{goalCompletionRate}%</p>
                  <p className="text-xs text-slate-400 mt-1">of all goals completed</p>
                </motion.div>

                {/* Average Goal Progress */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Avg Progress</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{averageProgress}%</p>
                  <p className="text-xs text-slate-400 mt-1">across all goals</p>
                </motion.div>

                {/* Goals Completed This Month */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">This Month</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{goalsCompletedThisMonth}</p>
                  <p className="text-xs text-slate-400 mt-1">goals completed</p>
                </motion.div>

                {/* Active vs Completed Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <PieChart className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Distribution</h3>
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={35}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                            border: '1px solid rgba(71, 85, 105, 0.5)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Search, Filter, and Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
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
              transition={{ duration: 0.5, delay: 0.3 }}
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
              transition={{ duration: 0.5, delay: 0.3 }}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => {
                const progress = goal.target_distance > 0 
                  ? Math.round((goal.current_distance / goal.target_distance) * 100) 
                  : 0;
                const deadlineCountdown = getDeadlineCountdown(goal.deadline);
                const milestones = getMilestones(progress);
                const completionDate = getCompletionDate(goal);
                const isCompleted = progress >= 100 || goal.status === 'completed';
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Celebration Animation for 100% Completion */}
                    {isCompleted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-purple-500/10" />
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1.5, rotate: 0 }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                          className="absolute top-2 right-2 w-8 h-8"
                        >
                          <CheckCircle className="w-full h-full text-green-400" />
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Header with Badges */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{goal.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {/* Status Badge */}
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(goal.status)}`}
                          >
                            {getStatusIcon(goal.status)}
                            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                          </motion.span>
                          
                          {/* Priority Badge */}
                          {goal.priority && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: 0.15 }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(goal.priority)}`}
                            >
                              {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                            </motion.span>
                          )}

                          {/* Goal Completed Badge */}
                          {isCompleted && completionDate && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.4 }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border bg-green-500/20 text-green-400 border-green-500/30"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Completed {completionDate}
                            </motion.span>
                          )}
                        </div>
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
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                        />
                      </div>
                      <p className="text-right text-sm text-slate-400 mt-1">{progress}%</p>
                    </div>

                    {/* Milestone Timeline */}
                    <div className="mb-4">
                      <p className="text-sm text-slate-400 mb-3">Milestones</p>
                      <div className="flex items-center justify-between gap-2">
                        {milestones.map((milestone, index) => (
                          <motion.div
                            key={milestone.label}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                            className="flex flex-col items-center gap-1"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                milestone.completed
                                  ? 'bg-green-500/20 border-green-500 text-green-400'
                                  : 'bg-slate-800 border-slate-700 text-slate-500'
                              }`}
                            >
                              {milestone.completed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <span className="text-xs font-medium">{milestone.label}</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Deadline Countdown */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className={getCountdownColor(deadlineCountdown.color)}>
                        {deadlineCountdown.text}
                      </span>
                    </motion.div>
                  </motion.div>
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
