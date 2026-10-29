'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Copy,
  History,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRelativeDate } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ActivityMutationSheet } from '@/components/transactions/ActivityMutationSheet';

export default function SettingsPage() {
  const router = useRouter();
  const {
    space,
    profiles,
    currentUser,
    activityLogs,
    loginAsAccount,
    resetDemoData,
    logout,
  } = useKesflow();

  const [copied, setCopied] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [isMutationOpen, setIsMutationOpen] = useState(false);

  const inviteCode = space?.invite_code || 'LOVE24';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleResetData = () => {
    resetDemoData();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Setelan Space
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Kelola akun pasangan, invite code Space, dan instalasi PWA.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Anggota Pasangan ({Math.min(profiles.length, 2)}/2)
            </h2>
          </div>
          <Badge variant="coral">Khusus 2 Orang</Badge>
        </div>

        <div className="space-y-2.5">
          {profiles.slice(0, 2).map((profile, idx) => {
            const isCurrent = profile.id === currentUser?.id;
            return (
              <div
                key={profile.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={profile.display_name}
                    size="sm"
                    tone={idx === 0 ? 'coral' : 'stone'}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {profile.display_name}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {profile.email}
                    </p>
                  </div>
                </div>
                {isCurrent ? (
                  <Badge variant="emerald">Sedang Login</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loginAsAccount(profile.id)}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Masuk sbg {profile.display_name}</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50/60 p-3.5 dark:border-orange-800 dark:bg-orange-950/30 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Invite Code ({space?.name || 'Ruang Kencan'})
            </p>
            <p className="font-mono text-lg font-extrabold tracking-widest text-orange-900 dark:text-orange-200">
              {inviteCode}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-700" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Salin Kode</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Aktivitas
            </h2>
          </div>
          <Badge variant="neutral">{activityLogs.length} Catatan</Badge>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          Pantau siapa yang mencatat, mengedit, menghapus pengeluaran, atau
          nyicil Settle Up saldo.
        </p>

        {activityLogs.length > 0 && (
          <div className="space-y-2">
            {activityLogs.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-800 dark:bg-stone-950 space-y-1"
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    Oleh {log.actor_name} &middot; {log.title}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 whitespace-nowrap">
                    {formatRelativeDate(log.created_at)}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-snug break-words">
                  {log.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => setIsMutationOpen(true)}
        >
          <History className="h-4 w-4 text-orange-700 dark:text-orange-400" />
          <span>Buka Semua Aktivitas ({activityLogs.length})</span>
        </Button>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Pasang Aplikasi di HP (PWA Standalone)
          </h2>
        </div>
        <ul className="space-y-2 text-xs text-stone-700 dark:text-stone-300 list-disc pl-4 leading-relaxed">
          <li>
            <strong>iPhone (Safari iOS):</strong> Ketuk tombol{' '}
            <strong>Bagikan (Share)</strong> di bagian bawah browser Safari, lalu
            pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
          </li>
          <li>
            <strong>Android (Google Chrome):</strong> Ketuk menu titik tiga di
            pojok kanan atas Chrome, lalu pilih{' '}
            <strong>Instal Aplikasi (Install App)</strong>.
          </li>
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Space &amp; Akun
          </h2>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => router.push('/onboarding')}
          >
            Bikin Space Baru / Gabung Pakai Kode
          </Button>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleResetData}
          >
            <RotateCcw className="h-4 w-4" />
            <span>
              {resetDone
                ? 'Data Awal Berhasil Dipulihkan!'
                : 'Reset ke Data Awal Pasangan'}
            </span>
          </Button>

          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar / Pindah Akun di Halaman Login</span>
          </Button>
        </div>
      </Card>

      <ActivityMutationSheet
        isOpen={isMutationOpen}
        onClose={() => setIsMutationOpen(false)}
      />
    </div>
  );
}
