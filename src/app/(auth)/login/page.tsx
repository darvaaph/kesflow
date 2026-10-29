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

        {/* Pilihan Akun Pasangan untuk Testing Realistis */}
        <Card elevated className="p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-orange-700 dark:text-orange-400" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Pilih Akun Pasangan
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

        {/* Form Login Email / PIN Manual */}
        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Atau Masuk dengan Email &amp; PIN
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Gunakan alamat email pribadimu untuk masuk atau daftar akun baru.
            </p>
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
