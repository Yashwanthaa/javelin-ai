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

  useEffect(() => {
    fetchCompetitions();
  }, []);

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

        ) : (

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >

            {competitions.map((competition) => (

              <Link
                key={competition.id}
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

            ))}

          </motion.div>

        )}

        </div>
      </main>
    </div>
  );
}