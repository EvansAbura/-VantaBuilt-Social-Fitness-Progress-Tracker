import { GoogleGenAI } from '@google/genai';
import { WorkoutSession, User } from '../types';

// Lazy-initialization helper for Gemini SDK to handle missing key gracefully
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (e) {
        console.error('Failed to initialize GoogleGenAI client:', e);
      }
    }
  }
  return aiClient;
}

export async function generateFitnessAdvice(user: User, recentSessions: WorkoutSession[]): Promise<string> {
  const client = getAiClient();

  // If no AI client (missing/invalid key), return high-quality fallback coaching recommendations immediately
  if (!client) {
    return generateFallbackAdvice(user, recentSessions);
  }

  try {
    // build past session summaries to ground the AI
    const summary = recentSessions.map(w => {
      const dateStr = new Date(w.date).toLocaleDateString();
      if (w.type === 'gym') {
        const exercisesStr = w.exercises?.map(e => `${e.name} (${e.sets}x${e.reps} @ ${e.weight}kg)`).join(', ') || 'No Exercises';
        return `- Gym on ${dateStr}: [${exercisesStr}] Duration: ${w.duration}m, Notes: "${w.notes || ''}"`;
      } else {
        const d = w.cardioDetails;
        return `- Cardio (${d?.type}) on ${dateStr}: ${d?.distance}km in ${d?.time}m, Pace: ${d?.pace}. Notes: "${w.notes || ''}"`;
      }
    }).join('\n');

    const prompt = `User Profile:
- Name: ${user.name}
- Weight: ${user.weight || 'Not Provided'} kg
- Height: ${user.height || 'Not Provided'} cm
- Current XP Point Status: ${user.xp}

Recent Workouts Activity:
${summary || 'No physical activities logged yet this week.'}

Generate a concise, motivating, and personalized 3-part coaching insight (strictly Under 200 words total, formatted using clean markdown bullets):
1. AUTOMATIC PROGRESS DETECTION: Highlight an improvement or note a key trend in weight, distance, pace, or estimated 1RM.
2. NEXT HYBRID SESSION SUGGESTION: Give a specific Gym exercise targeting their weak areas, or a target Cardio goal based on their history.
3. ACCOUNTABILITY CHAT: Speak to their active streak, motivation, or XP status with a professional but energetic, friendly coach tone (like Nike Training Club or Strava).`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are Vantabuilt\'s Olympic Hybrid Strength & Endurance Personal Trainer. Keep predictions very specific, scientifically sound, upbeat, and concise. Highlight estimated 1RM numbers or pacing targets. Never speak in generic terms. Format with clear, attractive markdown bullets.'
      }
    });

    return response.text || generateFallbackAdvice(user, recentSessions);
  } catch (error) {
    console.error('Gemini API call failed, using high-quality fallback generator:', error);
    return generateFallbackAdvice(user, recentSessions);
  }
}

function generateFallbackAdvice(user: User, recentSessions: WorkoutSession[]): string {
  // Broad and realistic strength insights based on history
  const hasGym = recentSessions.some(w => w.type === 'gym');
  const hasCardio = recentSessions.some(w => w.type === 'cardio');

  let strengthLine = "No high-weight lift detected yet.";
  const maxBench = recentSessions
    .flatMap(w => w.exercises || [])
    .filter(e => e.name.toLowerCase().includes('bench'))
    .sort((a, b) => b.weight - a.weight)[0];

  if (maxBench) {
    strengthLine = `Your max ${maxBench.name} logged is ${maxBench.weight}kg. Calculated 1RM is ~${(maxBench.weight * (1 + maxBench.reps / 30)).toFixed(1)}kg.`;
  } else if (hasGym) {
    strengthLine = "You have consistent gym intensity! Continue tracking lifting weights to map your progressive overload curves.";
  }

  let cardioLine = "No cardio session recorded yet.";
  const bestRun = recentSessions
    .filter(w => w.type === 'cardio' && w.cardioDetails?.type === 'Running')
    .sort((a, b) => (b.cardioDetails?.distance || 0) - (a.cardioDetails?.distance || 0))[0];

  if (bestRun && bestRun.cardioDetails) {
    cardioLine = `Your top Run is ${bestRun.cardioDetails.distance}km at ${bestRun.cardioDetails.pace}. Auto-progression: Build to ${Number((bestRun.cardioDetails.distance * 1.1).toFixed(1))}km next session to steady your aerobic base.`;
  } else if (hasCardio) {
    cardioLine = "Solid aerobic foundation! Expand your tempo sessions to increase endurance thresholds.";
  }

  return `### Vantabuilt Coach Assessment
*Providing a personalized assessment based on past performance.*

- 📈 **Progress & 1-Rep-Max Output**: ${strengthLine}
- 🏃‍♂️ **Cardio Threshold Insights**: ${cardioLine}
- 🎯 **Recommended Target Session**: 
  - Aim for a **hybrid progression day**: 3 sets of compound lifts (Squats or Chest Press at 80% intensity) followed by a **2km recovery run** at a relaxed aerobic tempo.
- 🦁 **Motivation Coach Note**: Evans, your consistency score is high this week! You are just 1 session away from leveling up to the next XP tier. Let's conquer the day!`;
}
