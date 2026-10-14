import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-indigo-600 dark:text-indigo-400`} />
      {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="glass-card p-6 rounded-2xl shimmer-box animate-pulse bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
    <div className="h-44 bg-slate-300 dark:bg-slate-700 rounded-xl" />
    <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
    <div className="flex justify-between pt-2">
      <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-20" />
      <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-16" />
    </div>
  </div>
);
