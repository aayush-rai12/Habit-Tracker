import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Database setup
import './config/setupDb.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import completionRoutes from './routes/completionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Routes

// Auth routes
app.use('/api/auth', authRoutes);
// Habit routes
app.use('/api/habits', habitRoutes);
// Completion routes (nested under habits)
app.use('/api/habits/:id/completions', completionRoutes);
// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Here I'm checking server is running or not
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running!'
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});