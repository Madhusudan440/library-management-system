import { supabase } from '../server/config/supabase.js';
import { initialBooks, initialCopies, initialCategories } from '../server/mockData.js';

async function syncToSupabase() {
  console.log('Syncing categories and books to Supabase...');

  // 1. Sync categories
  const categoriesToUpsert = initialCategories.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    icon: c.icon || 'BookOpen',
  }));

  const { error: catErr } = await supabase
    .from('categories')
    .upsert(categoriesToUpsert, { onConflict: 'id' });

  if (catErr) {
    console.warn('Category upsert notice:', catErr.message);
  } else {
    console.log(`✓ ${categoriesToUpsert.length} Categories synced`);
  }

  // 2. Sync books
  const booksToUpsert = initialBooks.map(b => ({
    id: b.id,
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    publication_year: b.publication_year,
    category_id: b.category_id,
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

  const { error: bookErr } = await supabase
    .from('books')
    .upsert(booksToUpsert, { onConflict: 'id' });

  if (bookErr) {
    console.error('Book upsert error:', bookErr);
  } else {
    console.log(`✓ ${booksToUpsert.length} Books synced to Supabase`);
  }

  // 3. Verify total books in Supabase
  const { count, error: countErr } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true });

  console.log('Total books in live Supabase:', count);
}

syncToSupabase().catch(console.error);
