import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// 1. Get all categories
router.get('/', authenticateUser, async (req, res) => {
  try {
    const categoriesWithCount = inMemoryDb.categories.map(cat => {
      const bookCount = inMemoryDb.books.filter(b => b.category_id === cat.id && !b.is_archived).length;
      return {
        ...cat,
        book_count: bookCount,
      };
    });

    res.json({ success: true, categories: categoriesWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
});

// 2. Create category (Admin)
router.post('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const exists = inMemoryDb.categories.find(c => c.slug === slug || c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(409).json({ success: false, message: 'Category already exists.' });
    }

    const newCat = {
      id: 'cat-' + Date.now(),
      name: name.trim(),
      slug,
      description: description || '',
      icon: icon || 'BookOpen',
      created_at: new Date().toISOString(),
    };

    inMemoryDb.categories.push(newCat);
    inMemoryDb.logAudit(req.user.id, req.user.email, 'CREATE_CATEGORY', 'categories', newCat.id, { name: newCat.name });

    res.status(201).json({ success: true, message: 'Category created.', category: newCat });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

// 3. Delete category (Admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const index = inMemoryDb.categories.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const cat = inMemoryDb.categories[index];
    const attachedBooks = inMemoryDb.books.filter(b => b.category_id === cat.id);
    if (attachedBooks.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${attachedBooks.length} books are assigned to it.`
      });
    }

    inMemoryDb.categories.splice(index, 1);
    inMemoryDb.logAudit(req.user.id, req.user.email, 'DELETE_CATEGORY', 'categories', cat.id, { name: cat.name });

    res.json({ success: true, message: `Category "${cat.name}" deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

export default router;
