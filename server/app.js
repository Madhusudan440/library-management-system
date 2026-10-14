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
const healthHandler = (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'CloudLib Pro Backend API (Vercel Serverless Compatible)',
    cloudProvider: 'Vercel Functions & Supabase Cloud PostgreSQL',
    database: isLiveSupabase ? 'Supabase PostgreSQL (Live)' : 'In-Memory Testing Database (Demo Ready)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes - registered on both /api/* and /* for full Vercel rewrite compatibility
const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/books`, bookRoutes);
  app.use(`${prefix}/categories`, categoryRoutes);
  app.use(`${prefix}/loans`, loanRoutes);
  app.use(`${prefix}/reservations`, reservationRoutes);
  app.use(`${prefix}/students`, studentRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/analytics`, analyticsRoutes);
  app.use(`${prefix}/settings`, settingRoutes);
  app.use(`${prefix}/audit`, auditRoutes);
};

registerRoutes('/api');
registerRoutes('');

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
