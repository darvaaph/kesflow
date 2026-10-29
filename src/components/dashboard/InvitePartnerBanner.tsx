'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, HeartHandshake, Share2 } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { Button } from '@/components/ui/Button';
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
      className="border-orange-300 bg-gradient-to-br from-orange-50/90 via-warm-surface to-rose-50/60 p-5 dark:border-orange-800 dark:from-orange-950/40 dark:via-stone-900 dark:to-stone-900 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300 shrink-0">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Undang Pasanganmu
              </h2>
              <Badge variant="coral">1 dari 2 Orang</Badge>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              Ruang kencan ini baru ada kamu. Bagikan kode untuk terhubung berdua.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-orange-300 bg-white/80 p-3.5 dark:border-orange-800 dark:bg-stone-900/80">
        <div className="text-center sm:text-left">
          <span className="block text-[11px] font-medium text-stone-500 dark:text-stone-400">
            KODE UNDANGAN RUANG
          </span>
          <span className="font-mono text-2xl font-black tracking-widest text-orange-900 dark:text-orange-200">
            {inviteCode}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1 sm:flex-none gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Salin Kode</span>
              </>
            )}
          </Button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <Share2 className="h-4 w-4" />
            <span>Kirim WA</span>
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
        <span>Pasanganmu sudah buat ruang duluan?</span>
        <Link
          href="/onboarding"
          className="font-bold text-orange-700 hover:text-orange-800 dark:text-orange-400 underline underline-offset-2"
        >
          Gabung pakai kodenya &rarr;
        </Link>
      </div>
    </Card>
  );
}
