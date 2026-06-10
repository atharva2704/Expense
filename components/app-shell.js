'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card } from './ui';
import { Bell, MoonStar, SunMedium, Menu } from 'lucide-react';
import { MobileNav } from './mobile-nav';
import React from 'react';

export function AppShell({ user, active = 'dashboard', unread = 0, children, onToggleTheme, theme = 'dark' }) {
  const router = useRouter();
  const nav = [
    { href: '/dashboard', label: 'Home' },
    { href: '/notifications', label: 'Notifications' },
    { href: '/reports', label: 'Reports' },
    { href: '/backup', label: 'Backup' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-black dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:flex-col border-b border-zinc-200 bg-white/90 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Expense Tracker Pro</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</div>
            </div>
            <div className="lg:hidden">
              <Menu className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onToggleTheme} className="justify-between">
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
              {theme === 'dark' ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
            </Button>
            <Link href="/notifications" className="relative flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
              <span>Alerts</span>
              <Bell className="h-4 w-4" />
              {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread}</span> : null}
            </Link>
          </div>

          <nav className="mt-5 space-y-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${active === item.href.replace('/', '') ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 rounded-3xl bg-zinc-100 p-4 dark:bg-zinc-900">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Workspace privacy</div>
            <div className="mt-2 text-sm font-medium">Your records stay isolated to your account and workspace.</div>
          </div>

          <Button
            variant="danger"
            className="mt-4 w-full"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
              router.push('/login');
              router.refresh();
            }}
          >
            Logout
          </Button>
        </aside>

        <main className="flex-1 p-3 pb-24 sm:p-5 lg:p-6">{children}</main>
      </div>
      <MobileNav unread={unread} />
    </div>
  );
}

export function ShellSection({ children, className = '' }) {
  return <Card className={`mb-4 ${className}`}>{children}</Card>;
}
