import React from 'react';

// Small, dependency-free Tailwind UI primitives shared across pages.

export const Card = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
  >
    {children}
  </div>
);

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60',
    ghost:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const fieldCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-brand-500/20';

export const Input = ({ label, className = '', ...props }) => (
  <label className="block">
    {label && <span className={labelCls}>{label}</span>}
    <input className={`${fieldCls} ${className}`} {...props} />
  </label>
);

export const Textarea = ({ label, className = '', ...props }) => (
  <label className="block">
    {label && <span className={labelCls}>{label}</span>}
    <textarea className={`${fieldCls} ${className}`} {...props} />
  </label>
);

export const Select = ({ label, className = '', children, ...props }) => (
  <label className="block">
    {label && <span className={labelCls}>{label}</span>}
    <select className={`${fieldCls} ${className}`} {...props}>
      {children}
    </select>
  </label>
);

// Application pipeline + registration statuses.
const STATUS_STYLES = {
  applied: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  shortlisted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  interview: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  offered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  pending: 'bg-amber-100 text-amber-700',
};

export const Pill = ({ children, tone = 'slate', className = '' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
    ...STATUS_STYLES,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        tones[tone] || tones.slate
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const StatCard = ({ label, value, accent = 'text-brand-600' }) => (
  <Card className="p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
  </Card>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          active === t.key
            ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-950 dark:text-brand-400'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        {t.label}
        {t.count != null && (
          <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-xs dark:bg-slate-700">
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

export const statusLabel = (s) =>
  ({
    applied: 'Applied',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offered: 'Offer 🎉',
    rejected: 'Not selected',
  }[s] || s);

// Colour a 0-100 match score: green (strong) → amber → rose (weak).
export const scoreTone = (score) =>
  score >= 75
    ? 'text-emerald-600'
    : score >= 50
    ? 'text-amber-600'
    : 'text-rose-600';

export const MatchBadge = ({ score }) => (
  <div className="flex flex-col items-center">
    <span className={`text-2xl font-extrabold ${scoreTone(score)}`}>{score}</span>
    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
      match
    </span>
  </div>
);

export const Empty = ({ children }) => (
  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
    {children}
  </div>
);
