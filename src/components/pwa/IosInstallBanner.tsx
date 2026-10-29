'use client';

import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { isIosDevice, isRunningStandalone } from '@/lib/pushClient';

const DISMISS_STORAGE_KEY = 'kesflow_ios_install_banner_dismissed_v1';

export function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isIosDevice() || isRunningStandalone()) {
      setVisible(false);
      return;
    }
    try {
      const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissed === 'true') {
        setVisible(false);
        return;
      }
    } catch {
      // ignore storage errors
    }
    setVisible(true);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  };

  if (!visible) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-3">
      <div className="relative rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50/95 via-white to-amber-50/80 p-3.5 shadow-sm dark:border-orange-900/50 dark:from-stone-900 dark:via-stone-900 dark:to-orange-950/30">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup panduan instalasi iOS"
          className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-stone-900 dark:text-stone-100">
              Pasang Kesflow di iPhone kamu ✨
            </p>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              Biar berasa aplikasi native &amp; bisa dapat{' '}
              <strong>Notifikasi Lock Screen</strong> saat pasanganmu catat bill:
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-semibold text-stone-800 dark:text-stone-200">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 shadow-xs border border-stone-200 dark:bg-stone-800 dark:border-stone-700">
                1. Ketuk <Share className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Share
              </span>
              <span>&rarr;</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 shadow-xs border border-stone-200 dark:bg-stone-800 dark:border-stone-700">
                2. Pilih <PlusSquare className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /> Add to Home Screen
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
