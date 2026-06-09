import React, { useState } from 'react';
import { User, WorkoutSession } from '../types';
import { Award, Star, Compass, CheckCircle2, Shield, UserCheck, Flame, Scale, Ruler } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileTabProps {
  currentUser: User;
  workouts: WorkoutSession[];
}

export default function ProfileTab({ currentUser, workouts }: ProfileTabProps) {
  const userSessions = workouts.filter(w => w.userId === currentUser.id);
  const totalLogs = userSessions.length;

  const gymSessions = userSessions.filter(w => w.type === 'gym').length;
  const cumulativeDistance = userSessions
    .filter(w => w.type === 'cardio' && w.cardioDetails)
    .reduce((sum, w) => sum + (w.cardioDetails?.distance || 0), 0);

  // Dynamic Badge Qualifications logic
  const badgesList = [
    {
      id: 'b1',
      title: 'Consistency King',
      description: 'Log at least 3 gym strength workouts.',
      unlocked: gymSessions >= 3,
      icon: '👑',
      glowColor: 'border-brand-neon bg-brand-neon/5 text-brand-neon'
    },
    {
      id: 'b2',
      title: 'Endurance Titan',
      description: 'Achieve a cumulative cardio distance of over 10km.',
      unlocked: cumulativeDistance >= 10,
      icon: '🏃‍♂️',
      glowColor: 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan'
    },
    {
      id: 'b3',
      title: 'XP Titan Medalist',
      description: 'Obtain over 400 total Circle XP points.',
      unlocked: currentUser.xp >= 400,
      icon: '🥇',
      glowColor: 'border-brand-coral bg-brand-coral/5 text-brand-coral'
    },
    {
      id: 'b4',
      title: 'Pacing Veteran',
      description: 'Log at least one cardio session with a pace faster than 5:00 min/km.',
      unlocked: userSessions.some(w => {
        if (w.type !== 'cardio' || !w.cardioDetails?.pace) return false;
        const speed = parseFloat(w.cardioDetails.pace.split(':')[0]);
        return speed < 5 && speed > 0;
      }),
      icon: '⚡',
      glowColor: 'border-purple-500 bg-purple-500/5 text-purple-450'
    },
  ];

  return (
    <div className="space-y-6 px-4 py-5" id="profile-tab-view">
      {/* Profile summary card */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 rounded-2xl bg-gray-905 p-6 border border-gray-850 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-brand-neon via-brand-cyan to-brand-coral" />
        
        <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-800 text-5xl border border-gray-700 shadow-xl mt-2 animate-pulse">
          {currentUser.avatar}
        </span>

        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center justify-center space-x-1.5">
            <span>{currentUser.name.replace(' (You)', '')}</span>
            <span className="text-[10px] text-brand-neon font-mono bg-brand-neon/10 border border-brand-neon/20 py-0.5 px-2 rounded-full uppercase">XP Level {(Math.floor(currentUser.xp / 400) + 1)}</span>
          </h2>
          <span className="text-xs text-gray-500 font-mono block mt-0.5">{currentUser.email}</span>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 w-full bg-gray-950/45 p-3 rounded-xl border border-gray-850/60 max-w-sm mt-3 text-center">
          <div>
            <span className="block text-[10px] text-gray-500 font-mono uppercase tracking-wider">All Training</span>
            <span className="font-display text-base font-bold text-white mt-1 block">{totalLogs}</span>
          </div>
          <div>
            <span className="block text-[10px] text-gray-500 font-mono uppercase tracking-wider">Lifting Logs</span>
            <span className="font-display text-base font-bold text-brand-neon mt-1 block">{gymSessions}</span>
          </div>
          <div>
            <span className="block text-[10px] text-gray-500 font-mono uppercase tracking-wider">Total Run</span>
            <span className="font-display text-base font-bold text-brand-cyan mt-1 block">{Math.round(cumulativeDistance)} km</span>
          </div>
        </div>
      </div>

      {/* User metrics baseline parameters */}
      <div className="rounded-xl border border-gray-805 bg-gray-900/30 p-4 space-y-3">
        <h3 className="font-display text-sm font-bold text-white flex items-center space-x-1">
          <UserCheck className="h-4 w-4 text-brand-neon" />
          <span>Biometric Baselines</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
          <div className="rounded-lg bg-gray-950/70 p-3 border border-gray-850/60 flex items-center justify-between">
            <span className="text-gray-500 flex items-center space-x-1">
              <Scale className="h-3.5 w-3.5 text-brand-coral" />
              <span>Weight:</span>
            </span>
            <span className="text-white font-bold">{currentUser.weight || 82} kg</span>
          </div>

          <div className="rounded-lg bg-gray-950/70 p-3 border border-gray-850/60 flex items-center justify-between">
            <span className="text-gray-500 flex items-center space-x-1">
              <Ruler className="h-3.5 w-3.5 text-brand-cyan" />
              <span>Height:</span>
            </span>
            <span className="text-white font-bold">{currentUser.height || 180} cm</span>
          </div>
        </div>
      </div>

      {/* Circle achievements cards */}
      <div className="space-y-3" id="achievements-section">
        <h3 className="font-display text-sm font-bold text-white flex items-center space-x-1">
          <Award className="h-4 w-4 text-brand-cyan" />
          <span>Earned Merit Accolades</span>
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {badgesList.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl border p-3 flex items-center space-x-3.5 transition-all duration-300 ${
                badge.unlocked
                  ? `${badge.glowColor} border-opacity-65`
                  : 'bg-gray-900/10 border-gray-850 opacity-40'
              }`}
            >
              <span className={`text-3xl p-2.5 rounded-lg border flex items-center justify-center ${
                badge.unlocked ? 'border-transparent bg-white/5' : 'bg-gray-850/20 border-gray-800'
              }`}>
                {badge.icon}
              </span>
              <div>
                <h4 className="text-xs font-bold text-white font-display flex items-center space-x-1">
                  <span>{badge.title}</span>
                  {badge.unlocked && <span className="text-[9px] font-mono text-brand-neon bg-brand-neon/10 border border-brand-neon/20 px-1.5 py-0.2 rounded">Unlocked</span>}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
