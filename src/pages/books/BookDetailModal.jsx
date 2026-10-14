import React from 'react';
import { BookOpen, Layers, Barcode, MapPin, Calendar, Building, FileText, CheckCircle2, BookmarkCheck } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const BookDetailModal = ({ book, isOpen, onClose, onReserve, isStudent }) => {
  if (!book) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bibliographic Details" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Main Cover & Summary */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-full sm:w-48 h-64 rounded-2xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-800">
            <img
              src={book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="indigo">{book.category_name || 'Engineering'}</Badge>
              <Badge variant={book.available_copies > 0 ? 'available' : 'out_of_stock'}>
                {book.available_copies > 0 ? `${book.available_copies} Copies Available` : 'All Copies Checked Out'}
              </Badge>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {book.title}
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              by <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{book.author}</span>
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Barcode className="w-4 h-4 text-slate-400" />
                <span>ISBN: <strong className="text-slate-800 dark:text-slate-200 font-mono">{book.isbn}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Building className="w-4 h-4 text-slate-400" />
                <span>Publisher: <strong className="text-slate-800 dark:text-slate-200">{book.publisher || 'Academic Press'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Year: <strong className="text-slate-800 dark:text-slate-200">{book.publication_year || 2023}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Location: <strong className="text-slate-800 dark:text-slate-200">{book.shelf_location || 'Section A'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Pages: <strong className="text-slate-800 dark:text-slate-200">{book.pages || 450}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Edition: <strong className="text-slate-800 dark:text-slate-200">{book.edition || '1st Edition'}</strong></span>
              </div>
            </div>

            {isStudent && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    onReserve(book.id);
                    onClose();
                  }}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  {book.available_copies > 0 ? 'Reserve Physical Copy' : 'Join Reservation Waitlist'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Synopsis */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Abstract / Overview</h4>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {book.description || 'No overview synopsis provided for this engineering title.'}
          </p>
        </div>

        {/* Individual Barcoded Physical Copies Tracking */}
        {book.copies && book.copies.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              Barcoded Physical Inventory Copies ({book.copies.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {book.copies.map((copy) => (
                <div
                  key={copy.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                      {copy.barcode}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Copy #{copy.copy_number} • Condition: {copy.condition || 'good'}
                    </span>
                  </div>
                  <Badge variant={copy.status}>{copy.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
