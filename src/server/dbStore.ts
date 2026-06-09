import fs from 'fs';
import path from 'path';
import { User, WorkoutSession, Challenge, NotificationMsg, Exercise, CardioDetails, ActivityComment } from '../types';

const DB_FILE = path.join(process.cwd(), 'vantabuilt_db.json');

interface DatabaseSchema {
  users: User[];
  workouts: WorkoutSession[];
  challenges: Challenge[];
  notifications: NotificationMsg[];
  currentUser: string; // userId of current logged-in user
}

// Highly engaging seed data
const initialUsers: User[] = [
  { id: 'u1', name: 'Evans (You)', email: 'evansabura1@gmail.com', weight: 82, height: 180, xp: 450, avatar: '🦁' },
  { id: 'u2', name: 'Mary', email: 'mary@vantabuilt.app', weight: 64, height: 168, xp: 820, avatar: '🦄' },
  { id: 'u3', name: 'John', email: 'john@vantabuilt.app', weight: 90, height: 185, xp: 640, avatar: '🦒' },
  { id: 'u4', name: 'Alex', email: 'alex@vantabuilt.app', weight: 75, height: 176, xp: 510, avatar: '🦊' },
  { id: 'u5', name: 'Chloe', email: 'chloe@vantabuilt.app', weight: 58, height: 162, xp: 950, avatar: '🐼' },
];

const initialWorkouts: WorkoutSession[] = [
  {
    id: 'w1',
    userId: 'u2',
    userName: 'Mary',
    userAvatar: '🦄',
    type: 'cardio',
    duration: 28,
    calories: 380,
    notes: 'Morning run in the park! Felt very strong today. Beat my personal pace record by 10s.',
    date: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    cardioDetails: {
      type: 'Running',
      distance: 5.0,
      time: 28,
      pace: '5:36 min/km',
      route: [
        { lat: 51.505, lng: -0.09 },
        { lat: 51.506, lng: -0.091 },
        { lat: 51.508, lng: -0.092 },
        { lat: 51.507, lng: -0.089 },
        { lat: 51.505, lng: -0.09 }
      ]
    },
    likes: ['u1', 'u3'],
    comments: [
      { id: 'c1', userId: 'u1', userName: 'Evans (You)', text: 'Awesome pace Mary! Keep it up!', date: new Date(Date.now() - 3600000).toISOString() },
      { id: 'c2', userId: 'u3', userName: 'John', text: 'You are flying! 🏃💨', date: new Date(Date.now() - 1800000).toISOString() }
    ]
  },
  {
    id: 'w2',
    userId: 'u3',
    userName: 'John',
    userAvatar: '🦒',
    type: 'gym',
    duration: 55,
    calories: 420,
    notes: 'Heavy bench press and skull crushers. Pushed to failure on final sets!',
    date: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 10, weight: 80 },
      { name: 'Incline Dumbbell Press', sets: 4, reps: 12, weight: 28 },
      { name: 'Skull Crushers', sets: 3, reps: 12, weight: 35 },
      { name: 'Triceps Pushdowns', sets: 3, reps: 15, weight: 50 }
    ],
    likes: ['u2', 'u5'],
    comments: [],
    oneRepMaxEstimate: {
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 10,
      estimated1RM: 106.6
    }
  },
  {
    id: 'w3',
    userId: 'u5',
    userName: 'Chloe',
    userAvatar: '🐼',
    type: 'gym',
    duration: 45,
    calories: 310,
    notes: 'Squats progress felt perfect. Focused on depth and stance.',
    date: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
    exercises: [
      { name: 'Barbell Squats', sets: 4, reps: 8, weight: 75 },
      { name: 'Romanian Deadlifts', sets: 3, reps: 10, weight: 65 },
      { name: 'Leg Extensions', sets: 3, reps: 15, weight: 45 }
    ],
    likes: ['u1', 'u2', 'u3', 'u4'],
    comments: [
      { id: 'c3', userId: 'u4', userName: 'Alex', text: 'Pure power squat Chloe! Solid form', date: new Date(Date.now() - 3600000 * 15).toISOString() }
    ]
  },
  {
    id: 'w4',
    userId: 'u1',
    userName: 'Evans (You)',
    userAvatar: '🦁',
    type: 'gym',
    duration: 60,
    calories: 480,
    notes: 'Push Day. Felt energetic today. 100kg Bench target completed for 5 reps!',
    date: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 5, weight: 100 },
      { name: 'Overhead Shoulder Press', sets: 3, reps: 8, weight: 55 },
      { name: 'Lateral Raises', sets: 4, reps: 15, weight: 12.5 }
    ],
    likes: ['u2', 'u5'],
    comments: [
      { id: 'c4', userId: 'u5', userName: 'Chloe', text: 'Evans is putting in serious work! 🦁🔥', date: new Date(Date.now() - 3600000 * 20).toISOString() }
    ]
  },
  {
    id: 'w5',
    userId: 'u1',
    userName: 'Evans (You)',
    userAvatar: '🦁',
    type: 'cardio',
    duration: 35,
    calories: 450,
    notes: 'Afternoon cycle. Sunny weather, felt great!',
    date: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    cardioDetails: {
      type: 'Cycling',
      distance: 12.5,
      time: 35,
      pace: '2:48 min/km'
    },
    likes: ['u4'],
    comments: []
  },
  {
    id: 'w6',
    userId: 'u4',
    userName: 'Alex',
    userAvatar: '🦊',
    type: 'cardio',
    duration: 40,
    calories: 520,
    notes: 'Fast paced running.',
    date: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    cardioDetails: {
      type: 'Running',
      distance: 8.2,
      time: 40,
      pace: '4:52 min/km'
    },
    likes: ['u1', 'u2'],
    comments: []
  },
  {
    id: 'w7',
    userId: 'u1',
    userName: 'Evans (You)',
    userAvatar: '🦁',
    type: 'gym',
    duration: 50,
    calories: 410,
    notes: 'Deadlifts session. Steadily building back to 140kg.',
    date: new Date(Date.now() - 3600000 * 96).toISOString(), // 4 days ago
    exercises: [
      { name: 'Deadlift', sets: 4, reps: 5, weight: 130 },
      { name: 'Pull Ups', sets: 3, reps: 8, weight: 0 },
      { name: 'Barbell Rows', sets: 3, reps: 10, weight: 70 }
    ],
    likes: ['u3', 'u5'],
    comments: []
  }
];

const initialChallenges: Challenge[] = [
  {
    id: 'ch1',
    title: 'June Marathon Quest',
    description: 'Log a total of 50 km running/walking this month. Earn the "Marathon King" badge!',
    type: 'distance',
    target: 50,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.000Z',
    participants: ['u1', 'u2', 'u4'],
    leaderboard: [
      { userId: 'u2', userName: 'Mary', userAvatar: '🦄', progressValue: 32.5, completed: false },
      { userId: 'u1', userName: 'Evans (You)', userAvatar: '🦁', progressValue: 12.5, completed: false },
      { userId: 'u4', userName: 'Alex', userAvatar: '🦊', progressValue: 28.2, completed: false }
    ]
  },
  {
    id: 'ch2',
    title: 'Gym Consistency Star',
    description: 'Complete 12 gym workouts this month to build durable habits! Earn the "Consistency King" badge.',
    type: 'frequency',
    target: 12,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.000Z',
    participants: ['u1', 'u3', 'u5'],
    leaderboard: [
      { userId: 'u1', userName: 'Evans (You)', userAvatar: '🦁', progressValue: 3, completed: false },
      { userId: 'u3', userName: 'John', userAvatar: '🦒', progressValue: 5, completed: false },
      { userId: 'u5', userName: 'Chloe', userAvatar: '🐼', progressValue: 6, completed: false }
    ]
  },
  {
    id: 'ch3',
    title: 'Streak Builders',
    description: 'Train or log an activity for 5 consecutive days to spark peak energy.',
    type: 'streak',
    target: 5,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-15T23:59:59.000Z',
    participants: ['u1', 'u2', 'u3', 'u4', 'u5'],
    leaderboard: [
      { userId: 'u1', userName: 'Evans (You)', userAvatar: '🦁', progressValue: 4, completed: false },
      { userId: 'u2', userName: 'Mary', userAvatar: '🦄', progressValue: 3, completed: false },
      { userId: 'u3', userName: 'John', userAvatar: '🦒', progressValue: 2, completed: false },
      { userId: 'u4', userName: 'Alex', userAvatar: '🦊', progressValue: 1, completed: false },
      { userId: 'u5', userName: 'Chloe', userAvatar: '🐼', progressValue: 5, completed: true }
    ]
  }
];

const initialNotifications: NotificationMsg[] = [
  {
    id: 'n1',
    title: 'New Comment on Activity',
    body: 'Mary complimented your deadlift session: "Solid strength, Evans!"',
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    read: false
  },
  {
    id: 'n2',
    title: 'Streak Alert! 🔥',
    body: 'You are on a 4-day active streak. Train today to lock in your 5-day medal!',
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
    read: false
  },
  {
    id: 'n3',
    title: 'Challenge Update',
    body: 'Chloe completed the Streak Builders challenge! 🏆 Get yours completed too!',
    date: new Date(Date.now() - 3600000 * 20).toISOString(),
    read: true
  }
];

export class DBStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading DB schema, re-initializing fallback', e);
    }

    const defaultSchema: DatabaseSchema = {
      users: initialUsers,
      workouts: initialWorkouts,
      challenges: initialChallenges,
      notifications: initialNotifications,
      currentUser: 'u1'
    };
    this.saveData(defaultSchema);
    return defaultSchema;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving DB state:', err);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public save() {
    this.saveData(this.data);
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getCurrentUser(): User {
    const user = this.data.users.find(u => u.id === this.data.currentUser);
    return user || this.data.users[0];
  }

  public setCurrentUser(userId: string): User {
    this.data.currentUser = userId;
    this.save();
    return this.getCurrentUser();
  }

  public updateUser(updatedUser: Partial<User> & { id: string }): User {
    const idx = this.data.users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updatedUser };
      this.save();
      return this.data.users[idx];
    }
    throw new Error('User not found');
  }

  public getWorkouts(): WorkoutSession[] {
    // Sort reverse chronological
    return [...this.data.workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addWorkout(session: Omit<WorkoutSession, 'id' | 'likes' | 'comments' | 'userName' | 'userAvatar'> & { id?: string }): WorkoutSession {
    const user = this.data.users.find(u => u.id === session.userId) || this.getCurrentUser();
    
    // Calculate 1RM if bench / squat etc was logged in gym
    let oneRepMaxEstimate = undefined;
    if (session.type === 'gym' && session.exercises && session.exercises.length > 0) {
      // Find historical max single rep lift or calculate from first exercise
      const mainLift = session.exercises.find(e => e.reps > 0 && e.weight > 0);
      if (mainLift) {
        // Broadly popular Epley formula: 1RM = w * (1 + r / 30)
        const est1RM = Number((mainLift.weight * (1 + mainLift.reps / 30)).toFixed(1));
        oneRepMaxEstimate = {
          exerciseName: mainLift.name,
          weight: mainLift.weight,
          reps: mainLift.reps,
          estimated1RM: est1RM
        };
      }
    }

    const newSession: WorkoutSession = {
      id: session.id || 'w_' + Math.random().toString(36).substr(2, 9),
      userId: session.userId,
      userName: user.name,
      userAvatar: user.avatar,
      type: session.type,
      duration: session.duration,
      calories: session.calories || (session.type === 'gym' ? session.duration * 7 : session.duration * 11),
      notes: session.notes,
      date: session.date || new Date().toISOString(),
      exercises: session.exercises,
      cardioDetails: session.cardioDetails,
      likes: [],
      comments: [],
      oneRepMaxEstimate
    };

    this.data.workouts.push(newSession);

    // Reward XP on logging workout
    user.xp += 100; // 100 XP per logged workout!
    this.updateUser(user);

    // Trigger challenge progress updates automatically
    this.updateChallengeProgress(user.id, session.type, session.cardioDetails?.distance || 0);

    // Push system reminder alert mock
    this.addNotification({
      title: 'Workout Logged! 🎉',
      body: `Awesome job Evans! You successfully logged a ${session.type === 'gym' ? 'Gym workout' : session.cardioDetails?.type || 'Cardio सेशन'} and earned 100 XP!`
    });

    this.save();
    return newSession;
  }

  public toggleLike(workoutId: string, userId: string): WorkoutSession {
    const w = this.data.workouts.find(item => item.id === workoutId);
    if (!w) throw new Error('Workout not found');

    const index = w.likes.indexOf(userId);
    if (index === -1) {
      w.likes.push(userId);
      // Give notifications if liking someone else's workout
      if (w.userId !== userId) {
        const liker = this.data.users.find(u => u.id === userId);
        this.addNotification({
          title: 'Workout Liked! ❤️',
          body: `${liker?.name || 'A friend'} liked your ${w.type === 'gym' ? 'gym' : 'cardio'} workout logged on ${new Date(w.date).toLocaleDateString()}!`
        });
      }
    } else {
      w.likes.splice(index, 1);
    }
    this.save();
    return w;
  }

  public addComment(workoutId: string, userId: string, text: string): ActivityComment {
    const w = this.data.workouts.find(item => item.id === workoutId);
    if (!w) throw new Error('Workout not found');

    const commenter = this.data.users.find(u => u.id === userId) || this.getCurrentUser();
    const comment: ActivityComment = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      userId,
      userName: commenter.name,
      text,
      date: new Date().toISOString()
    };

    w.comments.push(comment);

    // Trigger notification for the owner of the workout
    if (w.userId !== userId) {
      this.addNotification({
        title: 'New Activity Comment 💬',
        body: `${commenter.name} left a comment: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`
      });
    }

    this.save();
    return comment;
  }

  public getChallenges(): Challenge[] {
    return this.data.challenges;
  }

  public joinChallenge(challengeId: string, userId: string): Challenge {
    const ch = this.data.challenges.find(c => c.id === challengeId);
    if (!ch) throw new Error('Challenge not found');

    if (!ch.participants.includes(userId)) {
      ch.participants.push(userId);
      const user = this.data.users.find(u => u.id === userId) || this.getCurrentUser();
      
      // Calculate current user status to seed initial value
      let initialVal = 0;
      if (ch.type === 'distance') {
        initialVal = this.data.workouts
          .filter(w => w.userId === userId && w.type === 'cardio' && w.cardioDetails)
          .reduce((sum, w) => sum + (w.cardioDetails?.distance || 0), 0);
      } else if (ch.type === 'frequency') {
        initialVal = this.data.workouts.filter(w => w.userId === userId).length;
      } else {
        initialVal = 1; // Start streak of 1 as join bonus
      }

      ch.leaderboard.push({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        progressValue: Number(initialVal.toFixed(1)),
        completed: initialVal >= ch.target
      });

      this.addNotification({
        title: 'Joined Challenge! 🏆',
        body: `You joined "${ch.title}". Best of luck! Let's reach ${ch.target} ${ch.type === 'distance' ? 'km' : 'workouts'} together!`
      });
    }

    this.save();
    return ch;
  }

  private updateChallengeProgress(userId: string, type: 'gym' | 'cardio', distance: number) {
    for (const ch of this.data.challenges) {
      if (!ch.participants.includes(userId)) continue;

      const entry = ch.leaderboard.find(e => e.userId === userId);
      if (entry) {
        if (ch.type === 'distance' && type === 'cardio') {
          entry.progressValue = Number((entry.progressValue + distance).toFixed(1));
        } else if (ch.type === 'frequency') {
          entry.progressValue += 1;
        } else if (ch.type === 'streak') {
          entry.progressValue += 1; // Increment current active streak days
        }

        if (entry.progressValue >= ch.target && !entry.completed) {
          entry.completed = true;
          // Award XP bonus
          const user = this.data.users.find(u => u.id === userId);
          if (user) {
            user.xp += 500; // Massive XP boost!
            this.updateUser(user);
          }
          this.addNotification({
            title: 'Challenge Gold Medal! 🥇',
            body: `Incredible! Evans completed the challenge "${ch.title}" and won a massive 500 XP points bonus medal!`
          });
        }
      }
    }
  }

  public registerUser(name: string, email: string, avatar: string, weight?: number, height?: number): User {
    const exists = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return exists;
    }

    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      weight,
      height,
      xp: 100, // starting gift XP
      avatar: avatar || '🏃'
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public getNotifications(): NotificationMsg[] {
    return this.data.notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addNotification(notif: Omit<NotificationMsg, 'id' | 'date' | 'read'>): NotificationMsg {
    const newNotif = {
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      title: notif.title,
      body: notif.body,
      date: new Date().toISOString(),
      read: false
    };
    this.data.notifications.push(newNotif);
    
    // limit notifications list size to latest 50
    if (this.data.notifications.length > 50) {
      this.data.notifications = this.data.notifications.slice(-50);
    }
    
    this.save();
    return newNotif;
  }

  public markNotificationsRead() {
    this.data.notifications.forEach(n => n.read = true);
    this.save();
  }
}

export const dbStore = new DBStore();
