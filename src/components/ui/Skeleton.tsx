'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-xl bg-stone-200/80 dark:bg-stone-800/80',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton khusus halaman Beranda (/)
 * Mencerminkan susunan: BalanceCard + QuickPresets + TransactionList
 */
export function DashboardPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-fadeIn"
      aria-busy="true"
      aria-label="Memuat beranda..."
    >
      {/* 1. BalanceCard Skeleton */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-52" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>

      {/* 2. QuickPresets Skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-36" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* 3. TransactionList Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 max-w-[180px]" />
                  <Skeleton className="h-3 w-1/2 max-w-[120px]" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton khusus halaman Album & Acara Kencan (/events)
 * Mencerminkan susunan: Header + Info Tip + List Kartu Album + Detail Transaksi Album
 */
export function EventsPageSkeleton() {
  return (
    <div
      className="space-y-5 animate-fadeIn"
      aria-busy="true"
      aria-label="Memuat album kencan..."
    >
      {/* 1. Header & Tombol Buat Album */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg shrink-0" />
      </div>

      {/* 2. Info Box Tip */}
      <div className="flex items-start gap-2.5 rounded-xl border border-stone-200/80 bg-stone-100/70 p-3.5 dark:border-stone-800 dark:bg-stone-900/60">
        <Skeleton className="h-4 w-4 shrink-0 rounded-full mt-0.5" />
        <Skeleton className="h-4 flex-1" />
      </div>

      {/* 3. List Kartu Album (2 kartu contoh) */}
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-stone-200/90 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-40" />
                  {i === 0 && <Skeleton className="h-5 w-28 rounded-full" />}
                </div>
                <Skeleton className="h-3.5 w-48" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-3 w-16 ml-auto" />
                <Skeleton className="h-5 w-24 ml-auto" />
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center justify-between gap-2 border-t border-stone-200/70 pt-3 dark:border-stone-800">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Section Rincian Transaksi Album */}
      <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton khusus halaman Statistik (/stats)
 * Mencerminkan susunan: Header + Total Expense Card + Category Breakdown Pie + Contribution Ratio
 */
export function StatsPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-fadeIn"
      aria-busy="true"
      aria-label="Memuat statistik..."
    >
      {/* 1. Header */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>

      {/* 2. Total Pengeluaran Bersama Card */}
      <div className="rounded-2xl border border-orange-200/90 bg-warm-peach/60 p-5 dark:border-stone-800 dark:bg-stone-900 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-8 w-44" />
        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* 3. Category Pie Chart Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
          {/* Circular Chart Placeholder */}
          <Skeleton className="h-32 w-32 rounded-full shrink-0" />
          {/* Category breakdown bars */}
          <div className="flex-1 w-full space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Contribution Ratio Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 space-y-3.5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-3 w-20 ml-auto" />
            <Skeleton className="h-5 w-24 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton khusus halaman Pengaturan (/settings)
 * Mencerminkan susunan: Header + Kartu Pasangan + Kartu Buku Mutasi + PWA Card + Actions
 */
export function SettingsPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-fadeIn"
      aria-busy="true"
      aria-label="Memuat pengaturan..."
    >
      {/* 1. Header */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>

      {/* 2. Kartu Pasangan (2 user rows + invite code) */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
        {/* Invite code box */}
        <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50/60 p-3.5 dark:border-orange-800 dark:bg-orange-950/30 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* 3. Kartu Buku Mutasi & Log Aktivitas */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 space-y-3.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-3/4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-800 dark:bg-stone-950 space-y-1"
            >
              <div className="flex justify-between">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      {/* 4. Tindakan Ruang & Akun */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Mengembalikan Skeleton yang sesuai persis dengan rute tujuan
 */
export function getSkeletonForPath(path: string | null) {
  if (!path) return <DashboardPageSkeleton />;
  if (path.startsWith('/events')) return <EventsPageSkeleton />;
  if (path.startsWith('/stats')) return <StatsPageSkeleton />;
  if (path.startsWith('/settings')) return <SettingsPageSkeleton />;
  return <DashboardPageSkeleton />;
}
