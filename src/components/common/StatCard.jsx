import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  className = '',
  onClick,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'hover:border-indigo-400/50',
      glow: 'shadow-indigo-500/5',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'hover:border-emerald-400/50',
      glow: 'shadow-emerald-500/5',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'hover:border-rose-400/50',
      glow: 'shadow-rose-500/5',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-400/50',
      glow: 'shadow-amber-500/5',
    },
    sky: {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'hover:border-sky-400/50',
      glow: 'shadow-sky-500/5',
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'hover:border-purple-400/50',
      glow: 'shadow-purple-500/5',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${scheme.border} ${scheme.glow} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              <span className={trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {trend.value}
              </span>
              <span className="text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-2xl ${scheme.bg} ${scheme.text} shadow-inner`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Decorative subtle ambient gradient sphere */}
      <div
        className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${scheme.bg} blur-2xl pointer-events-none opacity-40`}
      />
    </div>
  );
};
