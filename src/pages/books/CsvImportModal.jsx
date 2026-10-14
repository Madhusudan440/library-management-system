import React, { useState } from 'react';
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const CsvImportModal = ({ isOpen, onClose, onImport }) => {
  const [csvContent, setCsvContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const sampleCsv = `isbn,title,author,publisher,year,category,copies
978-0132350884,Clean Architecture: A Craftsman's Guide,Robert C. Martin,Prentice Hall,2022,Software Engineering,4
978-1449373320,Site Reliability Engineering,Betsy Beyer,O'Reilly Media,2023,Cloud Computing & DevOps,5
978-0262035613,Deep Learning (Adaptive Computation),Ian Goodfellow,MIT Press,2022,Artificial Intelligence & ML,3`;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      setError('Please upload a file or paste CSV text.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await onImport(csvContent);
      setResults(res);
    } catch (err) {
      setError(err.message || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setCsvContent(sampleCsv);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Import Books via CSV"
      subtitle="Quickly ingest multiple academic books into the PostgreSQL catalogue"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {results ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
              CSV Import Completed Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {results.importedCount} books have been validated and inserted into the library inventory.
            </p>

            {results.errors && results.errors.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-left text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Skipped rows:</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {results.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setResults(null);
                onClose();
              }}
              className="btn-gradient px-6 py-2 rounded-xl text-xs font-semibold mt-2"
            >
              Done & Return to Catalogue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Template Info & Fast Sample */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Required CSV Columns</p>
                <code className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                  isbn, title, author, publisher, year, category, copies
                </code>
              </div>
              <button
                type="button"
                onClick={loadSample}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                Load Sample Template
              </button>
            </div>

            {/* Drag & Drop / File Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
              />
            </div>

            {/* Paste Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Or Paste CSV Content
              </label>
              <textarea
                rows="6"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="isbn,title,author,publisher,year,category,copies..."
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient py-2.5 px-6 rounded-xl font-semibold flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Validating & Importing...' : 'Import Books Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
