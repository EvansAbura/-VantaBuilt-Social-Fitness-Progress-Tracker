import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Activity, Map, Navigation, CheckCircle2, RefreshCw, Gauge, Watch, Flame, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface CardioTrackerProps {
  currentUser: User;
  onWorkoutLogged: (workout: any) => void;
  onTabChange: (tab: string) => void;
}

const ACTIVITIES = [
  { name: 'Running', icon: '🏃', calPerMin: 11 },
  { name: 'Cycling', icon: '🚴', calPerMin: 9 },
  { name: 'Walking', icon: '🚶', calPerMin: 5 },
  { name: 'Swimming', icon: '🏊', calPerMin: 10 }
];

export default function CardioTracker({ currentUser, onWorkoutLogged, onTabChange }: CardioTrackerProps) {
  const [selectedActivity, setSelectedActivity] = useState('Running');
  const [distance, setDistance] = useState(5.0); // in km
  const [duration, setDuration] = useState(30);   // in minutes
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-calculated pace: "Min/Km"
  const calculatePace = (dist: number, mins: number) => {
    if (dist <= 0) return '0:00 min/km';
    const rawPace = mins / dist; // minutes per km
    const paceMins = Math.floor(rawPace);
    const paceSecs = Math.round((rawPace - paceMins) * 60);
    return `${paceMins}:${paceSecs < 10 ? '0' : ''}${paceSecs} min/km`;
  };

  const calculatedPace = calculatePace(distance, duration);

  // Calories estimation based on metabolic coefficients
  const calFactor = ACTIVITIES.find(a => a.name === selectedActivity)?.calPerMin || 10;
  const estimatedCalories = duration * calFactor;

  // Live Canvas route points tracer animation for map simulation
  useEffect(() => {
    if (!gpsEnabled || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let progress = 0;

    // Route coordinates around London/Regents Park centered
    const routePoints = [
      { x: 40, y: 150 },
      { x: 90, y: 80 },
      { x: 190, y: 50 },
      { x: 260, y: 100 },
      { x: 220, y: 180 },
      { x: 100, y: 220 },
      { x: 40, y: 150 }
    ];

    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw map grid gridlines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw route boundary path lines
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(routePoints[0].x, routePoints[0].y);
      for (let i = 1; i < routePoints.length; i++) {
        ctx.lineTo(routePoints[i].x, routePoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw active distance colored completed path
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(routePoints[0].x, routePoints[0].y);

      // Interpolate progress along segment list
      const totalSegments = routePoints.length - 1;
      const currentSegmentDouble = progress * totalSegments;
      const currentSegmentIdx = Math.floor(currentSegmentDouble);
      const segmentProgress = currentSegmentDouble - currentSegmentIdx;

      for (let i = 0; i <= currentSegmentIdx; i++) {
        if (i === currentSegmentIdx) {
          const nextIdx = i + 1;
          const currentPoint = routePoints[i];
          const nextPoint = routePoints[nextIdx];
          const interX = currentPoint.x + (nextPoint.x - currentPoint.x) * segmentProgress;
          const interY = currentPoint.y + (nextPoint.y - currentPoint.y) * segmentProgress;
          ctx.lineTo(interX, interY);
          
          // Draw pulsing locator head point
          ctx.beginPath();
          ctx.arc(interX, interY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#ec4899';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw sonar waves
          ctx.beginPath();
          ctx.arc(interX, interY, 12 + Math.sin(Date.now() / 150) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.lineTo(routePoints[i].x, routePoints[i].y);
        }
      }
      ctx.stroke();

      // Start/End Pin Indicators
      ctx.beginPath();
      ctx.arc(routePoints[0].x, routePoints[0].y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#D7FF51';
      ctx.fill();

      // progress loop
      progress = (progress + 0.001) % 1;
      animationId = requestAnimationFrame(drawMap);
    };

    drawMap();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gpsEnabled, selectedActivity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const workoutPayload = {
      userId: currentUser.id,
      type: 'cardio',
      duration,
      notes,
      calories: estimatedCalories,
      date: new Date().toISOString(),
      cardioDetails: {
        type: selectedActivity,
        distance: Number(distance),
        time: Number(duration),
        pace: calculatedPace,
        route: gpsEnabled ? [
          { lat: 51.524, lng: -0.141 },
          { lat: 51.527, lng: -0.138 },
          { lat: 51.529, lng: -0.145 }
        ] : undefined
      }
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
          onWorkoutLogged(workoutPayload); // instantly push state onto client workouts history
          onTabChange('dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-5" id="cardio-tracker-view">
      {successMsg ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl bg-gray-900 border border-brand-cyan p-8 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Cardio Logged!</h2>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
            Your cardiovascular run has been logged on the server. You earned <span className="font-semibold text-brand-cyan">100 XP points</span>! Way to spark endurance.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header section */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3" id="cardio-tracker-title">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cyan/15 text-brand-cyan">
                <Navigation className="h-5 w-5 rotate-45" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">Track Cardio Session</h2>
                <p className="text-[10px] text-gray-400 font-mono">GPS-SIMULATION & ENDURANCE paces</p>
              </div>
            </div>
          </div>

          {/* Activity Grid Selector */}
          <div className="grid grid-cols-4 gap-2" id="activity-selectors">
            {ACTIVITIES.map((act) => (
              <button
                key={act.name}
                type="button"
                onClick={() => setSelectedActivity(act.name)}
                className={`flex flex-col items-center justify-center rounded-xl py-3 text-center transition border ${
                  selectedActivity === act.name
                    ? 'bg-brand-cyan text-gray-950 font-extrabold border-brand-cyan'
                    : 'bg-gray-900/60 text-gray-300 border-gray-800 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl mb-1">{act.icon}</span>
                <span className="text-[10px] uppercase font-bold tracking-tight">{act.name}</span>
              </button>
            ))}
          </div>

          {/* Cardio detail Sliders */}
          <div className="space-y-5 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            {/* Distance Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span className="font-semibold flex items-center space-x-1">
                  <Map className="h-3.5 w-3.5 text-brand-neon" />
                  <span>Session Distance</span>
                </span>
                <span className="font-mono font-bold text-brand-neon">{distance} km</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
                className="w-full accent-brand-neon h-1.5 rounded-lg bg-gray-850 appearance-none cursor-pointer"
              />
            </div>

            {/* Time / Duration Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span className="font-semibold flex items-center space-x-1">
                  <Watch className="h-3.5 w-3.5 text-brand-cyan" />
                  <span>Session Duration</span>
                </span>
                <span className="font-mono font-bold text-brand-cyan">{duration} min</span>
              </div>
              <input
                type="range"
                min="1"
                max="180"
                step="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-brand-cyan h-1.5 rounded-lg bg-gray-850 appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Metrics Display Panel */}
          <div className="grid grid-cols-2 gap-3" id="cardio-metrics-display">
            <div className="rounded-xl bg-gray-905 p-3.5 border border-gray-850 text-center relative overflow-hidden">
              <Gauge className="absolute -right-1 -bottom-1 h-12 w-12 text-gray-800/10" />
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Calculated Pace</span>
              <span className="font-display text-base font-extrabold text-brand-neon block mt-1">{calculatedPace}</span>
            </div>
            <div className="rounded-xl bg-gray-905 p-3.5 border border-gray-850 text-center relative overflow-hidden">
              <Flame className="absolute -right-1 -bottom-1 h-12 w-12 text-gray-800/10" />
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Estimated Calorie Burn</span>
              <span className="font-display text-base font-extrabold text-brand-coral block mt-1">{estimatedCalories} kcal</span>
            </div>
          </div>

          {/* Simulated GPS Option */}
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-900/30 p-3 rounded-lg border border-gray-850">
              <label className="text-xs font-semibold text-gray-305 flex items-center space-x-1.5">
                <Navigation className="h-4 w-4 text-brand-cyan" />
                <span>Simulate GPS Route Tracking</span>
              </label>
              <input
                type="checkbox"
                checked={gpsEnabled}
                onChange={(e) => setGpsEnabled(e.target.checked)}
                className="sr-only peer"
                id="gps-toggle-checkbox"
              />
              <label htmlFor="gps-toggle-checkbox" className="relative w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-cyan flex cursor-pointer"></label>
            </div>

            {gpsEnabled && (
              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-slate-950 flex justify-center items-center">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={240}
                  className="rounded-xl bg-gray-950 max-w-full"
                />
                <div className="absolute left-3 top-3 px-2 py-1 rounded bg-gray-900/85 backdrop-blur-sm border border-gray-800 text-[9px] font-mono font-bold text-brand-cyan flex items-center space-x-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                  <span>GPS FEED SIMULATING LIVE</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300">Session Narrative</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., fast wind, sprint triggers at the finish line, felt hydrated..."
              rows={3}
              className="w-full rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-white placeholder-gray-500 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
            />
          </div>

          {/* Submit element matching the design's heavy button style */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-white hover:bg-brand-cyan text-black py-4 font-display text-xs font-black uppercase tracking-[0.2em] transition duration-300 shadow-xl disabled:opacity-55"
            id="log-cardio-submit"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <>
                <span>Save Cardio Activity</span>
                <CheckCircle2 className="h-4.5 w-4.5 stroke-[3]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
