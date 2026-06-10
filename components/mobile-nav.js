'use client';

import Link from 'next/link';
import { Home, Bell, PlusCircle, BarChart3 } from 'lucide-react';

export function MobileNav({ unread = 0 }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
      <div className="grid grid-cols-4 py-2">
        <Link href="/dashboard" className="flex flex-col items-center text-xs">
          <Home className="h-5 w-5" />
          Home
        </Link>

        <button
          className="flex flex-col items-center text-xs"
          onClick={() => window.dispatchEvent(new Event('openQuickAdd'))}
        >
          <PlusCircle className="h-5 w-5" />
          Add
        </button>

        <Link href="/notifications" className="relative flex flex-col items-center text-xs">
          <Bell className="h-5 w-5" />
          Alerts

          {unread > 0 && (
            <span className="absolute right-6 top-0 rounded-full bg-red-500 px-1 text-[10px] text-white">
              {unread}
            </span>
          )}
        </Link>

        <Link href="/reports" className="flex flex-col items-center text-xs">
          <BarChart3 className="h-5 w-5" />
          Reports
        </Link>
      </div>
    </div>
  );
}