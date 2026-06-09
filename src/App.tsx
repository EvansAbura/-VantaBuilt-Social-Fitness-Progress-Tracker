import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeDashboard from './components/HomeDashboard';
import LogWorkout from './components/LogWorkout';
import CardioTracker from './components/CardioTracker';
import ProgressAnalytics from './components/ProgressAnalytics';
import FriendsFeed from './components/FriendsFeed';
import ChallengesTab from './components/ChallengesTab';
import ProfileTab from './components/ProfileTab';

import { User, WorkoutSession, Challenge, NotificationMsg } from './types';
import { LayoutDashboard, Award, Trophy, User as UserIcon, PlusCircle, Navigation, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchronize all application metrics with full-stack Express database
  const refreshAllState = async () => {
    setIsRefreshing(true);
    try {
      const [userRes, usersRes, workoutsRes, challengesRes, notificationsRes] = await Promise.all([
        fetch('/api/users/current'),
        fetch('/api/users'),
        fetch('/api/workouts'),
        fetch('/api/challenges'),
        fetch('/api/notifications')
      ]);

      if (userRes.ok && usersRes.ok && workoutsRes.ok && challengesRes.ok && notificationsRes.ok) {
        const userData = await userRes.json();
        const usersData = await usersRes.json();
        const workoutsData = await workoutsRes.json();
        const challengesData = await challengesRes.json();
        const notificationsData = await notificationsRes.json();

        setCurrentUser(userData.user);
        setUsers(usersData.users);
        setWorkouts(workoutsData.workouts);
        setChallenges(challengesData.challenges);
        setNotifications(notificationsData.notifications);
      }
    } catch (err) {
      console.error('Failed to update full stack active state:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAllState();
  }, []);

  const handleUserSwap = async (userId: string) => {
    try {
      const response = await fetch('/api/users/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      if (response.ok) {
        await refreshAllState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read', { method: 'POST' });
      if (response.ok) {
        await refreshAllState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWorkoutLiked = async (workoutId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/workouts/${workoutId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (response.ok) {
        await refreshAllState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentAdded = async (workoutId: string, text: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/workouts/${workoutId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, text })
      });
      if (response.ok) {
        await refreshAllState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChallengeJoined = async (challengeId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (response.ok) {
        await refreshAllState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Callback to trigger when a child logs a workout
  const handleWorkoutLoggedLocal = () => {
    refreshAllState();
  };

  const handleWeightUpdatedLocal = (weight: number) => {
    refreshAllState();
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-neon border-t-transparent" />
          <span className="text-xs text-brand-neon font-mono tracking-wider">CONNECTING TO VANTABUILT...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0B] pb-20 text-gray-100 max-w-full overflow-x-hidden md:pb-0" id="main-app-container">
      {/* App Header bar */}
      <Header
        currentUser={currentUser}
        onUserChanged={handleUserSwap}
        users={users}
        notifications={notifications}
        onNotificationsRead={handleNotificationsRead}
        triggerRefresh={refreshAllState}
        isRefreshing={isRefreshing}
      />

      {/* Main active Tab Views */}
      <main className="flex-1 max-w-lg mx-auto w-full md:max-w-2xl lg:max-w-4xl" id="app-view-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'dashboard' && (
              <HomeDashboard
                currentUser={currentUser}
                workouts={workouts}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'log-workout' && (
              <LogWorkout
                currentUser={currentUser}
                onWorkoutLogged={handleWorkoutLoggedLocal}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'cardio' && (
              <CardioTracker
                currentUser={currentUser}
                onWorkoutLogged={handleWorkoutLoggedLocal}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'analytics' && (
              <ProgressAnalytics
                currentUser={currentUser}
                workouts={workouts}
                onWeightUpdated={handleWeightUpdatedLocal}
              />
            )}
            {activeTab === 'feed' && (
              <FriendsFeed
                currentUser={currentUser}
                workouts={workouts}
                users={users}
                onWorkoutLiked={handleWorkoutLiked}
                onCommentAdded={handleCommentAdded}
                onUserChanged={handleUserSwap}
              />
            )}
            {activeTab === 'challenges' && (
              <ChallengesTab
                currentUser={currentUser}
                challenges={challenges}
                onChallengeJoined={handleChallengeJoined}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab
                currentUser={currentUser}
                workouts={workouts}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Nike/Strava Mobile-First ergonomic Bottom Navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-850 bg-[#111114]/95 px-2 py-2 backdrop-blur-lg md:sticky md:top-[65px] md:mb-6 md:border-b md:border-t-0 md:bg-gray-900/50 md:py-3" id="bottom-navigation">
        <div className="mx-auto flex max-w-md justify-between items-center px-2 md:max-w-4xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center p-1.5 transition rounded-xl ${
              activeTab === 'dashboard' ? 'text-brand-neon' : 'text-gray-400 hover:text-white'
            }`}
            title="Dashboard"
            id="nav-tab-dashboard"
          >
            <LayoutDashboard className="h-5.5 w-5.5" />
            <span className="text-[9px] font-medium mt-1 font-sans">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('log-workout')}
            className={`flex flex-col items-center justify-center p-1.5 transition rounded-xl ${
              activeTab === 'log-workout' ? 'text-brand-neon' : 'text-gray-400 hover:text-white'
            }`}
            title="Log Gym"
            id="nav-tab-log"
          >
            <PlusCircle className="h-5.5 w-5.5 text-brand-neon" />
            <span className="text-[9px] font-medium mt-1 font-sans">Gym Log</span>
          </button>

          <button
            onClick={() => setActiveTab('cardio')}
            className={`flex flex-col items-center justify-center p-1.5 transition rounded-xl ${
              activeTab === 'cardio' ? 'text-brand-cyan' : 'text-gray-400 hover:text-white'
            }`}
            title="Cardio"
            id="nav-tab-cardio"
          >
            <Navigation className="h-5.5 w-5.5 rotate-45 text-brand-cyan" />
            <span className="text-[9px] font-medium mt-1 font-sans">Cardio</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center p-1.5 transition rounded-xl ${
              activeTab === 'analytics' ? 'text-brand-neon' : 'text-gray-400 hover:text-white'
            }`}
            title="Analytics"
            id="nav-tab-analytics"
          >
            <TrendingUp className="h-5.5 w-5.5" />
            <span className="text-[9px] font-medium mt-1 font-sans">Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center justify-center p-1.5 transition rounded-xl ${
              activeTab === 'feed' ? 'text-brand-cyan' : 'text-gray-400 hover:text-white'
            }`}
            title="Social Circle Feed"
            id="nav-tab-feed"
          >
            <div className="relative">
              <Award className="h-5.5 w-5.5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-brand-cyan" />
            </div>
            <span className="text-[9px] font-medium mt-1 font-sans">Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex flex-col items-center justify-center p-1.5 transition rounded-xl ${
              activeTab === 'challenges' ? 'text-brand-neon' : 'text-gray-400 hover:text-white'
            }`}
            title="Challenges"
            id="nav-tab-challenges"
          >
            <Trophy className="h-5.5 w-5.5" />
            <span className="text-[9px] font-medium mt-1 font-sans">Quest</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center p-1.5 transition rounded-xl ${
              activeTab === 'profile' ? 'text-brand-cyan' : 'text-gray-400 hover:text-white'
            }`}
            title="Profile"
            id="nav-tab-profile"
          >
            <UserIcon className="h-5.5 w-5.5" />
            <span className="text-[9px] font-medium mt-1 font-sans">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
