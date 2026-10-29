'use client';

import React, { useEffect } from 'react';
import { BellRing, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { cn } from '@/lib/utils';

export function LiveToastBanner() {
  const { liveNotification, dismissLiveNotification } = useKesflow();

  useEffect(() => {
    if (!liveNotification) return;
    const timer = setTimeout(() => {
      dismissLiveNotification();
    }, 4500);
    return () => clearTimeout(timer);
  }, [liveNotification, dismissLiveNotification]);

  if (!liveNotification) return null;

  const isSettlement = liveNotification.tone === 'emerald';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-0 left-0 right-0 z-50 flex justify-center px-3 pt-safe"
    >
      <div
        className={cn(
          'pointer-events-auto mt-2 flex w-full max-w-sm items-center justify-between gap-3 rounded-full border px-4 py-2.5 shadow-[0_14px_35px_-5px_rgba(0,0,0,0.28)] backdrop-blur-xl motion-safe:animate-modal-in',
          isSettlement
            ? 'border-emerald-500/40 bg-stone-950/90 text-white dark:border-emerald-400/30 dark:bg-stone-900/95'
            : 'border-orange-500/40 bg-stone-950/90 text-white dark:border-orange-400/30 dark:bg-stone-900/95'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              isSettlement
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-orange-500/20 text-orange-400'
            )}
          >
            {isSettlement ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <BellRing className="h-4 w-4 animate-bounce" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate text-xs font-bold tracking-tight text-white">
                {liveNotification.title}
              </p>
              <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
            </div>
            <p className="truncate text-[11px] text-stone-300">
              {liveNotification.body}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissLiveNotification}
          aria-label="Tutup notifikasi"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
