'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  Users2,
  Zap,
  UserCheck,
  Check,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { USER_NADIN_ID, USER_RAKA_ID } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithGoogle,
    loginAsAccount,
    currentUser,
    profiles,
    isMockMode,
    isLoading,
    isAuthenticated,
    space,
  } = useKesflow();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Jika sudah terautentikasi (misal setelah popup/redirect Google selesai),
  // otomatis arahkan ke dashboard atau onboarding tanpa perlu refresh manual.
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(space ? '/' : '/onboarding');
    }
  }, [isLoading, isAuthenticated, space, router]);

  const rakaProfile = profiles.find((p) => p.id === USER_RAKA_ID) || {
    id: USER_RAKA_ID,
    display_name: 'Raka',
    email: 'raka@kesflow.id',
  };
  const nadinProfile = profiles.find((p) => p.id === USER_NADIN_ID) || {
    id: USER_NADIN_ID,
    display_name: 'Nadin',
    email: 'nadin@kesflow.id',
  };

  const handleQuickAccountLogin = (userId: string) => {
    loginAsAccount(userId);
    router.push('/');
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      if (isMockMode) {
        router.push('/');
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menghubungkan ke akun Google.'
      );
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-warm-bg dark:bg-stone-950 px-4 py-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/20">
            <Heart className="h-7 w-7 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
            Kesflow
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xs mx-auto">
            Catat pengeluaran date berdua &amp; pantau saldo pasangan secara santai tanpa canggung.
          </p>
        </div>

        {/* Pilihan Akun Pasangan (Hanya Tampil Saat Mode Simulasi / Mock Lokal Offline) */}
        {isMockMode && (
          <Card elevated className="p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Pilih Akun Pasangan (Mode Uji Coba)
                </h2>
              </div>
              <Badge variant="coral">Space: LOVE24</Badge>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Pilih masuk sebagai <strong>{rakaProfile.display_name}</strong> atau{' '}
              <strong>{nadinProfile.display_name}</strong> untuk melihat simulasi:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { profile: rakaProfile, tone: 'coral' as const, roleLabel: 'Pasangan 1' },
                { profile: nadinProfile, tone: 'stone' as const, roleLabel: 'Pasangan 2' },
              ].map(({ profile, tone, roleLabel }) => {
                const isActive = currentUser?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleQuickAccountLogin(profile.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 active:scale-[0.98] ${
                      isActive
                        ? 'border-orange-600 bg-orange-50/90 shadow-sm dark:border-orange-500 dark:bg-orange-950/50'
                        : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={profile.display_name} tone={tone} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight text-stone-900 dark:text-stone-100 truncate">
                          Masuk sbg {profile.display_name}
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                          ({roleLabel})
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-700 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Card Login Utama Google */}
        <Card elevated className="p-6 sm:p-7 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Mulai Pakai Kesflow
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Masuk instan dengan akun Google Anda tanpa perlu mengingat kata sandi.
            </p>
          </div>

          {/* Tombol Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full min-h-[52px] inline-flex items-center justify-center gap-3 rounded-2xl border border-stone-300/90 bg-white px-5 py-3 text-sm font-bold text-stone-800 shadow-sm transition-all hover:bg-stone-50 hover:shadow-md hover:border-stone-400 active:scale-[0.99] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-850 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                <span>Menghubungkan ke Google...</span>
              </div>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Lanjutkan dengan Google</span>
              </>
            )}
          </button>

          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300 text-center"
            >
              {formError}
            </div>
          )}

          {/* Value Props / Keunggulan */}
          <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800/70 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-400">
              <Users2 className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>Khusus pasangan berdua (maksimal 2 orang)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-400">
              <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>Real-time sync otomatis ke HP masing-masing</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-400">
              <ShieldCheck className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>Privasi data kencan terjamin &amp; aman</span>
            </div>
          </div>

          <div className="pt-1 text-center">
            <Link
              href="/onboarding"
              className="inline-flex min-h-[44px] items-center justify-center text-xs font-semibold text-orange-800 hover:underline dark:text-orange-300"
            >
              Mau buat ruang baru atau gabung pakai kode 6 huruf? Klik di sini &rarr;
            </Link>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
          Kesflow PWA &middot; Catat santai, date tenang, hubungan makin lengket ♥
        </p>
      </div>
    </main>
  );
}
