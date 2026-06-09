import React, { useState } from 'react';
import { User, WorkoutSession } from '../types';
import { Heart, MessageSquare, Send, Calendar, Clock, Dumbbell, Navigation, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FriendsFeedProps {
  currentUser: User;
  workouts: WorkoutSession[];
  users: User[];
  onWorkoutLiked: (workoutId: string) => void;
  onCommentAdded: (workoutId: string, commentText: string) => void;
  onUserChanged: (userId: string) => void;
}

export default function FriendsFeed({
  currentUser,
  workouts,
  users,
  onWorkoutLiked,
  onCommentAdded,
  onUserChanged
}: FriendsFeedProps) {
  const [activeCommentWId, setActiveCommentWId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinInviteName, setJoinInviteName] = useState('');
  const [joinInviteEmail, setJoinInviteEmail] = useState('');
  const [joinInviteSuccess, setJoinInviteSuccess] = useState(false);

  const handleLike = async (workoutId: string) => {
    onWorkoutLiked(workoutId);
  };

  const handleCommentSubmit = async (e: React.FormEvent, workoutId: string) => {
    e.preventDefault();
    const commentText = commentInputs[workoutId]?.trim();
    if (!commentText) return;

    onCommentAdded(workoutId, commentText);
    
    // Clear input
    setCommentInputs({
      ...commentInputs,
      [workoutId]: ''
    });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteName || !joinInviteEmail) return;

    // Pick random target emojis for fun profile setups
    const avatars = ['🦁', '🦊', '🐨', '🐸', '🐼', '🐯', '🦄', '🐝', '🏀', '🏋️'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    try {
      const response = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: joinInviteName,
          email: joinInviteEmail,
          avatar: randomAvatar
        })
      });

      if (response.ok) {
        setJoinInviteSuccess(true);
        setTimeout(() => {
          setJoinInviteSuccess(false);
          setShowInviteModal(false);
          setJoinInviteName('');
          setJoinInviteEmail('');
          window.location.reload(); // Quick full stack reload to sync new user selectors
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 px-4 py-5" id="friends-feed-view">
      {/* Group Feed Actions panel */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div>
          <h2 className="font-display text-base font-bold text-white">Social Circle Feed</h2>
          <p className="text-[10px] text-gray-400 font-mono">SUPPORT FRIENDS & GIVE GENUINE KUDOS</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-1.5 rounded-lg bg-linear-to-r from-brand-neon to-brand-cyan px-2.5 py-1.5 text-xs font-bold text-gray-950 hover:opacity-90 transition"
          id="btn-invite-friend"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Invite Friend</span>
        </button>
      </div>

      {/* Profile quick-swap note */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-gray-400">
          💡 <span className="font-semibold text-brand-neon">Tester Tip</span>: Swap personas in the top-right profile slot to like/comment from different perspectives!
        </span>
        <div className="flex gap-1">
          {users.slice(0, 4).map(u => (
            <button
              key={u.id}
              onClick={() => onUserChanged(u.id)}
              className={`text-xs p-1 px-2 rounded-lg transition ${
                u.id === currentUser.id ? 'bg-brand-neon text-gray-950 font-bold' : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {u.avatar} {u.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time collaborative Activity list */}
      <div className="space-y-4" id="circle-activities-list">
        {workouts.map((work) => {
          const isLikedByMe = work.likes.includes(currentUser.id);
          const timeLabel = new Date(work.date).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={work.id}
              className="rounded-[24px] border border-gray-800 bg-gray-900/40 p-5 shadow-md space-y-3.5 relative"
              id={`activity-card-${work.id}`}
            >
              {/* Header profile of log */}
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 text-xl border border-gray-750">
                    {work.userAvatar}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center space-x-1">
                      <span>{work.userName}</span>
                      {work.userId === currentUser.id && (
                        <span className="text-[10px] text-brand-neon bg-brand-neon/10 px-1.5 py-0.2 rounded font-mono">You</span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-500 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{timeLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Workout category label */}
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase ${
                  work.type === 'gym'
                    ? 'bg-brand-neon/10 text-brand-neon border border-brand-neon/20'
                    : 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
                }`}>
                  {work.type === 'gym' ? '🏋️ Gym Lift' : `🏃 Cardio`}
                </span>
              </div>

              {/* Workout details summary */}
              <div className="rounded-xl bg-gray-950/70 p-3 border border-gray-850/65 space-y-2">
                {work.notes && (
                  <p className="text-xs italic text-gray-300 leading-relaxed mb-2">"{work.notes}"</p>
                )}

                {work.type === 'gym' && work.exercises && (
                  <div className="space-y-1">
                    {/* List sets */}
                    {work.exercises.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs border-b border-gray-800/45 py-1 last:border-0">
                        <span className="font-semibold text-gray-200">{item.name}</span>
                        <span className="font-mono text-[11px] text-brand-neon">
                          Set {item.sets}: {item.reps} reps × {item.weight} kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {work.type === 'cardio' && work.cardioDetails && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-brand-cyan flex items-center space-x-1">
                      <Navigation className="h-3.5 w-3.5 rotate-45" />
                      <span>{work.cardioDetails.type}</span>
                    </span>
                    <div className="flex space-x-3 text-right font-mono text-[11px]">
                      <div>
                        <span className="text-gray-550 mr-0.5">Time:</span>
                        <span className="text-gray-200">{work.cardioDetails.time}m</span>
                      </div>
                      <div>
                        <span className="text-gray-550 mr-0.5">Dist:</span>
                        <span className="text-brand-coral">{work.cardioDetails.distance}km</span>
                      </div>
                      <div>
                        <span className="text-gray-550 mr-0.5">Pace:</span>
                        <span className="text-brand-cyan">{work.cardioDetails.pace.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                )}

                {work.oneRepMaxEstimate && (
                  <div className="mt-1 pt-1 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-500">Auto Max Lift Projection:</span>
                    <span className="text-brand-cyan font-bold">{work.oneRepMaxEstimate.exerciseName} 1RM ~{work.oneRepMaxEstimate.estimated1RM}kg</span>
                  </div>
                )}
              </div>

              {/* Likes and stats reactions */}
              <div className="flex items-center space-x-4 text-xs font-semibold text-gray-400 border-t border-gray-850 pt-2.5">
                <button
                  onClick={() => handleLike(work.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border transition ${
                    isLikedByMe
                      ? 'bg-brand-coral/10 border-brand-coral/30 text-brand-coral'
                      : 'border-gray-800 hover:text-white hover:bg-gray-800/50'
                  }`}
                  id={`btn-like-${work.id}`}
                >
                  <Heart className={`h-4 w-4 ${isLikedByMe ? 'fill-brand-coral' : ''}`} />
                  <span>{work.likes.length} Kudos</span>
                </button>

                <button
                  onClick={() => setActiveCommentWId(activeCommentWId === work.id ? null : work.id)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-gray-800 hover:text-white hover:bg-gray-800/50 transition"
                  id={`btn-open-comment-${work.id}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{work.comments.length} Comments</span>
                </button>

                {/* Static duration burn details */}
                <span className="text-[10px] text-gray-500 ml-auto font-mono">
                  🔥 {work.duration} min active • {work.calories} kcal
                </span>
              </div>

              {/* Comments expander section */}
              <AnimatePresence>
                {(activeCommentWId === work.id || work.comments.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-850 pt-3 space-y-2.5 overflow-hidden"
                  >
                    {/* List comments of this item */}
                    {work.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-850/40 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-gray-200">{comment.userName}</span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {new Date(comment.date).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{comment.text}</p>
                      </div>
                    ))}

                    {/* New comment input form */}
                    <form onSubmit={(e) => handleCommentSubmit(e, work.id)} className="flex items-center gap-2">
                      <span className="text-sm bg-gray-800 rounded-lg p-1.5">{currentUser.avatar}</span>
                      <input
                        type="text"
                        required
                        placeholder="Compliment their session form..."
                        value={commentInputs[work.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [work.id]: e.target.value })}
                        className="flex-1 rounded-lg bg-gray-950 border border-gray-805 p-2 text-xs text-white placeholder-gray-550 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-brand-neon text-gray-950 rounded-lg hover:bg-opacity-80 transition"
                        title="Post Comment"
                        id={`btn-post-comment-${work.id}`}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Invite Friend Modal overlay */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/75" onClick={() => setShowInviteModal(false)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-[32px] bg-gray-900 border border-gray-800 p-6 shadow-2xl space-y-5"
            >
              {joinInviteSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <span className="text-4xl block">✨</span>
                  <h3 className="font-display text-sm font-bold text-white">Friend Joined Group!</h3>
                  <p className="text-xs text-gray-400">Reindexing Vantabuilt participants, standby...</p>
                </div>
              ) : (
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">Invite gym buddy</h3>
                    <p className="text-[10px] text-gray-405">Generate a seed profile instantly to test group features</p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-gray-450">Buddy Name</label>
                      <input
                        type="text"
                        required
                        value={joinInviteName}
                        onChange={(e) => setJoinInviteName(e.target.value)}
                        placeholder="E.g., Jessica"
                        className="w-full rounded-lg bg-gray-950 border border-gray-800 p-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-gray-450">Buddy Email</label>
                      <input
                        type="email"
                        required
                        value={joinInviteEmail}
                        onChange={(e) => setJoinInviteEmail(e.target.value)}
                        placeholder="E.g., jessica@vantabuilt.app"
                        className="w-full rounded-lg bg-gray-950 border border-gray-800 p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="rounded-xl bg-transparent px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-white hover:bg-brand-neon text-black font-black uppercase tracking-[0.15em] text-[10px] px-4.5 py-2.5 transition duration-300"
                    >
                      Add to Group
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
