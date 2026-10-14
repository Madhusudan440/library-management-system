import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Grid,
  List,
  Edit2,
  Trash2,
  BookmarkCheck,
  Eye,
  BookOpen,
  ArrowUpDown,
  Barcode,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner, SkeletonCard } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { BookFormModal } from './BookFormModal';
import { BookDetailModal } from './BookDetailModal';
import { CsvImportModal } from './CsvImportModal';

export const BookCatalog = ({ initialAction }) => {
  const { isAdmin, isStudent } = useAuth();
  const { success, error: toastError } = useToast();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(initialAction === 'add');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(initialAction === 'import');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [page, search, selectedCategory, availability, sortBy, sortOrder]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await api.getBooks({
        page,
        limit: 8,
        search,
        category: selectedCategory,
        availability,
        sortBy,
        sortOrder,
      });

      if (res.success) {
        setBooks(res.books || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      toastError('Failed to fetch catalogue books.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookFormSubmit = async (formData, id) => {
    if (id) {
      const res = await api.updateBook(id, formData);
      if (res.success) {
        success(res.message);
        loadBooks();
      }
    } else {
      const res = await api.createBook(formData);
      if (res.success) {
        success(res.message);
        loadBooks();
      }
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    try {
      const res = await api.deleteBook(selectedBook.id);
      if (res.success) {
        success(res.message);
        setIsConfirmDeleteOpen(false);
        setSelectedBook(null);
        loadBooks();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete book.');
    }
  };

  const handleReserve = async (bookId) => {
    try {
      const res = await api.createReservation(bookId);
      if (res.success) {
        success(res.message);
        loadBooks();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Reservation failed.');
    }
  };

  const handleCsvImport = async (csvData) => {
    const res = await api.importCsvBooks(csvData);
    if (res.success) {
      loadBooks();
      return res;
    }
    throw new Error(res.message);
  };

  const handleExportCsv = () => {
    window.location.href = api.exportCsvUrl();
    success('Inventory CSV export initiated.');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Admin Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAdmin ? 'Library Inventory & Book Records' : 'Explore Library Catalogue'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse through computer science, engineering, and cloud literature.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedBook(null);
                setIsFormOpen(true);
              }}
              className="btn-gradient px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="btn-secondary px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Import CSV
            </button>
            <button
              onClick={handleExportCsv}
              className="btn-secondary px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-indigo-500" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, author, ISBN..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Quick Controls: Availability, Sort, View Toggle */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none font-medium"
            >
              <option value="all">All Copies</option>
              <option value="available">Available to Borrow</option>
              <option value="out_of_stock">Waitlist Only (0 Copies)</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none font-medium"
            >
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="publication_year-desc">Year (Newest)</option>
              <option value="available_copies-desc">Availability (Highest)</option>
            </select>

            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => {
              setSelectedCategory('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name} ({cat.book_count || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Content Area: Grid or Table */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No matching books found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search criteria, category filters, or check the spelling.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="glass-card glass-card-hover flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-4">
                {/* Book Cover Image with Availability Badge */}
                <div className="relative h-48 rounded-xl overflow-hidden mb-3.5 bg-slate-200 dark:bg-slate-800">
                  <img
                    src={book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant={book.available_copies > 0 ? 'available' : 'out_of_stock'}>
                      {book.available_copies > 0 ? `${book.available_copies} In Stock` : '0 Available'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white font-mono">
                    {book.isbn}
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block line-clamp-1">
                  {book.category_name}
                </span>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {book.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  by {book.author}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{book.publication_year} • {book.edition}</span>
                  <span>{book.shelf_location}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedBook(book);
                    setIsDetailOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Details
                </button>

                {isAdmin ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedBook(book);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit book"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBook(book);
                        setIsConfirmDeleteOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Delete book"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleReserve(book.id)}
                    className="btn-gradient px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    {book.available_copies > 0 ? 'Reserve' : 'Waitlist'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">ISBN</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Inventory</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-10 h-12 rounded object-cover shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{book.title}</div>
                          <div className="text-xs text-slate-500">{book.author} ({book.publication_year})</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {book.isbn}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {book.category_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {book.shelf_location}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={book.available_copies > 0 ? 'available' : 'out_of_stock'}>
                        {book.available_copies} / {book.total_copies} Avail
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedBook(book);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBook(book);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBook(book);
                                setIsConfirmDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReserve(book.id)}
                            className="btn-gradient px-3 py-1 rounded-lg text-xs font-semibold"
                          >
                            Reserve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={8}
        onPageChange={setPage}
      />

      {/* Modals */}
      <BookDetailModal
        book={selectedBook}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onReserve={handleReserve}
        isStudent={isStudent}
      />

      <BookFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedBook(null);
        }}
        onSubmit={handleBookFormSubmit}
        book={selectedBook}
        categories={categories}
      />

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleCsvImport}
      />

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteBook}
        title="Delete Book from Inventory"
        message={`Are you sure you want to delete "${selectedBook?.title}" (${selectedBook?.isbn})? This removes all associated copy records.`}
        confirmText="Delete Book"
        danger
      />
    </div>
  );
};
