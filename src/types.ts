/**
 * Shared Type Definitions for Vantabuilt
 */

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface CardioDetails {
  type: 'Running' | 'Cycling' | 'Walking' | 'Swimming';
  distance: number; // in km or m
  time: number;     // in minutes
  pace: string;     // e.g. "5:30 min/km"
  route?: Array<{ lat: number; lng: number }>;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'gym' | 'cardio';
  duration: number; // in minutes
  calories: number; // estimated calories burned
  notes?: string;
  date: string;     // ISO Date String
  exercises?: Exercise[];      // present if type === 'gym'
  cardioDetails?: CardioDetails; // present if type === 'cardio'
  likes: string[];              // list of userIds
  comments: ActivityComment[];
  oneRepMaxEstimate?: {
    exerciseName: string;
    weight: number;
    reps: number;
    estimated1RM: number;
  };
}

export interface ActivityComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  weight?: number; // optional body weight in kg
  height?: number; // optional height in cm
  xp: number;      // user rewards points
  avatar: string;  // user emoji / avatar representation
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'frequency' | 'streak';
  target: number;      // target value e.g. 50 (km) or 12 (sessions)
  startDate: string;   // ISO Date
  endDate: string;     // ISO Date
  participants: string[]; // userIds
  leaderboard: ChallengeLeaderboardEntry[];
}

export interface ChallengeLeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar: string;
  progressValue: number; // current value (e.g. 15km done, 3 days streak)
  completed: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // userIds
  inviteCode: string;
  challenges: string[]; // challengeIds
}

export interface NotificationMsg {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}
