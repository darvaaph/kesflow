'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Heart, KeyRound, Mail, UserCheck } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { USER_NADIN_ID, USER_RAKA_ID } from '@/lib/mockData';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithEmailOrPin,
    loginWithGoogle,
    loginAsAccount,
    currentUser,
    isAuthenticated,
    profiles,
    isMockMode,
  } = useKesflow();

  const [mode, setMode] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !email.includes('@')) {
      setFormError('Masukkan alamat email yang valid (contoh: raka@kesflow.id).');
      return;
    }

    if (mode === 'pin' && pin.trim().length < 4) {
      setFormError('PIN harus terdiri dari minimal 4 angka.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithEmailOrPin(
        email,
        displayName,
        mode === 'pin' ? pin : undefined
      );
      if (isMockMode || res?.isInstantLogin) {
        router.push('/');
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal masuk ke akun.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
    <main className="min-h-dvh bg-warm-bg dark:bg-stone-950 px-4 py-8 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-md sm:max-w-lg space-y-5">
        <div className="space-y-1.5 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Masuk ke Kesflow
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Catat pengeluaran date berdua &amp; pantau saldo pasangan.
          </p>
        </div>

        {/* Pilihan Akun Pasangan (Hanya Tampil Saat Mode Simulasi / Mock Lokal) */}
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
              <strong>{nadinProfile.display_name}</strong> untuk melihat saldo dan
              mencatat pengeluaran dari masing-masing HP:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { profile: rakaProfile, tone: 'coral' as const, roleLabel: 'Pasangan 1' },
                { profile: nadinProfile, tone: 'stone' as const, roleLabel: 'Pasangan 2' },
              ].map(({ profile, tone, roleLabel }) => {
                const isActive =
                  isAuthenticated && currentUser?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleQuickAccountLogin(profile.id)}
                    className={`flex min-h-[64px] items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                      isActive
                        ? 'border-orange-700 bg-orange-50/90 dark:border-orange-500 dark:bg-orange-950/50'
                        : 'border-stone-300 bg-white hover:border-orange-400 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={profile.display_name}
                        size="md"
                        tone={tone}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          Masuk sbg {profile.display_name}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-400">
                          {profile.email} ({roleLabel})
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

        {/* Form Login Asli */}
        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Masuk ke Akun Kencan
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Masuk dengan 1-klik akun Google atau gunakan Email &amp; PIN.
            </p>
          </div>

          {/* Tombol Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 shadow-sm transition-all hover:bg-stone-50 active:scale-[0.99] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:opacity-60"
          >
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
            <span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}</span>
          </button>

          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            <span className="absolute bg-white px-2.5 text-[11px] font-medium text-stone-500 dark:bg-stone-950 dark:text-stone-400">
              atau dengan Email &amp; PIN
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Metode masuk"
            className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'email'}
              onClick={() => setMode('email')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                mode === 'email'
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Magic Link</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'pin'}
              onClick={() => setMode('pin')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                mode === 'pin'
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Email &amp; PIN</span>
            </button>
          </div>

          {magicLinkSent ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 space-y-2">
              <p className="font-semibold">Tautan masuk telah dikirim!</p>
              <p className="text-xs">
                Periksa kotak masuk <strong>{email}</strong> dan ketuk tautan
                untuk masuk ke Space date kamu.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setMagicLinkSent(false)}
              >
                Gunakan email lain
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              <Input
                label="Nama Panggilanmu"
                placeholder="Contoh: Raka atau Nadin"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="given-name"
              />

              <Input
                label="Alamat Email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              {mode === 'pin' && (
                <Input
                  label="PIN Keamanan (4-6 Angka)"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Masukkan 4-6 digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              )}

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                >
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                variant="outline"
                fullWidth
                size="md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses akses...' : 'Masuk dengan Email Ini'}
              </Button>
            </form>
          )}

          <div className="border-t border-stone-200 pt-3 dark:border-stone-800 text-center">
            <Link
              href="/onboarding"
              className="inline-flex min-h-[44px] items-center justify-center text-xs font-semibold text-orange-800 hover:underline dark:text-orange-300"
            >
              Mau bikin Space baru atau gabung pakai kode 6 huruf? Klik di sini
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
