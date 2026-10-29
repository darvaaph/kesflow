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
  isAddOpen?: boolean;
}

export function BottomNav({
  onOpenAddTransaction,
  isAddOpen = false,
}: BottomNavProps) {
  const pathname = usePathname();
  const { targetPath, startNavigation } = useNavigation();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Momen', icon: CalendarHeart },
    { href: '/stats', label: 'Stats', icon: PieChart },
    { href: '/settings', label: 'Setelan', icon: Settings },
  ];

  const renderTab = (item: (typeof navItems)[number]) => {
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
          'group relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-medium transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600',
          isActive
            ? 'text-orange-700 font-bold dark:text-orange-400'
            : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
        )}
      >
        <div
          className={cn(
            'relative flex h-7 w-10 items-center justify-center rounded-full transition-all duration-200',
            isActive &&
              'bg-orange-100/80 dark:bg-orange-950/70'
          )}
        >
          <Icon
            className={cn(
              'h-[19px] w-[19px] transition-transform duration-200',
              isActive && 'scale-105 stroke-[2.4]',
              isTarget && 'animate-pulse scale-110'
            )}
          />
        </div>
        <span className="whitespace-nowrap leading-tight tracking-tight">
          {item.label}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'h-1 rounded-full bg-orange-600 dark:bg-orange-400 transition-all duration-200',
            isActive ? 'w-3.5 opacity-100' : 'w-0 opacity-0'
          )}
        />
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 bottom-nav-safe"
    >
      <div className="pointer-events-auto mx-auto grid max-w-md sm:max-w-lg md:max-w-xl grid-cols-5 items-center gap-1 rounded-[28px] border border-stone-200/80 bg-white/85 px-2.5 py-1.5 shadow-[0_10px_35px_-5px_rgba(28,25,23,0.14)] backdrop-blur-xl dark:border-stone-800/90 dark:bg-stone-900/85 dark:shadow-[0_12px_40px_-5px_rgba(0,0,0,0.55)]">
        {navItems.slice(0, 2).map(renderTab)}

        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenAddTransaction}
            aria-label="Catat pengeluaran date baru"
            className="group relative -mt-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white shadow-[0_8px_22px_-3px_rgba(234,88,12,0.55)] ring-4 ring-warm-bg dark:ring-stone-950 hover:from-orange-600 hover:to-orange-800 active:scale-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
          >
            <Plus
              className={cn(
                'h-6 w-6 stroke-[2.6] transition-transform duration-200 group-hover:rotate-90',
                isAddOpen && 'rotate-45'
              )}
            />
          </button>
        </div>

        {navItems.slice(2, 4).map(renderTab)}
      </div>
    </nav>
  );
}
