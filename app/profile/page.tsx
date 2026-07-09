'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { User as UserLucide, Mail, Calendar, Ruler, Weight, Target, Edit, Plus, TrendingUp, Award, Activity, Flame, Trophy, Clock, Zap, Camera, MapPin, UserCheck, Medal, X, Save, Globe, Map, AlertTriangle, Phone, Heart, Brain, Star } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { motion } from 'framer-motion';

interface AthleteProfile {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  height: number;
  weight: number;
  dominant_arm: string;
  personal_best: number;
  bio: string;
  avatar_url: string;
  primary_event?: string;
  club?: string;
  coach?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;
  state?: string;
  season_best?: number;
  training_experience?: number;
  competition_level?: string;
  dominant_throw_style?: string;
  blood_group?: string;
  injury_history?: string;
  allergies?: string;
  fitness_status?: 'excellent' | 'good' | 'recovering' | 'injured';
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  created_at: string;
}

interface Practice {
  id: string;
  user_id: string;
  date: string;
  best_throw: number;
  average_throw: number;
  total_throws: number;
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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<AthleteProfile>>({});
  const [isEditingPerformanceInfo, setIsEditingPerformanceInfo] = useState(false);
  const [editedPerformance, setEditedPerformance] = useState<Partial<AthleteProfile>>({});
  const [isEditingMedicalInfo, setIsEditingMedicalInfo] = useState(false);
  const [editedMedical, setEditedMedical] = useState<Partial<AthleteProfile>>({});
  const [isEditingEmergencyContact, setIsEditingEmergencyContact] = useState(false);
  const [editedEmergencyContact, setEditedEmergencyContact] = useState<Partial<AthleteProfile>>({});

  useEffect(() => {
    async function fetchUserAndProfile() {
      try {
        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // Fetch athlete profile
        const { data: profileData, error: profileError } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        setProfile(profileData);

        // Fetch practices and competitions
        const [practicesData, competitionsData] = await Promise.all([
          supabase.from('practices').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('competitions').select('*').eq('user_id', user.id).order('competition_date', { ascending: false }),
        ]);

        setPractices(practicesData.data || []);
        setCompetitions(competitionsData.data || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndProfile();
  }, []);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0;

    const requiredFields = [
      'full_name',
      'age',
      'height',
      'weight',
      'dominant_arm',
      'personal_best',
    ];

    const optionalFields = [
      'primary_event',
      'club',
      'coach',
      'date_of_birth',
      'gender',
      'country',
      'state',
      'season_best',
      'training_experience',
      'competition_level',
      'dominant_throw_style',
      'blood_group',
      'injury_history',
      'allergies',
      'fitness_status',
      'emergency_contact_name',
      'emergency_contact_relationship',
      'emergency_contact_phone',
      'emergency_contact_email',
    ];

    let filledRequired = 0;
    let filledOptional = 0;

    requiredFields.forEach(field => {
      if (profile[field as keyof AthleteProfile]) filledRequired++;
    });

    optionalFields.forEach(field => {
      if (profile[field as keyof AthleteProfile]) filledOptional++;
    });

    const requiredScore = (filledRequired / requiredFields.length) * 60;
    const optionalScore = (filledOptional / optionalFields.length) * 40;

    return Math.round(requiredScore + optionalScore);
  };

  // Get missing fields for checklist
  const getMissingFields = () => {
    if (!profile) return [];

    const allFields = [
      { key: 'full_name', label: 'Full Name', section: 'personal' },
      { key: 'age', label: 'Age', section: 'personal' },
      { key: 'height', label: 'Height', section: 'personal' },
      { key: 'weight', label: 'Weight', section: 'personal' },
      { key: 'dominant_arm', label: 'Dominant Arm', section: 'personal' },
      { key: 'personal_best', label: 'Personal Best', section: 'performance' },
      { key: 'primary_event', label: 'Primary Event', section: 'performance' },
      { key: 'season_best', label: 'Season Best', section: 'performance' },
      { key: 'training_experience', label: 'Training Experience', section: 'performance' },
      { key: 'competition_level', label: 'Competition Level', section: 'performance' },
      { key: 'dominant_throw_style', label: 'Dominant Throw Style', section: 'performance' },
      { key: 'blood_group', label: 'Blood Group', section: 'medical' },
      { key: 'injury_history', label: 'Injury History', section: 'medical' },
      { key: 'allergies', label: 'Allergies', section: 'medical' },
      { key: 'fitness_status', label: 'Fitness Status', section: 'medical' },
      { key: 'emergency_contact_name', label: 'Emergency Contact Name', section: 'emergency' },
      { key: 'emergency_contact_relationship', label: 'Emergency Contact Relationship', section: 'emergency' },
      { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', section: 'emergency' },
      { key: 'date_of_birth', label: 'Date of Birth', section: 'personal' },
      { key: 'gender', label: 'Gender', section: 'personal' },
      { key: 'country', label: 'Country', section: 'personal' },
      { key: 'state', label: 'State', section: 'personal' },
      { key: 'club', label: 'Club', section: 'personal' },
      { key: 'coach', label: 'Coach', section: 'personal' },
      { key: 'emergency_contact_email', label: 'Emergency Contact Email', section: 'emergency' },
    ];

    return allFields.filter(field => !profile[field.key as keyof AthleteProfile]);
  };

  // Calculate performance metrics
  const calculatePerformanceScore = () => {
    if (!profile || practices.length === 0) return 0;
    
    let score = 0;
    
    // Practice consistency (30 points)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentPractices = practices.filter(p => new Date(p.date) >= last30Days);
    score += Math.min(recentPractices.length * 3, 30);
    
    // Personal best progress (25 points)
    if (profile.personal_best > 0) {
      const avgThrow = practices.reduce((sum, p) => sum + p.average_throw, 0) / practices.length;
      const progressRatio = avgThrow / profile.personal_best;
      score += Math.min(progressRatio * 25, 25);
    }
    
    // Competition participation (25 points)
    const completedCompetitions = competitions.filter(c => c.status === 'completed').length;
    score += Math.min(completedCompetitions * 5, 25);
    
    // Profile completeness (20 points)
    const completionRate = calculateProfileCompletion();
    score += completionRate * 0.2;
    
    return Math.round(score);
  };

  const calculateBestMonth = () => {
    if (practices.length === 0) return null;
    
    const monthlyStats: { [key: string]: { total: number; count: number } } = {};
    
    practices.forEach(practice => {
      const month = new Date(practice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { total: 0, count: 0 };
      }
      monthlyStats[month].total += practice.best_throw;
      monthlyStats[month].count += 1;
    });
    
    let bestMonth = null;
    let bestAvg = 0;
    
    Object.entries(monthlyStats).forEach(([month, stats]) => {
      const avg = stats.total / stats.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestMonth = month;
      }
    });
    
    return bestMonth;
  };

  const calculateTotalThrowDistance = () => {
    return practices.reduce((sum, p) => sum + (p.total_throws * p.average_throw), 0);
  };

  const calculateTotalPracticeHours = () => {
    // Estimate 1 hour per practice session (can be adjusted based on actual data)
    return practices.length;
  };

  const calculateCompetitionWinRate = () => {
    const completedCompetitions = competitions.filter(c => c.status === 'completed');
    if (completedCompetitions.length === 0) return 0;
    
    const wonCompetitions = completedCompetitions.filter(c => {
      if (!c.result_distance || !profile?.personal_best) return false;
      return c.result_distance >= profile.personal_best * 0.9; // Consider winning if within 90% of PB
    });
    
    return Math.round((wonCompetitions.length / completedCompetitions.length) * 100);
  };

  const getMonthlyActivityData = () => {
    const activityData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      activityData[key] = 0;
    }
    
    practices.forEach(practice => {
      const month = new Date(practice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (activityData.hasOwnProperty(month)) {
        activityData[month]++;
      }
    });
    
    return Object.entries(activityData).map(([month, count]) => ({ month, count }));
  };

  const getPersonalRecordsTimeline = () => {
    const records: { date: string; distance: number }[] = [];
    let currentBest = 0;
    
    [...practices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(practice => {
      if (practice.best_throw > currentBest) {
        currentBest = practice.best_throw;
        records.push({
          date: practice.date,
          distance: practice.best_throw,
        });
      }
    });
    
    return records;
  };

  const performanceScore = calculatePerformanceScore();
  const profileCompletion = calculateProfileCompletion();
  const bestMonth = calculateBestMonth();
  const totalThrowDistance = calculateTotalThrowDistance();
  const totalPracticeHours = calculateTotalPracticeHours();
  const competitionWinRate = calculateCompetitionWinRate();
  const monthlyActivityData = getMonthlyActivityData();
  const personalRecordsTimeline = getPersonalRecordsTimeline();

  // Calculate Athlete Insights
  const calculateBMI = () => {
    if (!profile?.height || !profile?.weight) return null;
    const heightInMeters = profile.height / 100;
    const bmi = profile.weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
  };

  const getAthleteExperience = () => {
    if (!profile?.training_experience) return 'Not specified';
    const years = profile.training_experience;
    if (years < 1) return 'Beginner (< 1 year)';
    if (years < 3) return 'Intermediate (1-3 years)';
    if (years < 5) return 'Advanced (3-5 years)';
    return 'Elite (5+ years)';
  };

  const getPerformanceLevel = () => {
    if (!profile?.personal_best) return 'Not specified';
    const pb = profile.personal_best;
    if (pb < 40) return 'Beginner';
    if (pb < 50) return 'Intermediate';
    if (pb < 60) return 'Advanced';
    return 'Elite';
  };

  const bmi = calculateBMI();
  const athleteExperience = getAthleteExperience();
  const performanceLevel = getPerformanceLevel();

  const handleEditPersonalInfo = () => {
    setEditedProfile({
      full_name: profile?.full_name,
      date_of_birth: profile?.date_of_birth,
      gender: profile?.gender,
      height: profile?.height,
      weight: profile?.weight,
      dominant_arm: profile?.dominant_arm,
      country: profile?.country,
      state: profile?.state,
      club: profile?.club,
      coach: profile?.coach,
    });
    setIsEditingPersonalInfo(true);
  };

  const handleCancelEdit = () => {
    setIsEditingPersonalInfo(false);
    setEditedProfile({});
  };

  const handleSavePersonalInfo = async () => {
    if (!profile || !user) return;

    // Validate required fields
    if (!editedProfile.full_name || !editedProfile.height || !editedProfile.weight || !editedProfile.dominant_arm) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('athlete_profiles')
        .update({
          full_name: editedProfile.full_name,
          date_of_birth: editedProfile.date_of_birth,
          gender: editedProfile.gender,
          height: editedProfile.height,
          weight: editedProfile.weight,
          dominant_arm: editedProfile.dominant_arm,
          country: editedProfile.country,
          state: editedProfile.state,
          club: editedProfile.club,
          coach: editedProfile.coach,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Refetch profile
      const { data: profileData } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setIsEditingPersonalInfo(false);
      setEditedProfile({});
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleEditPerformanceInfo = () => {
    setEditedPerformance({
      primary_event: profile?.primary_event,
      personal_best: profile?.personal_best,
      season_best: profile?.season_best,
      training_experience: profile?.training_experience,
      competition_level: profile?.competition_level,
      dominant_throw_style: profile?.dominant_throw_style,
    });
    setIsEditingPerformanceInfo(true);
  };

  const handleCancelPerformanceEdit = () => {
    setIsEditingPerformanceInfo(false);
    setEditedPerformance({});
  };

  const handleSavePerformanceInfo = async () => {
    if (!profile || !user) return;

    // Validate numeric fields
    if (editedPerformance.personal_best !== undefined && (editedPerformance.personal_best < 0 || isNaN(editedPerformance.personal_best))) {
      alert('Personal Best must be a valid positive number');
      return;
    }
    if (editedPerformance.season_best !== undefined && (editedPerformance.season_best < 0 || isNaN(editedPerformance.season_best))) {
      alert('Season Best must be a valid positive number');
      return;
    }
    if (editedPerformance.training_experience !== undefined && (editedPerformance.training_experience < 0 || isNaN(editedPerformance.training_experience))) {
      alert('Training Experience must be a valid positive number');
      return;
    }

    try {
      const { error } = await supabase
        .from('athlete_profiles')
        .update({
          primary_event: editedPerformance.primary_event,
          personal_best: editedPerformance.personal_best,
          season_best: editedPerformance.season_best,
          training_experience: editedPerformance.training_experience,
          competition_level: editedPerformance.competition_level,
          dominant_throw_style: editedPerformance.dominant_throw_style,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Refetch profile
      const { data: profileData } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setIsEditingPerformanceInfo(false);
      setEditedPerformance({});
    } catch (error) {
      console.error('Error updating performance info:', error);
      alert('Failed to update performance info');
    }
  };

  const handleEditMedicalInfo = () => {
    setEditedMedical({
      blood_group: profile?.blood_group,
      injury_history: profile?.injury_history,
      allergies: profile?.allergies,
      fitness_status: profile?.fitness_status,
    });
    setIsEditingMedicalInfo(true);
  };

  const handleCancelMedicalEdit = () => {
    setIsEditingMedicalInfo(false);
    setEditedMedical({});
  };

  const handleSaveMedicalInfo = async () => {
    if (!profile || !user) return;

    try {
      const { error } = await supabase
        .from('athlete_profiles')
        .update({
          blood_group: editedMedical.blood_group,
          injury_history: editedMedical.injury_history,
          allergies: editedMedical.allergies,
          fitness_status: editedMedical.fitness_status,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Refetch profile
      const { data: profileData } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setIsEditingMedicalInfo(false);
      setEditedMedical({});
    } catch (error) {
      console.error('Error updating medical info:', error);
      alert('Failed to update medical info');
    }
  };

  const getFitnessStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'good':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'recovering':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'injured':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleEditEmergencyContact = () => {
    setEditedEmergencyContact({
      emergency_contact_name: profile?.emergency_contact_name,
      emergency_contact_relationship: profile?.emergency_contact_relationship,
      emergency_contact_phone: profile?.emergency_contact_phone,
      emergency_contact_email: profile?.emergency_contact_email,
    });
    setIsEditingEmergencyContact(true);
  };

  const handleCancelEmergencyContactEdit = () => {
    setIsEditingEmergencyContact(false);
    setEditedEmergencyContact({});
  };

  const handleSaveEmergencyContact = async () => {
    if (!profile || !user) return;

    // Validate required fields
    if (!editedEmergencyContact.emergency_contact_name || !editedEmergencyContact.emergency_contact_relationship || !editedEmergencyContact.emergency_contact_phone) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate phone number format (basic validation for 10-15 digits)
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    if (!phoneRegex.test(editedEmergencyContact.emergency_contact_phone)) {
      alert('Please enter a valid phone number (10-15 digits, may include +, spaces, or dashes)');
      return;
    }

    try {
      const { error } = await supabase
        .from('athlete_profiles')
        .update({
          emergency_contact_name: editedEmergencyContact.emergency_contact_name,
          emergency_contact_relationship: editedEmergencyContact.emergency_contact_relationship,
          emergency_contact_phone: editedEmergencyContact.emergency_contact_phone,
          emergency_contact_email: editedEmergencyContact.emergency_contact_email,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Refetch profile
      const { data: profileData } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setIsEditingEmergencyContact(false);
      setEditedEmergencyContact({});
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      alert('Failed to update emergency contact');
    }
  };

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
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 animate-pulse">
                <div className="h-32 w-32 bg-slate-800 rounded-2xl mb-6" />
                <div className="h-8 w-3/4 bg-slate-800 rounded-lg mb-4" />
                <div className="h-4 w-1/2 bg-slate-800 rounded" />
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
            <p className="text-slate-400">Please log in to view your profile.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <TopNavbar />
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 sm:p-12 text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserLucide className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">No profile created yet.</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Create your athlete profile to start tracking your training and performance.
                </p>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                >
                  <Plus className="w-5 h-5" />
                  Create Profile
                </Link>
              </div>
            </motion.div>
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between mb-8"
            >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Profile</h1>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-300"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Link>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 sm:p-8 border-b border-slate-800">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
              {/* Avatar with Upload Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative group"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-700 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-slate-700 shadow-xl">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Change photo"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </motion.div>

              {/* Name and Additional Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-center lg:text-left flex-1"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{profile.full_name}</h2>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-slate-400 text-sm mb-3">
                  {profile.primary_event && (
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span>{profile.primary_event}</span>
                    </div>
                  )}
                  {profile.club && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span>{profile.club}</span>
                    </div>
                  )}
                  {profile.coach && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-orange-400" />
                      <span>{profile.coach}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-400 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              </motion.div>

              {/* Compact Stat Cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto"
              >
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Activity className="w-3 h-3" />
                    <span>Practices</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{practices.length}</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Trophy className="w-3 h-3" />
                    <span>Competitions</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{competitions.length}</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Target className="w-3 h-3" />
                    <span>PB</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{profile.personal_best}m</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Medal className="w-3 h-3" />
                    <span>Goals</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">0</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 sm:p-8">
            {/* Athlete Insights Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-purple-500/30 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Athlete Insights</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* BMI */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span className="text-sm text-slate-400">BMI</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {bmi !== null ? bmi : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {bmi !== null && bmi < 18.5 ? 'Underweight' : bmi !== null && bmi < 25 ? 'Normal' : bmi !== null && bmi < 30 ? 'Overweight' : bmi !== null ? 'Obese' : ''}
                  </p>
                </div>

                {/* Athlete Experience */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">Experience</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {athleteExperience}
                  </p>
                </div>

                {/* Performance Level */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-slate-400">Level</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {performanceLevel}
                  </p>
                </div>

                {/* Personal Best Summary */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-400">Personal Best</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {profile.personal_best ? `${profile.personal_best}m` : 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">About</h3>
                <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Personal Information Card */}
            <motion.div
              id="personal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-slate-800/30 rounded-2xl p-6 sm:p-8 border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserLucide className="w-5 h-5 text-purple-400" />
                  Personal Information
                </h3>
                {!isEditingPersonalInfo && (
                  <button
                    onClick={handleEditPersonalInfo}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-300 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingPersonalInfo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={editedProfile.full_name || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={editedProfile.date_of_birth || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Gender</label>
                    <select
                      value={editedProfile.gender || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Height (cm) *</label>
                    <input
                      type="number"
                      value={editedProfile.height || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, height: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Weight (kg) *</label>
                    <input
                      type="number"
                      value={editedProfile.weight || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, weight: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Dominant Hand *</label>
                    <select
                      value={editedProfile.dominant_arm || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, dominant_arm: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="">Select hand</option>
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Country</label>
                    <input
                      type="text"
                      value={editedProfile.country || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">State</label>
                    <input
                      type="text"
                      value={editedProfile.state || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, state: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Club</label>
                    <input
                      type="text"
                      value={editedProfile.club || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, club: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Coach</label>
                    <input
                      type="text"
                      value={editedProfile.coach || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, coach: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3 pt-4">
                    <button
                      onClick={handleSavePersonalInfo}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <UserLucide className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-slate-400">Full Name</p>
                      <p className="text-white font-medium">{profile.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-slate-400">Date of Birth</p>
                      <p className="text-white font-medium">{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <UserLucide className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-slate-400">Gender</p>
                      <p className="text-white font-medium capitalize">{profile.gender || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Ruler className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-slate-400">Height</p>
                      <p className="text-white font-medium">{profile.height} cm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Weight className="w-5 h-5 text-pink-400" />
                    <div>
                      <p className="text-xs text-slate-400">Weight</p>
                      <p className="text-white font-medium">{profile.weight} kg</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <UserLucide className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-slate-400">Dominant Hand</p>
                      <p className="text-white font-medium capitalize">{profile.dominant_arm}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Globe className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-xs text-slate-400">Country</p>
                      <p className="text-white font-medium">{profile.country || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Map className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-xs text-slate-400">State</p>
                      <p className="text-white font-medium">{profile.state || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-xs text-slate-400">Club</p>
                      <p className="text-white font-medium">{profile.club || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl sm:col-span-2 lg:col-span-1">
                    <UserCheck className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-xs text-slate-400">Coach</p>
                      <p className="text-white font-medium">{profile.coach || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Performance Information Card */}
            <motion.div
              id="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="bg-slate-800/30 rounded-2xl p-6 sm:p-8 border border-slate-700/50 mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-400" />
                  Performance Information
                </h3>
                {!isEditingPerformanceInfo && (
                  <button
                    onClick={handleEditPerformanceInfo}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-300 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingPerformanceInfo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Primary Event</label>
                    <input
                      type="text"
                      value={editedPerformance.primary_event || ''}
                      onChange={(e) => setEditedPerformance({ ...editedPerformance, primary_event: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., Javelin Throw"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Personal Best (m)</label>
                    <input
                      type="number"
                      value={editedPerformance.personal_best || ''}
                      onChange={(e) => setEditedPerformance({ ...editedPerformance, personal_best: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., 65.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Season Best (m)</label>
                    <input
                      type="number"
                      value={editedPerformance.season_best || ''}
                      onChange={(e) => setEditedPerformance({ ...editedPerformance, season_best: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., 62.3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Training Experience (years)</label>
                    <input
                      type="number"
                      value={editedPerformance.training_experience || ''}
                      onChange={(e) => setEditedPerformance({ ...editedPerformance, training_experience: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Competition Level</label>
                    <select
                      value={editedPerformance.competition_level || ''}
                      onChange={(e) => setEditedPerformance({ ...editedPerformance, competition_level: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="">Select level</option>
                      <option value="district">District</option>
                      <option value="state">State</option>
                      <option value="national">National</option>
                      <option value="international">International</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Dominant Throw Style</label>
                    <input
                      type="text"
                      value={editedPerformance.dominant_throw_style || ''}
                      onChange={(e) => setEditedPerformance({ ...editedPerformance, dominant_throw_style: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., Overhead"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3 pt-4">
                    <button
                      onClick={handleSavePerformanceInfo}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelPerformanceEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Target className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-slate-400">Primary Event</p>
                      <p className="text-white font-medium">{profile.primary_event || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Trophy className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-slate-400">Personal Best</p>
                      <p className="text-white font-medium">{profile.personal_best}m</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-xs text-slate-400">Season Best</p>
                      <p className="text-white font-medium">{profile.season_best || 'Not set'}m</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Clock className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-slate-400">Training Experience</p>
                      <p className="text-white font-medium">{profile.training_experience || 'Not set'} years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Flame className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-xs text-slate-400">Competition Level</p>
                      <p className="text-white font-medium capitalize">{profile.competition_level || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-slate-400">Dominant Throw Style</p>
                      <p className="text-white font-medium">{profile.dominant_throw_style || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Medical Information Card */}
            <motion.div
              id="medical"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="bg-slate-800/30 rounded-2xl p-6 sm:p-8 border border-slate-700/50 mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-400" />
                  Medical Information
                </h3>
                {!isEditingMedicalInfo && (
                  <button
                    onClick={handleEditMedicalInfo}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-300 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingMedicalInfo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Blood Group</label>
                    <select
                      value={editedMedical.blood_group || ''}
                      onChange={(e) => setEditedMedical({ ...editedMedical, blood_group: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Fitness Status</label>
                    <select
                      value={editedMedical.fitness_status || ''}
                      onChange={(e) => setEditedMedical({ ...editedMedical, fitness_status: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="">Select status</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="recovering">Recovering</option>
                      <option value="injured">Injured</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-slate-400 mb-2">Injury History</label>
                    <textarea
                      value={editedMedical.injury_history || ''}
                      onChange={(e) => setEditedMedical({ ...editedMedical, injury_history: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      placeholder="Describe any past injuries..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-slate-400 mb-2">Allergies</label>
                    <textarea
                      value={editedMedical.allergies || ''}
                      onChange={(e) => setEditedMedical({ ...editedMedical, allergies: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      placeholder="List any allergies..."
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3 pt-4">
                    <button
                      onClick={handleSaveMedicalInfo}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelMedicalEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Activity className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-xs text-slate-400">Blood Group</p>
                      <p className="text-white font-medium">{profile.blood_group || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-slate-400">Fitness Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getFitnessStatusColor(profile.fitness_status)}`}>
                        {profile.fitness_status ? profile.fitness_status.charAt(0).toUpperCase() + profile.fitness_status.slice(1) : 'Not set'}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-xl">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-1">Injury History</p>
                        <p className="text-white font-medium text-sm">{profile.injury_history || 'No injuries reported'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-xl">
                      <AlertTriangle className="w-5 h-5 text-pink-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-1">Allergies</p>
                        <p className="text-white font-medium text-sm">{profile.allergies || 'No allergies reported'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Emergency Contact Card */}
            <motion.div
              id="emergency"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="bg-slate-800/30 rounded-2xl p-6 sm:p-8 border border-slate-700/50 mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-400" />
                  Emergency Contact
                </h3>
                {!isEditingEmergencyContact && (
                  <button
                    onClick={handleEditEmergencyContact}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-300 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingEmergencyContact ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Contact Name *</label>
                    <input
                      type="text"
                      value={editedEmergencyContact.emergency_contact_name || ''}
                      onChange={(e) => setEditedEmergencyContact({ ...editedEmergencyContact, emergency_contact_name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Relationship *</label>
                    <input
                      type="text"
                      value={editedEmergencyContact.emergency_contact_relationship || ''}
                      onChange={(e) => setEditedEmergencyContact({ ...editedEmergencyContact, emergency_contact_relationship: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., Father, Spouse"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={editedEmergencyContact.emergency_contact_phone || ''}
                      onChange={(e) => setEditedEmergencyContact({ ...editedEmergencyContact, emergency_contact_phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., +1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editedEmergencyContact.emergency_contact_email || ''}
                      onChange={(e) => setEditedEmergencyContact({ ...editedEmergencyContact, emergency_contact_email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="e.g., contact@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3 pt-4">
                    <button
                      onClick={handleSaveEmergencyContact}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEmergencyContactEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <UserLucide className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-slate-400">Contact Name</p>
                      <p className="text-white font-medium">{profile.emergency_contact_name || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-slate-400">Relationship</p>
                      <p className="text-white font-medium">{profile.emergency_contact_relationship || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Phone className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-slate-400">Phone Number</p>
                      <p className="text-white font-medium">{profile.emergency_contact_phone || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Mail className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-slate-400">Email Address</p>
                      <p className="text-white font-medium">{profile.emergency_contact_email || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Profile Completion Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-slate-800/30 rounded-2xl p-6 sm:p-8 border border-slate-700/50 mt-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Circular Progress */}
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: calculateProfileCompletion() / 100 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      style={{
                        strokeDasharray: "351.86",
                        strokeDashoffset: "351.86"
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
                    <span className="text-2xl font-bold text-white">{calculateProfileCompletion()}%</span>
                  </div>
                </div>

                {/* Progress Bar and Checklist */}
                <div className="flex-1 w-full">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Completion Progress</span>
                      <span className="text-white font-medium">{calculateProfileCompletion()}% Complete</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateProfileCompletion()}%` }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      />
                    </div>
                  </div>

                  {getMissingFields().length > 0 && (
                    <div>
                      <p className="text-sm text-slate-400 mb-3">Missing Information ({getMissingFields().length} items)</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getMissingFields().slice(0, 5).map((field, index) => (
                          <motion.button
                            key={field.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            onClick={() => {
                              const sectionMap: { [key: string]: string } = {
                                'personal': 'personal',
                                'performance': 'performance',
                                'medical': 'medical',
                                'emergency': 'emergency'
                              };
                              const section = sectionMap[field.section];
                              if (section) {
                                const element = document.getElementById(section);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }
                            }}
                            className="w-full flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all text-left"
                          >
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                            <span className="text-sm text-slate-300">{field.label}</span>
                          </motion.button>
                        ))}
                        {getMissingFields().length > 5 && (
                          <p className="text-xs text-slate-500 text-center pt-1">
                            +{getMissingFields().length - 5} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {getMissingFields().length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-2 text-green-400"
                    >
                      <Award className="w-5 h-5" />
                      <span className="text-sm font-medium">Profile is complete!</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Performance Score & Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Performance Score Card */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Performance Score</h3>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 352' }}
                    animate={{ strokeDasharray: `${(performanceScore / 100) * 352} 352` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{performanceScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Card */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 352' }}
                    animate={{ strokeDasharray: `${(profileCompletion / 100) * 352} 352` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{profileCompletion}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Best Month</span>
                <span className="text-white font-medium">{bestMonth || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Distance</span>
                <span className="text-white font-medium">{totalThrowDistance}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Practice Hours</span>
                <span className="text-white font-medium">{totalPracticeHours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Win Rate</span>
                <span className="text-white font-medium">{competitionWinRate}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Monthly Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Monthly Activity</h3>
          </div>
          <div className="grid grid-cols-12 gap-2">
            {monthlyActivityData.map((data, index) => (
              <motion.div
                key={data.month}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative"
              >
                <div
                  className={`h-16 rounded-lg transition-all duration-300 ${
                    data.count === 0
                      ? 'bg-slate-800/50'
                      : data.count <= 2
                      ? 'bg-blue-500/30'
                      : data.count <= 4
                      ? 'bg-blue-500/50'
                      : data.count <= 6
                      ? 'bg-blue-500/70'
                      : 'bg-blue-500'
                  }`}
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {data.month}: {data.count} sessions
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-800/50 rounded" />
              <div className="w-3 h-3 bg-blue-500/30 rounded" />
              <div className="w-3 h-3 bg-blue-500/50 rounded" />
              <div className="w-3 h-3 bg-blue-500/70 rounded" />
              <div className="w-3 h-3 bg-blue-500 rounded" />
            </div>
            <span>More</span>
          </div>
        </motion.div>

        {/* Personal Records Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Personal Records Timeline</h3>
          </div>
          {personalRecordsTimeline.length > 0 ? (
            <div className="space-y-4">
              {personalRecordsTimeline.map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                >
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{record.distance}m</p>
                    <p className="text-slate-400 text-sm">{new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">New Record</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No personal records yet. Keep practicing!</p>
          )}
        </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
