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
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('mock-')
);

// Resilient initialization: supports Node 20 (via ws) and Node 22+ (native WebSocket)
let client = null;
if (isLiveSupabase) {
  try {
    const wsTransport = typeof globalThis.WebSocket !== 'undefined' ? globalThis.WebSocket : WebSocket;
    client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: wsTransport },
    });
  } catch (initErr) {
    console.warn('[Supabase Init Warning] Failed to initialize Supabase client:', initErr.message);
    client = null;
  }
}

export const supabase = client;

// Auto-seed Supabase when connected to an empty database
export async function autoSeedSupabase() {
  if (!isLiveSupabase || !supabase) return false;
  try {
    // 1. Seed categories if missing
    const { data: existingCats, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (!catErr && (!existingCats || existingCats.length === 0)) {
      console.log('[Supabase AutoSeed] Populating categories...');
      const catsToInsert = initialCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        icon: c.icon || 'BookOpen',
      }));
      await supabase.from('categories').upsert(catsToInsert, { onConflict: 'id' });
    }

    // 2. Seed books if missing
    const { data: existingBooks, error: bookErr } = await supabase
      .from('books')
      .select('id')
      .limit(1);

    if (!bookErr && (!existingBooks || existingBooks.length === 0)) {
      console.log('[Supabase AutoSeed] Populating initial books catalog...');
      const booksToInsert = initialBooks.map((b) => ({
        id: b.id,
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        publication_year: b.publication_year,
        category_id: b.category_id,
        category_name: b.category_name,
        description: b.description,
        cover_url: b.cover_url,
        edition: b.edition,
        pages: b.pages,
        shelf_location: b.shelf_location,
        total_copies: b.total_copies,
        available_copies: b.available_copies,
        issued_copies: b.issued_copies || 0,
        reserved_copies: b.reserved_copies || 0,
        is_archived: false,
      }));
      await supabase.from('books').upsert(booksToInsert, { onConflict: 'id' });

      // 3. Seed book copies
      const copiesToInsert = initialCopies.map((cp) => ({
        id: cp.id,
        book_id: cp.book_id,
        barcode: cp.barcode,
        copy_number: cp.copy_number,
        status: cp.status || 'available',
        condition: cp.condition || 'good',
      }));
      await supabase.from('book_copies').upsert(copiesToInsert, { onConflict: 'id' });
      return true;
    }
  } catch (seedErr) {
    console.warn('[Supabase AutoSeed] Notice during seed check:', seedErr.message);
  }
  return false;
}

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
