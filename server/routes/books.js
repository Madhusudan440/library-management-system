import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { supabase, isLiveSupabase, inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// 1. Get books with multi-field search, filters, sorting & pagination
router.get('/', authenticateUser, async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      availability = 'all', // all, available, out_of_stock
      sortBy = 'title',     // title, publication_year, available_copies, created_at
      sortOrder = 'asc',    // asc, desc
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    if (isLiveSupabase) {
      let query = supabase
        .from('books')
        .select('*', { count: 'exact' })
        .eq('is_archived', false);

      if (category) {
        query = query.eq('category_id', category);
      }

      if (availability === 'available') {
        query = query.gt('available_copies', 0);
      } else if (availability === 'out_of_stock') {
        query = query.eq('available_copies', 0);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%,publisher.ilike.%${search}%`);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + limitNum - 1);

      const { data: books, count, error } = await query;
      if (error) throw error;

      return res.json({
        success: true,
        books: books || [],
        total: count || 0,
        page: pageNum,
        totalPages: Math.ceil((count || 0) / limitNum),
      });
    }

    // In-Memory store filtering
    let filtered = inMemoryDb.books.filter(b => !b.is_archived);

    if (category) {
      filtered = filtered.filter(b => b.category_id === category || b.category_name?.toLowerCase() === category.toLowerCase());
    }

    if (availability === 'available') {
      filtered = filtered.filter(b => b.available_copies > 0);
    } else if (availability === 'out_of_stock') {
      filtered = filtered.filter(b => b.available_copies === 0);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q) ||
        b.publisher?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    res.json({
      success: true,
      books: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('Fetch books error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve books.' });
  }
});

// 2. Get popular books based on loan frequency
router.get('/popular', authenticateUser, async (req, res) => {
  try {
    // Sort books by issued_copies or loan history
    const books = [...inMemoryDb.books]
      .filter(b => !b.is_archived)
      .sort((a, b) => b.issued_copies - a.issued_copies)
      .slice(0, 5);
    res.json({ success: true, books });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve popular books.' });
  }
});

// 3. Get recently added books
router.get('/recent', authenticateUser, async (req, res) => {
  try {
    const books = [...inMemoryDb.books]
      .filter(b => !b.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);
    res.json({ success: true, books });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve recent books.' });
  }
});

// 4. Export filtered book list to CSV format
router.get('/export-csv', authenticateUser, async (req, res) => {
  try {
    const books = inMemoryDb.books.filter(b => !b.is_archived);
    const headers = ['ISBN', 'Title', 'Author', 'Publisher', 'Year', 'Category', 'Total Copies', 'Available', 'Issued', 'Reserved'];
    const rows = books.map(b => [
      `"${b.isbn}"`,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.author.replace(/"/g, '""')}"`,
      `"${b.publisher || ''}"`,
      b.publication_year,
      `"${b.category_name || ''}"`,
      b.total_copies,
      b.available_copies,
      b.issued_copies,
      b.reserved_copies,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="library_books_inventory.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
});

// 5. Get single book details with copies and reservation count
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const book = inMemoryDb.books.find(b => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const copies = inMemoryDb.copies.filter(c => c.book_id === book.id);
    const reservations = inMemoryDb.reservations.filter(r => r.book_id === book.id && r.status === 'pending');

    res.json({
      success: true,
      book: {
        ...book,
        copies,
        activeReservationsCount: reservations.length,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving book.' });
  }
});

// 6. Create book with duplicate ISBN validation & auto copy creation (Admin)
router.post('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      publication_year,
      category_id,
      description,
      cover_url,
      edition,
      pages,
      shelf_location,
      total_copies = 1,
    } = req.body;

    if (!isbn || !title || !author) {
      return res.status(400).json({ success: false, message: 'ISBN, title, and author are required.' });
    }

    // Duplicate ISBN check
    const existing = inMemoryDb.books.find(b => b.isbn?.trim().toLowerCase() === isbn.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: `A book with ISBN ${isbn} already exists: "${existing.title}".` });
    }

    const cat = inMemoryDb.categories.find(c => c.id === category_id);
    const numCopies = Math.max(1, parseInt(total_copies, 10) || 1);

    const newBook = {
      id: 'book-' + Date.now(),
      isbn: isbn.trim(),
      title: title.trim(),
      author: author.trim(),
      publisher: publisher || 'Tech Academic Press',
      publication_year: parseInt(publication_year, 10) || 2024,
      category_id: category_id || (inMemoryDb.categories[0]?.id),
      category_name: cat ? cat.name : (inMemoryDb.categories[0]?.name || 'Computer Science'),
      description: description || 'Academic textbook for engineering curriculum.',
      cover_url: cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      edition: edition || '1st Edition',
      pages: parseInt(pages, 10) || 450,
      shelf_location: shelf_location || 'Shelf A-01',
      total_copies: numCopies,
      available_copies: numCopies,
      issued_copies: 0,
      reserved_copies: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryDb.books.unshift(newBook);

    // Generate barcoded physical copy records
    for (let i = 1; i <= numCopies; i++) {
      inMemoryDb.copies.push({
        id: `copy-${newBook.id}-${i}`,
        book_id: newBook.id,
        barcode: `BAR-${newBook.isbn.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}-${i.toString().padStart(2, '0')}`,
        copy_number: i,
        status: 'available',
        condition: 'good',
        created_at: new Date().toISOString(),
      });
    }

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'CREATE_BOOK',
      'books',
      newBook.id,
      { isbn: newBook.isbn, title: newBook.title, copies: numCopies }
    );

    res.status(201).json({
      success: true,
      message: 'Book created successfully with barcode inventory records.',
      book: newBook,
    });
  } catch (err) {
    console.error('Create book error:', err);
    res.status(500).json({ success: false, message: 'Failed to create book.' });
  }
});

// 7. Update book (Admin)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const book = inMemoryDb.books.find(b => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const {
      isbn,
      title,
      author,
      publisher,
      publication_year,
      category_id,
      description,
      cover_url,
      edition,
      pages,
      shelf_location,
      total_copies,
    } = req.body;

    // Check duplicate ISBN if changing
    if (isbn && isbn !== book.isbn) {
      const duplicate = inMemoryDb.books.find(b => b.isbn === isbn && b.id !== book.id);
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Another book already uses this ISBN.' });
      }
      book.isbn = isbn;
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (publisher) book.publisher = publisher;
    if (publication_year) book.publication_year = parseInt(publication_year, 10);
    if (category_id) {
      book.category_id = category_id;
      const cat = inMemoryDb.categories.find(c => c.id === category_id);
      if (cat) book.category_name = cat.name;
    }
    if (description !== undefined) book.description = description;
    if (cover_url) book.cover_url = cover_url;
    if (edition) book.edition = edition;
    if (pages) book.pages = parseInt(pages, 10);
    if (shelf_location) book.shelf_location = shelf_location;

    if (total_copies !== undefined) {
      const newTotal = parseInt(total_copies, 10);
      const diff = newTotal - book.total_copies;
      book.total_copies = newTotal;
      book.available_copies = Math.max(0, book.available_copies + diff);
    }

    book.updated_at = new Date().toISOString();

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'UPDATE_BOOK',
      'books',
      book.id,
      { title: book.title, isbn: book.isbn }
    );

    res.json({ success: true, message: 'Book updated successfully.', book });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update book.' });
  }
});

// 8. Delete / Archive book (Admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const bookIndex = inMemoryDb.books.findIndex(b => b.id === req.params.id);
    if (bookIndex === -1) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const book = inMemoryDb.books[bookIndex];

    // Prevent deletion if copies are actively issued
    if (book.issued_copies > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book while ${book.issued_copies} copies are currently issued to students. Process returns first or archive the book.`
      });
    }

    inMemoryDb.books.splice(bookIndex, 1);

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'DELETE_BOOK',
      'books',
      book.id,
      { title: book.title, isbn: book.isbn }
    );

    res.json({ success: true, message: `Book "${book.title}" deleted from library inventory.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete book.' });
  }
});

// 9. Batch CSV Import (Admin)
router.post('/import-csv', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ success: false, message: 'CSV data string is required.' });
    }

    const lines = csvData.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: 'CSV must contain headers and at least one data row.' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    let importedCount = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || '';
      });

      const isbn = row.isbn;
      const title = row.title;
      const author = row.author;

      if (!isbn || !title || !author) {
        errors.push(`Row ${i + 1}: Missing required fields (isbn, title, author).`);
        continue;
      }

      if (inMemoryDb.books.some(b => b.isbn === isbn)) {
        errors.push(`Row ${i + 1}: ISBN ${isbn} already exists.`);
        continue;
      }

      const totalCopies = parseInt(row.copies || row.total_copies || '3', 10);
      const newBook = {
        id: 'book-imported-' + Date.now() + '-' + i,
        isbn,
        title,
        author,
        publisher: row.publisher || 'Cloud University Press',
        publication_year: parseInt(row.year || row.publication_year || '2023', 10),
        category_id: inMemoryDb.categories[0]?.id,
        category_name: row.category || inMemoryDb.categories[0]?.name || 'Cloud Computing',
        description: row.description || 'Imported academic record.',
        cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        edition: row.edition || '1st Edition',
        pages: parseInt(row.pages || '400', 10),
        shelf_location: row.shelf || 'Section C',
        total_copies: totalCopies,
        available_copies: totalCopies,
        issued_copies: 0,
        reserved_copies: 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      inMemoryDb.books.unshift(newBook);
      importedCount++;
    }

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'IMPORT_CSV',
      'books',
      'batch',
      { imported: importedCount, errors: errors.length }
    );

    res.json({
      success: true,
      message: `Successfully imported ${importedCount} books from CSV.`,
      importedCount,
      errors,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'CSV import error.' });
  }
});

export default router;
