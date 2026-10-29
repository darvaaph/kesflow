'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, HeartHandshake, Share2 } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function InvitePartnerBanner() {
  const { space, partnerUser } = useKesflow();
  const [copied, setCopied] = useState(false);

  // Jika belum ada space atau pasangan sudah bergabung, jangan tampilkan banner ini
  if (!space || partnerUser) {
    return null;
  }

  const inviteCode = space.invite_code || '';
  const shareText = `Halo sayang! Yuk gabung ke ruang kencan kita di Kesflow untuk catat pengeluaran bareng:\n\n1. Buka https://kesflow.vercel.app\n2. Masuk dan pilih "Gabung Kode"\n3. Masukkan kode ruang kita: ${inviteCode}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Card
      elevated
      className="border-orange-200/80 bg-gradient-to-br from-orange-50/80 via-warm-surface to-rose-50/50 p-4 sm:p-5 dark:border-stone-800 dark:from-orange-950/30 dark:via-stone-900 dark:to-stone-900 space-y-3.5"
    >
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300 shrink-0">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                Undang Pasanganmu
              </h2>
              <Badge variant="coral" className="text-[10px] py-0 px-1.5 shrink-0">
                1 dari 2 Orang
              </Badge>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-1">
              Ruang kencan ini baru ada kamu. Bagikan kode untuk terhubung.
            </p>
          </div>
        </div>
      </div>

      {/* Kotak Kode Undangan: Tetap 1 Baris Horizontal di HP */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-orange-200/90 bg-white/90 p-2.5 sm:p-3 dark:border-stone-800 dark:bg-stone-900/90 shadow-sm">
        {/* Tombol Tap-to-Copy Kode + Icon */}
        <button
          type="button"
          onClick={handleCopy}
          title="Klik untuk salin kode"
          className="flex items-center gap-2 group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded-xl px-2 py-1 -ml-1 transition-colors hover:bg-orange-50/80 dark:hover:bg-stone-800/80"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Kode Ruang
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-orange-950 dark:text-orange-200">
              {inviteCode}
            </span>
          </div>

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all shrink-0 ${
              copied
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-stone-200 bg-stone-50 text-stone-600 group-hover:border-orange-400 group-hover:text-orange-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
            }`}
            title={copied ? 'Kode tersalin!' : 'Salin kode'}
            aria-label={copied ? 'Kode tersalin' : 'Salin kode ke papan klip'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* Tombol Utama Kirim WA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-3.5 sm:px-4 text-xs font-bold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 shrink-0"
        >
          <Share2 className="h-4 w-4" />
          <span>Kirim WA</span>
        </a>
      </div>

      {/* Footer Navigasi Bawah */}
      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
        <span className="truncate pr-2">Pasanganmu sudah buat ruang duluan?</span>
        <Link
          href="/onboarding"
          className="font-bold text-orange-700 hover:text-orange-800 dark:text-orange-400 whitespace-nowrap hover:underline"
        >
          Gabung kode &rarr;
        </Link>
      </div>
    </Card>
  );
}
