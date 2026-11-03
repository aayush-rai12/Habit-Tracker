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
import labelRoutes from './routes/labelRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/habits/:id/completions', completionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/labels', labelRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: { message: 'Something went wrong!' } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});