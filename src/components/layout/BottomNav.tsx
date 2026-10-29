'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarHeart,
  Home,
  PieChart,
  Plus,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/context/NavigationContext';

export interface BottomNavProps {
  onOpenAddTransaction: () => void;
}

export function BottomNav({ onOpenAddTransaction }: BottomNavProps) {
  const pathname = usePathname();
  const { targetPath, startNavigation } = useNavigation();

  const navItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/events', label: 'Album', icon: CalendarHeart },
    { href: '/stats', label: 'Statistik', icon: PieChart },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/95 bottom-nav-safe"
    >
      <div className="mx-auto grid max-w-md sm:max-w-lg md:max-w-xl grid-cols-5 items-center gap-1 px-2 py-1.5">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isTarget = targetPath === item.href;
          const isActive = (targetPath ?? pathname) === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => startNavigation(item.href)}
              className={cn(
                'flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1 text-xs font-medium transition-all duration-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600',
                isActive
                  ? 'text-orange-700 font-bold dark:text-orange-400'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-150',
                  isTarget && 'animate-pulse scale-110'
                )}
              />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenAddTransaction}
            aria-label="Catat pengeluaran kencan baru"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl bg-orange-700 px-3.5 py-2.5 text-white shadow-warm hover:bg-orange-800 active:bg-orange-900 active:scale-95 transition-all duration-100 dark:bg-orange-600 dark:hover:bg-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isTarget = targetPath === item.href;
          const isActive = (targetPath ?? pathname) === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => startNavigation(item.href)}
              className={cn(
                'flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1 text-xs font-medium transition-all duration-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600',
                isActive
                  ? 'text-orange-700 font-bold dark:text-orange-400'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-150',
                  isTarget && 'animate-pulse scale-110'
                )}
              />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
