import React, { useState } from 'react';
import { User, WorkoutSession, Exercise } from '../types';
import { Plus, Trash, Dumbbell, Clock, FileText, CheckCircle2, ChevronRight, Calculator } from 'lucide-react';
import { motion } from 'motion/react';

interface LogWorkoutProps {
  currentUser: User;
  onWorkoutLogged: (workout: any) => void;
  onTabChange: (tab: string) => void;
}

const COMMON_EXERCISES = [
  'Bench Press',
  'Barbell Back Squats',
  'Deadlifts',
  'Overhead Press',
  'Barbell Rows',
  'Dumbbell Bicep Curls',
  'Tricep Pushdowns',
  'Leg Press'
];

export default function LogWorkout({ currentUser, onWorkoutLogged, onTabChange }: LogWorkoutProps) {
  const [exerciseName, setExerciseName] = useState('Bench Press');
  const [sets, setSets] = useState<Exercise[]>([
    { name: 'Bench Press', sets: 1, reps: 10, weight: 60 },
    { name: 'Bench Press', sets: 2, reps: 8, weight: 70 },
    { name: 'Bench Press', sets: 3, reps: 6, weight: 80 }
  ]);
  const [duration, setDuration] = useState(45);
  const [restTime, setRestTime] = useState(90); // in seconds
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Live 1RM calculator helper for standard lift
  const calculate1RM = (weight: number, reps: number) => {
    if (reps <= 0) return 0;
    // Epley formula: 1RM = w * (1 + r / 30)
    return Math.round(weight * (1 + reps / 30));
  };

  const addSetRow = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        name: exerciseName,
        sets: sets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 50
      }
    ]);
  };

  const removeSetRow = (index: number) => {
    if (sets.length <= 1) return;
    const newSets = sets.filter((_, i) => i !== index).map((s, idx) => ({ ...s, sets: idx + 1 }));
    setSets(newSets);
  };

  const updateSetField = (index: number, field: 'reps' | 'weight', value: number) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare exercise name to align across all items
    const formattedExercises = sets.map((s, idx) => ({
      name: exerciseName,
      sets: idx + 1,
      reps: Number(s.reps),
      weight: Number(s.weight)
    }));

    const workoutPayload = {
      userId: currentUser.id,
      type: 'gym',
      duration,
      notes,
      exercises: formattedExercises,
      calories: duration * 7, // ~7 calories per min of lifting
      date: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutPayload)
      });

      if (response.ok) {
        setSuccessMsg(true);
        setTimeout(() => {
          setSuccessMsg(false);
          onWorkoutLogged(workoutPayload); // update local workouts state instantly
          onTabChange('dashboard'); // route back
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimate highest set's 1RM for visual feedback
  const highestWeightSet = [...sets].sort((a, b) => b.weight - a.weight)[0] || sets[0];
  const est1RM = calculate1RM(highestWeightSet.weight, highestWeightSet.reps);

  return (
    <div className="px-4 py-5" id="log-workout-view">
      {successMsg ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-[32px] bg-gray-900 border border-brand-neon p-8 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-neon/10 text-brand-neon mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Workout Saved!</h2>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
            Congratulations on completing your session! You unlocked <span className="font-semibold text-brand-neon">100 XP points</span> and updated friend feeds.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header section with icon */}
          <div className="flex items-center space-x-3 border-b border-gray-800 pb-3" id="log-workout-title">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-neon/15 text-brand-neon">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Log Strength Workout</h2>
              <p className="text-[10px] text-gray-400 font-mono">TRACK REPS, SETS & progressive overload</p>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300">Choose Exercise</label>
            <div className="flex flex-wrap gap-1.5" id="quick-exercise-select">
              {COMMON_EXERCISES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setExerciseName(ex);
                    // Match sets name too
                    setSets(sets.map(s => ({ ...s, name: ex })));
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs transition border ${
                    exerciseName === ex
                      ? 'bg-brand-neon text-gray-950 font-bold border-brand-neon'
                      : 'bg-gray-900/60 text-gray-350 border-gray-800 hover:bg-gray-850'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Core Exercise Configuration */}
          <div className="rounded-[24px] border border-gray-800 bg-gray-900/40 p-4.5 space-y-4" id="log-sets-panel">
            <div className="flex justify-between items-center border-b border-gray-800/80 pb-2.5">
              <span className="font-display text-sm font-bold text-brand-neon flex items-center space-x-1.5">
                <Dumbbell className="h-4 w-4" />
                <span className="uppercase tracking-tight font-black">{exerciseName}</span>
              </span>
              <button
                type="button"
                onClick={addSetRow}
                className="flex items-center space-x-1 rounded-xl bg-gray-800 hover:bg-gray-705 px-3 py-1.5 text-xs text-white border border-gray-700 transition"
                id="btn-add-set"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Set</span>
              </button>
            </div>

            {/* Set lines */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-center text-[10px] font-bold text-gray-500 font-mono">
                <div className="col-span-2">SET</div>
                <div className="col-span-4">WEIGHT (KG)</div>
                <div className="col-span-4">REPS</div>
                <div className="col-span-2">REMOVE</div>
              </div>

              {sets.map((set, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 text-center text-xs font-mono font-bold text-gray-300">
                    {idx + 1}
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      required
                      min="1"
                      value={set.weight}
                      onChange={(e) => updateSetField(idx, 'weight', Number(e.target.value))}
                      className="w-full text-center rounded-lg bg-gray-950/80 border border-gray-850 p-2 text-xs text-white focus:border-brand-neon focus:ring-1 focus:ring-brand-neon font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      required
                      min="1"
                      value={set.reps}
                      onChange={(e) => updateSetField(idx, 'reps', Number(e.target.value))}
                      className="w-full text-center rounded-lg bg-gray-950/80 border border-gray-850 p-2 text-xs text-white focus:border-brand-neon focus:ring-1 focus:ring-brand-neon font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeSetRow(idx)}
                      disabled={sets.length <= 1}
                      className="p-2 text-gray-400 hover:text-brand-coral hover:bg-brand-coral/10 rounded-lg transition disabled:opacity-30"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live calculation card */}
            <div className="flex items-center justify-between rounded-xl bg-gray-950/60 p-3.5 border border-gray-850" id="one-rep-max-calculator">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-mono uppercase tracking-wider">Estimated 1-Rep Max</span>
                  <span className="text-xs text-gray-300">Based on {highestWeightSet.weight}kg × {highestWeightSet.reps} reps estimate</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-display text-lg font-extrabold text-brand-cyan">{est1RM} <span className="text-xs font-normal">kg</span></span>
              </div>
            </div>
          </div>

          {/* Setup details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300 flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-brand-neon" />
                <span>Total Duration (min)</span>
              </label>
              <input
                type="number"
                required
                min="5"
                max="180"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-900 border border-gray-800 p-2.5 text-xs text-white focus:border-brand-neon focus:ring-1 focus:ring-brand-neon font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300 flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-brand-cyan" />
                <span>Rest Period (sec)</span>
              </label>
              <select
                value={restTime}
                onChange={(e) => setRestTime(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-900 border border-gray-800 p-2.5 text-xs text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan font-mono"
              >
                <option value={30}>30s (Hypertrophy)</option>
                <option value={60}>60s (Endurance)</option>
                <option value={90}>90s (Mixed)</option>
                <option value={120}>120s (Strength)</option>
                <option value={180}>180s (Power)</option>
              </select>
            </div>
          </div>

          {/* Coach notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 flex items-center space-x-1">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              <span>Personal Gym Notes</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., form felt solid, completed last set to failure..."
              rows={3}
              className="w-full rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-white placeholder-gray-550 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon"
            />
          </div>

          {/* Submit element matching the design's heavy button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-white hover:bg-brand-neon text-black py-4 font-display text-xs font-black uppercase tracking-[0.2em] transition duration-300 shadow-xl disabled:opacity-55"
            id="log-workout-submit"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <>
                <span>Save Strength Session</span>
                <ChevronRight className="h-4.5 w-4.5 stroke-[3]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
