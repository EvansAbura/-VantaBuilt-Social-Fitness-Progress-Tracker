import React from 'react';
import { User, Challenge } from '../types';
import { Trophy, Star, Medal, Users, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ChallengesTabProps {
  currentUser: User;
  challenges: Challenge[];
  onChallengeJoined: (challengeId: string) => void;
}

export default function ChallengesTab({ currentUser, challenges, onChallengeJoined }: ChallengesTabProps) {

  const handleJoin = async (id: string) => {
    onChallengeJoined(id);
  };

  return (
    <div className="space-y-6 px-4 py-5" id="challenges-tab-view">
      {/* Header segment */}
      <div className="flex items-center space-x-3 border-b border-gray-850 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-neon/15 text-brand-neon">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-base font-bold text-white">Gamified Habit Challenges</h2>
          <p className="text-[10px] text-gray-450 font-mono">COMPLETE GROUP CHALLENGES & EARN XP METALS</p>
        </div>
      </div>

      {/* Challenges cards */}
      <div className="space-y-5" id="challenges-list">
        {challenges.map((ch) => {
          const isParticipant = ch.participants.includes(currentUser.id);
          const totalParticipants = ch.participants.length;

          // Find current user's entry progress in leaderboard if joined
          const myLeaderboardEntry = ch.leaderboard.find(e => e.userId === currentUser.id);
          const currentProgressValue = myLeaderboardEntry ? myLeaderboardEntry.progressValue : 0;
          const isCompleted = myLeaderboardEntry ? myLeaderboardEntry.completed : false;

          // Progress percentage
          const percentDone = Math.min(Math.round((currentProgressValue / ch.target) * 100), 100);

          // Sort leaderboard high value first
          const sortedLeaderboard = [...ch.leaderboard].sort((a, b) => b.progressValue - a.progressValue);

          // Get unit tag based on challenge type
          const unitTag = ch.type === 'distance' ? 'km' : ch.type === 'frequency' ? 'workouts' : 'days streak';

          return (
            <div
              key={ch.id}
              className={`rounded-[24px] border p-5 shadow-lg space-y-4.5 transition duration-350 ${
                isCompleted
                  ? 'border-brand-neon/30 bg-gray-900/90 shadow-sm shadow-brand-neon/5'
                  : isParticipant
                    ? 'border-brand-cyan/25 bg-gray-900/45'
                    : 'border-gray-805 bg-gray-900/25'
              }`}
              id={`challenge-card-${ch.id}`}
            >
              {/* Challenge information banner */}
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white font-display uppercase tracking-tight flex items-center space-x-1.5">
                    {ch.type === 'streak' ? '🔥' : '🏆'}
                    <span>{ch.title}</span>
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{ch.description}</p>
                </div>

                {/* completion sticker */}
                {isCompleted ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-neon/15 text-brand-neon animate-bounce" title="Completed!">
                    <Medal className="h-6 w-6 stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="text-[10px] text-brand-neon font-mono font-black tracking-wide bg-brand-neon/10 border border-brand-neon/20 px-2.5 py-1 rounded-full">
                    +500 XP
                  </span>
                )}
              </div>

              {/* Progress Bar of logged user */}
              {isParticipant && (
                <div className="space-y-2 bg-gray-950/65 p-3 rounded-lg border border-gray-850">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-405">My Active Progress</span>
                    <span className="text-brand-cyan font-bold">
                      {currentProgressValue} / {ch.target} {unitTag} ({percentDone}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      style={{ width: `${percentDone}%` }}
                      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-brand-neon' : 'bg-brand-cyan'}`}
                    />
                  </div>

                  {isCompleted && (
                    <div className="flex items-center space-x-1 text-[10px] text-brand-neon font-bold font-mono">
                      <Sparkles className="h-3 w-3 fill-brand-neon" />
                      <span>Habit gold achieved! +500 XP rewarded!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard status */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block flex items-center space-x-1">
                  <Users className="h-3.5 w-3.5 mr-0.5 text-gray-500" />
                  <span>Circle Standings ({totalParticipants} members active)</span>
                </span>

                <div className="space-y-1.5">
                  {sortedLeaderboard.map((entry, idx) => {
                    const isMe = entry.userId === currentUser.id;
                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between rounded-lg p-2 text-xs transition ${
                          isMe ? 'bg-gray-800/40 border border-gray-750' : 'bg-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs font-bold font-mono text-gray-500 w-4">
                            #{idx + 1}
                          </span>
                          <span className="text-sm bg-gray-800 rounded-md p-1 leading-none">{entry.userAvatar}</span>
                          <span className={`font-semibold ${isMe ? 'text-brand-neon font-bold' : 'text-gray-300'}`}>
                            {entry.userName}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-right">
                          <span className="font-mono text-xs font-bold text-white">
                            {entry.progressValue} <span className="text-[10px] font-normal text-gray-450">{unitTag}</span>
                          </span>
                          {entry.completed && (
                            <span className="text-[10px] text-[#ccff00] font-bold font-mono py-0.5 px-2 bg-brand-neon/10 rounded border border-brand-neon/20">
                              🥇 Gold
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Join trigger button */}
              {!isParticipant && (
                <button
                  onClick={() => handleJoin(ch.id)}
                  className="flex w-full items-center justify-center space-x-1.5 border border-gray-700/60 rounded-xl bg-gray-800/80 hover:bg-white hover:text-black py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-all"
                  id={`btn-join-challenge-${ch.id}`}
                >
                  <span>Accept and Join Challenge</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
