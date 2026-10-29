'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Moon, Sun, UserPlus, Wifi, WifiOff } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { Avatar } from '@/components/ui/Avatar';

export function Header() {
  const { space, currentUser, partnerUser, isRealtimeConnected } = useKesflow();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('kesflow_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kesflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kesflow_theme', 'light');
    }
  };

  const myName = currentUser?.display_name || 'Kamu';
  const partnerName = partnerUser?.display_name || null;

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-warm-bg/95 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/95 pt-safe">
      <div className="mx-auto flex max-w-md sm:max-w-lg md:max-w-xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex -space-x-2 shrink-0">
            <Avatar name={myName} size="sm" tone="coral" />
            {partnerName ? (
              <Avatar name={partnerName} size="sm" tone="stone" />
            ) : (
              <div
                title="Menunggu pasangan bergabung"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-stone-400 bg-stone-100 text-stone-500 shadow-sm dark:border-stone-600 dark:bg-stone-900"
              >
                <UserPlus className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm font-bold leading-tight text-stone-900 dark:text-stone-100">
                {space?.name || (partnerName ? `${myName} & ${partnerName}` : `${myName} · Menunggu Pasangan`)}
              </h1>
              <Heart
                className="h-3.5 w-3.5 shrink-0 text-orange-700 dark:text-orange-400 fill-orange-700 dark:fill-orange-400"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
              {partnerName ? (
                <span>Aktif: {myName}</span>
              ) : (
                <span className="font-semibold text-orange-700 dark:text-orange-400">
                  Kode: {space?.invite_code || '...'}
                </span>
              )}
              <span aria-hidden="true">&middot;</span>
              <span className="inline-flex items-center gap-1">
                {isRealtimeConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                    <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                      Synced
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                    <span className="text-amber-800 dark:text-amber-300 font-medium">
                      Luring
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
