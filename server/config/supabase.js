import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import {
  initialBooks,
  initialCategories,
  initialCopies,
  initialLoans,
  initialNotifications,
  initialProfiles,
  initialReservations,
  initialSettings,
  initialAuditLogs,
} from '../mockData.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const isLiveSupabase = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('mock-demo-library') &&
  !supabaseKey.includes('mock-')
);

export const supabase = isLiveSupabase
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: WebSocket },
    })
  : null;

// In-Memory Database store for immediate testing & fallback
class InMemoryDatabase {
  constructor() {
    this.books = [...initialBooks];
    this.categories = [...initialCategories];
    this.copies = [...initialCopies];
    this.loans = [...initialLoans];
    this.notifications = [...initialNotifications];
    this.profiles = [...initialProfiles];
    this.reservations = [...initialReservations];
    this.settings = { ...initialSettings };
    this.auditLogs = [...initialAuditLogs];
    this.currentDemoUser = this.profiles[0]; // Admin by default
  }

  logAudit(userId, userEmail, action, entityType, entityId, details) {
    const entry = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    return entry;
  }
}

export const inMemoryDb = new InMemoryDatabase();
