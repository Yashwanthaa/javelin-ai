'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNavbar from '@/components/dashboard/TopNavbar';
import Link from 'next/link';
import { Plus, History, Target, TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PracticeStats {
  totalSessions: number;
  bestThrow: number;
  averageDistance: number;
  sessionsThisMonth: number;
}

interface PracticeSession {
  id: string;
  session_date: string;
  distance: number;
}

type TimeRange = '7-sessions' | '30-days' | 'all-time';

export default function PracticePage() {
  const [stats, setStats] = useState<PracticeStats>({
    totalSessions: 0,
    bestThrow: 0,
    averageDistance: 0,
    sessionsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7-sessions');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('id, distance, session_date')
        .eq('user_id', user.id)
        .order('session_date', { ascending: true });

      if (sessions && sessions.length > 0) {
        setSessions(sessions);
        
        const distances = sessions.map(s => s.distance || 0);
        const totalSessions = sessions.length;
        const bestThrow = Math.max(...distances);
        const averageDistance = distances.reduce((a, b) => a + b, 0) / totalSessions;

        // Calculate sessions this month
        const now = new Date();
        const sessionsThisMonth = sessions.filter(session => {
          const sessionDate = new Date(session.session_date);
          return (
            sessionDate.getMonth() === now.getMonth() &&
            sessionDate.getFullYear() === now.getFullYear()
          );
        }).length;

        setStats({
          totalSessions,
          bestThrow,
          averageDistance: Math.round(averageDistance * 10) / 10,
          sessionsThisMonth,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions based on time range
  const getFilteredSessions = () => {
    const now = new Date();
    switch (timeRange) {
      case '7-sessions':
        return sessions.slice(-7);
      case '30-days':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return sessions.filter(s => new Date(s.session_date) >= thirtyDaysAgo);
      case 'all-time':
        return sessions;
      default:
        return sessions;
    }
  };

  // Calculate chart stats
  const getChartStats = (filteredSessions: PracticeSession[]) => {
    if (filteredSessions.length === 0) {
      return { highest: 0, lowest: 0, average: 0 };
    }
    const distances = filteredSessions.map(s => s.distance);
    const highest = Math.max(...distances);
    const lowest = Math.min(...distances);
    const average = distances.reduce((a, b) => a + b, 0) / distances.length;
    return {
      highest: Math.round(highest * 10) / 10,
      lowest: Math.round(lowest * 10) / 10,
      average: Math.round(average * 10) / 10,
    };
  };

  // Prepare chart data
  const getChartData = (filteredSessions: PracticeSession[]) => {
    return filteredSessions.map((session, index) => ({
      name: index + 1,
      date: new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      distance: Math.round(session.distance * 10) / 10,
    }));
  };

  const filteredSessions = getFilteredSessions();
  const chartStats = getChartStats(filteredSessions);
  const chartData = getChartData(filteredSessions);
  const hasInsufficientData = filteredSessions.length < 2;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <TopNavbar />
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24">
            <div className="space-y-6">
              <div className="h-10 w-48 bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-6 w-64 bg-slate-800 rounded-lg animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse" />
                ))}
              </div>
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
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Practice Logger</h1>
            <p className="text-slate-400">Track your training sessions and monitor your progress</p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
          >
            <Link
              href="/practice/new"
              className="group relative bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">New Practice</h2>
                  <p className="text-slate-400 text-sm">Log a new training session</p>
                </div>
              </div>
            </Link>

            <Link
              href="/practice/history"
              className="group relative bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <History className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Practice History</h2>
                  <p className="text-slate-400 text-sm">View all your sessions</p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Statistics Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            {stats.totalSessions === 0 ? (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
                <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Practice Sessions Yet</h3>
                <p className="text-slate-400 text-sm">Log your first practice session to see your statistics</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Practice Sessions */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Total Sessions</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
                  <p className="text-xs text-slate-400 mt-1">all time</p>
                </motion.div>

                {/* Average Throw Distance */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Avg Distance</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.averageDistance}m</p>
                  <p className="text-xs text-slate-400 mt-1">per session</p>
                </motion.div>

                {/* Personal Best */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">Personal Best</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.bestThrow}m</p>
                  <p className="text-xs text-slate-400 mt-1">best throw</p>
                </motion.div>

                {/* Sessions This Month */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">This Month</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.sessionsThisMonth}</p>
                  <p className="text-xs text-slate-400 mt-1">sessions</p>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Performance Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            {stats.totalSessions === 0 ? (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
                <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Practice Sessions Yet</h3>
                <p className="text-slate-400 text-sm">Log your first practice session to see your performance trends</p>
              </div>
            ) : hasInsufficientData ? (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
                <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Insufficient Data for Chart</h3>
                <p className="text-slate-400 text-sm">You need at least 2 practice sessions to view performance trends</p>
              </div>
            ) : (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Performance Trends</h2>
                  </div>

                  {/* Time Range Selector */}
                  <div className="flex gap-2">
                    {[
                      { value: '7-sessions' as TimeRange, label: 'Last 7 Sessions' },
                      { value: '30-days' as TimeRange, label: 'Last 30 Days' },
                      { value: 'all-time' as TimeRange, label: 'All Time' },
                    ].map((range) => (
                      <motion.button
                        key={range.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTimeRange(range.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          timeRange === range.value
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                        }`}
                      >
                        {range.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Chart Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-1">Highest Throw</p>
                    <p className="text-xl font-bold text-green-400">{chartStats.highest}m</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-1">Lowest Throw</p>
                    <p className="text-xl font-bold text-red-400">{chartStats.lowest}m</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-1">Average Distance</p>
                    <p className="text-xl font-bold text-blue-400">{chartStats.average}m</p>
                  </div>
                </div>

                {/* Line Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          border: '1px solid rgba(71, 85, 105, 0.5)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => [`${value}m`, 'Distance']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="distance" 
                        stroke="#a855f7" 
                        strokeWidth={3}
                        dot={{ fill: '#a855f7', r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
