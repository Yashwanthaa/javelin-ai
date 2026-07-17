'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNavbar from '@/components/dashboard/TopNavbar';
import Link from 'next/link';
import { Target, TrendingUp, Calendar, BarChart3, Plus, ArrowUp, ArrowDown, Filter, Trophy, Award, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticsStats {
  totalSessions: number;
  personalBest: number;
  averageDistance: number;
  totalDistance: number;
  thisWeekSessions: number;
  thisMonthSessions: number;
  totalSessionsTrend: number;
  personalBestTrend: number;
  averageDistanceTrend: number;
  totalDistanceTrend: number;
  thisWeekTrend: number;
  thisMonthTrend: number;
}

interface Practice {
  id: string;
  user_id: string;
  date: string;
  average_throw: number;
  best_throw: number;
  total_throws: number;
  notes: string | null;
  created_at: string;
}

interface Competition {
  id: string;
  user_id: string;
  competition_name: string;
  competition_date: string;
  venue: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  result_distance: number | null;
  created_at: string;
}

interface AthleteProfile {
  id: string;
  user_id: string;
  name: string;
  personal_best: number | null;
  target_distance: number | null;
  height: number | null;
  weight: number | null;
  dominant_hand: string | null;
  created_at: string;
}

type DateRange = '7d' | '30d' | '6m' | 'all';

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsStats>({
    totalSessions: 0,
    personalBest: 0,
    averageDistance: 0,
    totalDistance: 0,
    thisWeekSessions: 0,
    thisMonthSessions: 0,
    totalSessionsTrend: 0,
    personalBestTrend: 0,
    averageDistanceTrend: 0,
    totalDistanceTrend: 0,
    thisWeekTrend: 0,
    thisMonthTrend: 0,
  });
  const [totalCompetitions, setTotalCompetitions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [insufficientData, setInsufficientData] = useState(false);

  

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch practices
      const { data: practicesData, error: practicesError } = await supabase
        .from('practices')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (practicesError) throw practicesError;

      // Fetch competitions
      const { data: competitionsData, error: competitionsError } = await supabase
        .from('competitions')
        .select('*')
        .eq('user_id', user.id)
        .order('competition_date', { ascending: true });

      if (competitionsError) throw competitionsError;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      setCompetitions(competitionsData || []);
      setProfile(profileData);
      setTotalCompetitions(competitionsData?.length || 0);

      // Filter by date range
      let filteredPractices = practicesData || [];
      if (practicesData && practicesData.length > 0) {
        const now = new Date();
        if (dateRange === '7d') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredPractices = practicesData.filter(p => new Date(p.date) >= sevenDaysAgo);
        } else if (dateRange === '30d') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredPractices = practicesData.filter(p => new Date(p.date) >= thirtyDaysAgo);
        } else if (dateRange === '6m') {
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          filteredPractices = practicesData.filter(p => new Date(p.date) >= sixMonthsAgo);
        }
      }

      if (filteredPractices && filteredPractices.length > 0) {
        setPractices(filteredPractices);
        setHasData(true);
        setInsufficientData(filteredPractices.length < 2);
        const bestThrows = filteredPractices.map(p => p.best_throw);
        const totalSessions = practicesData.length;
        const personalBest = Math.max(...bestThrows);
        const averageDistance = bestThrows.reduce((a, b) => a + b, 0) / totalSessions;
        const totalDistance = bestThrows.reduce((a, b) => a + b, 0);

        // Calculate this week's sessions
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekSessions = filteredPractices.filter(p => new Date(p.date) >= weekAgo).length;

        // Calculate this month's sessions
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthSessions = filteredPractices.filter(p => new Date(p.date) >= monthAgo).length;

        // Calculate trends (compare with previous period)
        const previousWeekSessions = filteredPractices.filter(p => {
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const date = new Date(p.date);
          return date >= twoWeeksAgo && date < weekAgo;
        }).length;
        const thisWeekTrend = previousWeekSessions > 0 ? ((thisWeekSessions - previousWeekSessions) / previousWeekSessions) * 100 : 0;

        const previousMonthSessions = filteredPractices.filter(p => {
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const date = new Date(p.date);
          return date >= twoMonthsAgo && date < oneMonthAgo;
        }).length;
        const thisMonthTrend = previousMonthSessions > 0 ? ((thisMonthSessions - previousMonthSessions) / previousMonthSessions) * 100 : 0;

        setStats({
          totalSessions: filteredPractices.length,
          personalBest,
          averageDistance: Math.round(averageDistance * 10) / 10,
          totalDistance: Math.round(totalDistance * 10) / 10,
          thisWeekSessions,
          thisMonthSessions,
          totalSessionsTrend: 5.2,
          personalBestTrend: 3.1,
          averageDistanceTrend: 2.4,
          totalDistanceTrend: 8.7,
          thisWeekTrend: Math.round(thisWeekTrend * 10) / 10,
          thisMonthTrend: Math.round(thisMonthTrend * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const getChartData = () => {
    if (!practices || practices.length === 0) return null;

    // Throw Distance Progress Over Time - Line chart
    const throwDistanceProgress = practices.map((p) => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
 throwDistance: p.best_throw,
    }));

    // Monthly Practice Sessions - Bar chart
    const monthlyPracticeSessions: { month: string; sessions: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthPractices = practices.filter(
        p => new Date(p.date) >= monthDate && new Date(p.date) < monthEnd
      );
      monthlyPracticeSessions.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        sessions: monthPractices.length,
      });
    }

    // Practice vs Competition Distribution - Pie chart
    const distributionData = [
      { name: 'Practice Sessions', value: stats.totalSessions },
      { name: 'Competitions', value: totalCompetitions },
    ];

    const COLORS = ['#8b5cf6', '#3b82f6'];

    return {
      throwDistanceProgress,
      monthlyPracticeSessions,
      distributionData,
      COLORS,
    };
  };

  const chartData = getChartData();

  // AI Performance Summary
  const getPerformanceSummary = () => {
    if (!practices || practices.length === 0) return null;

    // Calculate monthly averages
    const monthlyAverages: { month: string; average: number; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthPractices = practices.filter(
        p => new Date(p.date) >= monthDate && new Date(p.date) < monthEnd
      );
      if (monthPractices.length > 0) {
        const average = monthPractices.reduce((sum, p) => sum + p.best_throw, 0) / monthPractices.length;
        monthlyAverages.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          average: Math.round(average * 10) / 10,
          count: monthPractices.length,
        });
      }
    }

    // Find strongest and weakest months
    const strongestMonth = monthlyAverages.length > 0 
      ? monthlyAverages.reduce((max, m) => m.average > max.average ? m : max)
      : null;
    const weakestMonth = monthlyAverages.length > 0
      ? monthlyAverages.reduce((min, m) => m.average < min.average ? m : min)
      : null;

    // Calculate consistency (variance)
    const allThrows = practices.map(p => p.best_throw);
    const mean = allThrows.reduce((a, b) => a + b, 0) / allThrows.length;
    const variance = allThrows.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allThrows.length;
    const consistencyScore = Math.max(0, 1 - (variance / (mean * mean)));

    // Most consistent period (lowest variance in a 4-week window)
    let mostConsistentPeriod = 'Not enough data';
    if (practices.length >= 4) {
      let bestVariance = Infinity;
      for (let i = 0; i <= practices.length - 4; i++) {
        const window = practices.slice(i, i + 4).map(p => p.best_throw);
        const windowMean = window.reduce((a, b) => a + b, 0) / window.length;
        const windowVariance = window.reduce((sum, val) => sum + Math.pow(val - windowMean, 2), 0) / window.length;
        if (windowVariance < bestVariance) {
          bestVariance = windowVariance;
          const startDate = new Date(practices[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endDate = new Date(practices[i + 3].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          mostConsistentPeriod = `${startDate} - ${endDate}`;
        }
      }
    }

    // Estimated improvement rate (meters/month)
    let improvementRate = 0;
    if (monthlyAverages.length >= 2) {
      const firstMonth = monthlyAverages[0];
      const lastMonth = monthlyAverages[monthlyAverages.length - 1];
      improvementRate = (lastMonth.average - firstMonth.average) / monthlyAverages.length;
    }

    return {
      strongestMonth,
      weakestMonth,
      mostConsistentPeriod,
      improvementRate: Math.round(improvementRate * 10) / 10,
      consistencyScore: Math.round(consistencyScore * 100),
    };
  };

  const performanceSummary = getPerformanceSummary();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <TopNavbar />
        <div className="p-4 sm:p-6 lg:p-8 pt-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Analytics</h1>
                <p className="text-slate-400">Track your performance and progress</p>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRange)}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-slate-700/50 mb-4" />
                    <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-slate-700/50 rounded w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          ) : !hasData ? (
            /* Empty State */
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
              <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No analytics data yet</h3>
              <p className="text-slate-400 mb-6">Start logging your practice sessions to see your analytics</p>
              <Link
                href="/practice/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Practice Session
              </Link>
            </div>
          ) : (
            <>
            {/* Statistics Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {/* Total Practice Sessions */}
              <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-105 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.totalSessions}</div>
                  <div className="text-slate-400 text-sm">Total Practice Sessions</div>
                </div>
              </motion.div>

              {/* Total Competitions */}
              <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{totalCompetitions}</div>
                  <div className="text-slate-400 text-sm">Total Competitions</div>
                </div>
              </motion.div>

              {/* Personal Best Throw */}
              <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-6 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-105 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.personalBest.toFixed(1)}m</div>
                  <div className="text-slate-400 text-sm">Personal Best Throw</div>
                </div>
              </motion.div>

              {/* Average Throw Distance */}
              <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-6 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-105 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.averageDistance.toFixed(1)}m</div>
                  <div className="text-slate-400 text-sm">Average Throw Distance</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Performance Charts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Performance Charts</h2>
              {insufficientData ? (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">More practice sessions needed</h3>
                  <p className="text-slate-400">More practice sessions are needed to generate analytics.</p>
                </div>
              ) : chartData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Throw Distance Progress Over Time - Line Chart */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                      Throw Distance Progress Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData.throwDistanceProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '#334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(value: any) => `${value}m`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="throwDistance" 
                          stroke="#8b5cf6" 
                          strokeWidth={2} 
                          dot={{ fill: '#8b5cf6' }}
                          animationDuration={1000} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monthly Practice Sessions - Bar Chart */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
                      Monthly Practice Sessions
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.monthlyPracticeSessions}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '#334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="sessions" fill="#10b981" animationDuration={1000} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Practice vs Competition Distribution - Pie Chart */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                      Practice vs Competition Distribution
                    </h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData.distributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={1000}
                          >
                            {chartData.distributionData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={chartData.COLORS[index % chartData.COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '#334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No chart data</h3>
                  <p className="text-slate-400">Unable to generate charts with current data.</p>
                </div>
              )}
            </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
