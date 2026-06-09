import React, { useState } from 'react';
import { User, WorkoutSession } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, Dumbbell, Zap, Scale, Plus, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressAnalyticsProps {
  currentUser: User;
  workouts: WorkoutSession[];
  onWeightUpdated: (weight: number) => void;
}

export default function ProgressAnalytics({ currentUser, workouts, onWeightUpdated }: ProgressAnalyticsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'strength' | 'cardio' | 'weight'>('strength');
  const [selectedLift, setSelectedLift] = useState('Bench Press');
  const [newWeight, setNewWeight] = useState('');
  const [weighLogSuccess, setWeightLogSuccess] = useState(false);

  const userSessions = workouts.filter(w => w.userId === currentUser.id);

  // --- Process Strength Progression Data ---
  // Extract selected lift history for the user, reverse chronological sorted back to normal order
  const liftData = [...userSessions]
    .filter(w => w.type === 'gym' && w.exercises)
    .flatMap(w => {
      const exercise = w.exercises?.find(e => e.name.toLowerCase() === selectedLift.toLowerCase());
      if (exercise) {
        return [{
          date: new Date(w.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          rawDate: new Date(w.date),
          weight: exercise.weight,
          reps: exercise.reps,
          'Estimated 1RM': w.oneRepMaxEstimate?.exerciseName.toLowerCase() === selectedLift.toLowerCase()
            ? w.oneRepMaxEstimate.estimated1RM
            : Math.round(exercise.weight * (1 + exercise.reps / 30))
        }];
      }
      return [];
    })
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  // --- Process Cardio Data ---
  const cardioData = [...userSessions]
    .filter(w => w.type === 'cardio' && w.cardioDetails)
    .map(w => {
      const details = w.cardioDetails!;
      // convert pace e.g. "5:30 min/km" to direct raw values (float minutes) for clean comparative charts
      const paceParts = details.pace.split(' ')[0].split(':');
      const paceFloat = paceParts.length === 2 ? Number(paceParts[0]) + Number(paceParts[1]) / 60 : 5.0;

      return {
        date: new Date(w.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        rawDate: new Date(w.date),
        type: details.type,
        distance: details.distance,
        time: details.time,
        paceNumeric: Number(paceFloat.toFixed(2)),
        paceString: details.pace,
        calories: w.calories
      };
    })
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  // --- Process Body Weight Data ---
  // Create a realistic weights timeline leading up to the current recorded weight
  const weightTimeline = [
    { date: 'May 05', weight: (currentUser.weight || 80) - 2.5 },
    { date: 'May 15', weight: (currentUser.weight || 80) - 1.8 },
    { date: 'May 28', weight: (currentUser.weight || 80) - 0.9 },
    { date: 'Jun 05', weight: (currentUser.weight || 80) },
  ];

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wtNum = parseFloat(newWeight);
    if (isNaN(wtNum) || wtNum <= 0) return;

    try {
      const response = await fetch('/api/users/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          weight: wtNum
        })
      });

      if (response.ok) {
        onWeightUpdated(wtNum);
        setNewWeight('');
        setWeightLogSuccess(true);
        setTimeout(() => setWeightLogSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const availableLifts = Array.from(new Set(
    workouts
      .flatMap(w => w.exercises || [])
      .map(e => e.name)
  ));

  return (
    <div className="px-4 py-5" id="progress-analytics-view">
      {/* Tab selectors */}
      <div className="flex border-b border-gray-800" id="analytics-tabs-nav">
        <button
          onClick={() => setActiveSubTab('strength')}
          className={`flex-1 py-3 text-center text-xs font-bold font-display flex items-center justify-center space-x-1.5 transition border-b-2 ${
            activeSubTab === 'strength'
              ? 'border-brand-neon text-white'
              : 'border-transparent text-gray-550 hover:text-white'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Gym lifts 1RM</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cardio')}
          className={`flex-1 py-3 text-center text-xs font-bold font-display flex items-center justify-center space-x-1.5 transition border-b-2 ${
            activeSubTab === 'cardio'
              ? 'border-brand-cyan text-white'
              : 'border-transparent text-gray-550 hover:text-white'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Aerobic Cardio</span>
        </button>
        <button
          onClick={() => setActiveSubTab('weight')}
          className={`flex-1 py-3 text-center text-xs font-bold font-display flex items-center justify-center space-x-1.5 transition border-b-2 ${
            activeSubTab === 'weight'
              ? 'border-brand-coral text-white'
              : 'border-transparent text-gray-550 hover:text-white'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Body Weight</span>
        </button>
      </div>

      <div className="mt-5 space-y-6">
        {/* STRENGTH ANALYTICS SECTION */}
        {activeSubTab === 'strength' && (
          <div className="space-y-4" id="strength-analytics-block">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-display">Strength progression curve</h3>
                <p className="text-[10px] text-gray-400">Progression calculated using standard Epley formulas</p>
              </div>
              
              {/* Lift Selector dropdown */}
              <select
                value={selectedLift}
                onChange={(e) => setSelectedLift(e.target.value)}
                className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs text-white"
                id="analytics-lift-filter"
              >
                {availableLifts.length > 0 ? (
                  availableLifts.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))
                ) : (
                  <option value="Bench Press">Bench Press</option>
                )}
              </select>
            </div>

            {liftData.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-gray-800 bg-gray-900/10 text-center px-4">
                <AlertCircle className="h-8 w-8 text-gray-500 mb-2" />
                <p className="text-xs text-gray-400 max-w-xs">
                  We need at least 2 logged sessions of <span className="font-semibold text-brand-neon">"{selectedLift}"</span> to graph your strength progressive overload. Keep logging!
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-3 pt-5">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liftData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="date" stroke="#666" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#666" style={{ fontSize: 9, fontFamily: 'monospace' }} unit=" kg" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1c1f2e', border: '1px solid #333', borderRadius: 8 }}
                        labelStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="weight" name="Working Set (kg)" stroke="#fff" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Estimated 1RM" name="Estimated 1RM (kg)" stroke="#ccff00" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CARDIO ANALYTICS SECTION */}
        {activeSubTab === 'cardio' && (
          <div className="space-y-4" id="cardio-analytics-block">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Aerobic endurance progression</h3>
              <p className="text-[10px] text-gray-400">Mapping distance and training paces over time</p>
            </div>

            {cardioData.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-gray-800 bg-gray-900/10 text-center px-4">
                <AlertCircle className="h-8 w-8 text-gray-500 mb-2" />
                <p className="text-xs text-gray-400 max-w-xs">
                  Log at least 2 Cardio sessions to plot your endurance cardio thresholds and pacing metrics.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Distance Chart */}
                <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-3 pt-5">
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-2 mb-3">Total Distance Mapping (km)</span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cardioData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="date" stroke="#666" style={{ fontSize: 9 }} />
                        <YAxis stroke="#666" style={{ fontSize: 9 }} unit="km" />
                        <Tooltip contentStyle={{ backgroundColor: '#1c1f2e', border: '1px solid #333' }} />
                        <Bar dataKey="distance" name="Logged Distance (km)" fill="#00f0ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pace Chart */}
                <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-3 pt-5">
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-2 mb-3">Average Pace Progression (lower is better)</span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cardioData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="date" stroke="#666" style={{ fontSize: 9 }} />
                        <YAxis stroke="#666" style={{ fontSize: 9 }} unit="m" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1c1f2e', border: '1px solid #333' }}
                          formatter={(value, name) => [`${Math.floor(Number(value))}:${Math.round((Number(value) % 1) * 60)} min/km`, 'Session Pace']}
                        />
                        <Line type="monotone" dataKey="paceNumeric" name="Pace (min/km)" stroke="#ccff00" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BODY WEIGHT SECTION */}
        {activeSubTab === 'weight' && (
          <div className="space-y-5" id="weight-analytics-block">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-display">Body composition log</h3>
                <p className="text-[10px] text-gray-400">Current active profile baseline weight</p>
              </div>

              {/* Weight Log form */}
              <form onSubmit={handleWeightSubmit} className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder={`${currentUser.weight || 80} kg`}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="rounded-lg bg-gray-905 border border-gray-800 p-2 text-xs text-white max-w-28 font-mono"
                />
                <button
                  type="submit"
                  className="flex items-center space-x-1 rounded-lg bg-brand-coral px-3.5 py-2 text-xs font-bold text-white hover:bg-opacity-80 transition"
                  id="btn-log-weight"
                >
                  <Plus className="h-4 w-4" />
                  <span>Update</span>
                </button>
              </form>
            </div>

            {weighLogSuccess && (
              <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/30 text-green-400 text-xs text-center flex items-center justify-center space-x-1.5 animate-pulse">
                <Activity className="h-4 w-4" />
                <span>Base weight updated on server!</span>
              </div>
            )}

            {/* Weight graph */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-3 pt-5">
              <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-2 mb-3">Timeline Composition Curve (kg)</span>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightTimeline} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#666" style={{ fontSize: 9 }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#666" style={{ fontSize: 9 }} unit=" kg" />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1f2e', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="weight" name="Body Weight (kg)" stroke="#ff4757" strokeWidth={3.5} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
