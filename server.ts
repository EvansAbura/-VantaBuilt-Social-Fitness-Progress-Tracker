import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './src/server/dbStore';
import { generateFitnessAdvice } from './src/server/aiCoach';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit expanded for GPS trace data if sent
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES FIRST ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // User Endpoints
  app.get('/api/users', (req, res) => {
    try {
      res.json({ users: dbStore.getUsers() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/users/current', (req, res) => {
    try {
      res.json({ user: dbStore.getCurrentUser() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/users/current', (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      const user = dbStore.setCurrentUser(id);
      res.json({ message: 'User updated successfully', user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/users/add', (req, res) => {
    try {
      const { name, email, avatar, weight, height } = req.body;
      if (!name || !email) {
        res.status(400).json({ error: 'Name and Email are required' });
        return;
      }
      const user = dbStore.registerUser(
        name,
        email,
        avatar,
        weight ? Number(weight) : undefined,
        height ? Number(height) : undefined
      );
      res.json({ message: 'User created', user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/users/edit', (req, res) => {
    try {
      const { id, name, weight, height, avatar } = req.body;
      if (!id) {
        res.status(400).json({ error: 'ID is required' });
        return;
      }
      const user = dbStore.updateUser({
        id,
        name,
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
        avatar
      });
      res.json({ message: 'User updated', user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Workouts and Cardio Tracking
  app.get('/api/workouts', (req, res) => {
    try {
      res.json({ workouts: dbStore.getWorkouts() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/workouts', (req, res) => {
    try {
      const { userId, type, duration, calories, notes, exercises, cardioDetails, date } = req.body;
      if (!userId || !type || !duration) {
        res.status(400).json({ error: 'Required fields: userId, type, duration' });
        return;
      }

      const workout = dbStore.addWorkout({
        userId,
        type,
        duration: Number(duration),
        calories: calories ? Number(calories) : undefined,
        notes,
        exercises,
        cardioDetails,
        date
      });

      res.status(201).json({ message: 'Workout logged successfully', workout });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Social Likings and Comments
  app.post('/api/workouts/:id/like', (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: 'userId is required in request body' });
        return;
      }
      const workout = dbStore.toggleLike(id, userId);
      res.json({ workout });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/workouts/:id/comment', (req, res) => {
    try {
      const { id } = req.params;
      const { userId, text } = req.body;
      if (!userId || !text) {
        res.status(400).json({ error: 'userId and text are required in request body' });
        return;
      }
      const comment = dbStore.addComment(id, userId, text);
      res.json({ comment });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Challenges Endpoints
  app.get('/api/challenges', (req, res) => {
    try {
      res.json({ challenges: dbStore.getChallenges() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/challenges/:id/join', (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }
      const challenge = dbStore.joinChallenge(id, userId);
      res.json({ challenge });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Notifications Endpoints
  app.get('/api/notifications', (req, res) => {
    try {
      res.json({ notifications: dbStore.getNotifications() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/notifications/read', (req, res) => {
    try {
      dbStore.markNotificationsRead();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Athlete Coach Endpoint
  app.post('/api/coach/suggest', async (req, res) => {
    try {
      const { userId } = req.body;
      const usersList = dbStore.getUsers();
      const targetUser = usersList.find(u => u.id === userId) || dbStore.getCurrentUser();

      // Retrieve latest workouts for this user to pass to AI Coach
      const allWorkouts = dbStore.getWorkouts();
      const userWorkouts = allWorkouts.filter(w => w.userId === targetUser.id).slice(0, 5); // Last 5 workouts

      const advice = await generateFitnessAdvice(targetUser, userWorkouts);
      res.json({ advice });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- VITE DEV MIDDLEWARE / STATIC ASSETS ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vantabuilt server active and running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Critical failure during server startup:', err);
});
