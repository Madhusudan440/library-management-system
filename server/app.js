import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import categoryRoutes from './routes/categories.js';
import loanRoutes from './routes/loans.js';
import reservationRoutes from './routes/reservations.js';
import studentRoutes from './routes/students.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import settingRoutes from './routes/settings.js';
import auditRoutes from './routes/audit.js';
import { isLiveSupabase } from './config/supabase.js';

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cloud Computing & Microservices Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'CloudLib Pro Backend API (Vercel Serverless Compatible)',
    cloudProvider: 'Vercel Functions & Supabase Cloud PostgreSQL',
    database: isLiveSupabase ? 'Supabase PostgreSQL (Live)' : 'In-Memory Testing Database (Demo Ready)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit', auditRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found. Check documentation.`,
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
