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
      <section
        aria-label="Panduan memasang Kesflow di iPhone"
        className="relative rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50/95 via-white to-amber-50/80 p-4 shadow-sm dark:border-orange-900/50 dark:from-stone-900 dark:via-stone-900 dark:to-orange-950/30"
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup panduan instalasi iOS"
          className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-stone-400 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:hover:text-stone-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pr-9">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-stone-900 dark:text-stone-100">
              Pasang Kesflow di iPhone
            </p>
            <p className="mt-0.5 text-xs leading-snug text-stone-600 dark:text-stone-300">
              Dapat notifikasi Lock Screen saat pasanganmu catat bill.
            </p>
          </div>
        </div>

        <ol className="mt-3 space-y-1.5 text-xs font-medium text-stone-800 dark:text-stone-200">
          <li className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-800">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
              1
            </span>
            <span className="flex-1">
              Ketuk tombol <b>Bagikan</b> di Safari
            </span>
            <Share className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          </li>
          <li className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-800">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
              2
            </span>
            <span className="flex-1">
              Pilih <b>Tambah ke Layar Utama</b>
            </span>
            <PlusSquare className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
          </li>
        </ol>
      </section>
    </div>
  );
}
