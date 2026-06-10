'use client';

import React from 'react';

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Card({ className = '', children }) {
  return <div className={cx('rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-soft backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80', className)}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="space-y-1">
      {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{eyebrow}</div> : null}
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {subtitle ? <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}

export function Input(props) {
  return <input {...props} className={cx('w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100', props.className)} />;
}

export function Select(props) {
  return <select {...props} className={cx('w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100', props.className)} />;
}

export function Textarea(props) {
  return <textarea {...props} className={cx('w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100', props.className)} />;
}

export function Button({ className = '', variant = 'primary', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
    ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  return <button {...props} className={cx(base, variants[variant] || variants.primary, className)} />;
}

export function Badge({ children, tone = 'gray', className = '' }) {
  const tones = {
    gray: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  };
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', tones[tone] || tones.gray, className)}>{children}</span>;
}

export function Modal({ open, title, subtitle, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-950">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
            {subtitle ? <div className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</div> : null}
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="max-h-[80vh] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
      {subtitle ? <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
