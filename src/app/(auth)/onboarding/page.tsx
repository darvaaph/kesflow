'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, HeartHandshake, Sparkles, UserPlus } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function OnboardingPage() {
  const router = useRouter();
  const {
    createCoupleSpace,
    joinCoupleSpace,
    space,
    members,
    currentUser,
  } = useKesflow();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [spaceName, setSpaceName] = useState('Kencan Kita');
  const [nickname, setNickname] = useState(currentUser?.display_name || '');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nickname.trim()) {
      setErrorMsg('Masukkan panggilan sayang atau namamu terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { inviteCode } = await createCoupleSpace(spaceName, nickname);
      setGeneratedCode(inviteCode);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal membuat ruang kencan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (inviteCodeInput.trim().length !== 6) {
      setErrorMsg('Kode undangan pasangan wajib terdiri dari 6 karakter.');
      return;
    }

    if (!nickname.trim()) {
      setErrorMsg('Masukkan panggilan sayang atau namamu terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      await joinCoupleSpace(inviteCodeInput, nickname);
      router.push('/');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal bergabung ke ruang pasangan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <main className="min-h-screen bg-warm-bg dark:bg-stone-950 px-4 py-8 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Badge variant="coral" className="mx-auto">
            Khusus Pasangan (Maksimal 2 Orang)
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Siapkan Couple Space Kalian
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Buat ruang kencan privat baru atau masukkan 6 huruf kode dari
            pasanganmu.
          </p>
        </div>

        <Card elevated className="space-y-5 p-6">
          <div
            role="tablist"
            aria-label="Pilihan Couple Space"
            className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'create'}
              onClick={() => {
                setTab('create');
                setErrorMsg(null);
              }}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                tab === 'create'
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Buat Ruang Baru</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'join'}
              onClick={() => {
                setTab('join');
                setErrorMsg(null);
              }}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                tab === 'join'
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Gabung Kode</span>
            </button>
          </div>

          {tab === 'create' ? (
            generatedCode ? (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Ruang Kencan Siap!
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Bagikan kode 6 karakter di bawah ini ke pasanganmu agar
                    kalian terhubung:
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/70 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/40">
                  <span className="font-mono text-2xl font-extrabold tracking-widest text-orange-900 dark:text-orange-200">
                    {generatedCode}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCode(generatedCode)}
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

                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  onClick={() => router.push('/')}
                >
                  Masuk ke Beranda Kencan
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateSpace} className="space-y-4" noValidate>
                <Input
                  label="Nama Ruang Kencan"
                  placeholder="Contoh: Kencan Kita"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  required
                />
                <Input
                  label="Panggilanmu di Ruang Ini"
                  placeholder="Contoh: Raka / Ayang"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />

                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                  >
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Membuat kode unik...'
                    : 'Buat Ruang & Dapatkan Kode'}
                </Button>
              </form>
            )
          ) : (
            <form onSubmit={handleJoinSpace} className="space-y-4" noValidate>
              <Input
                label="Kode Undangan 6 Karakter"
                placeholder="Contoh: LOVE24"
                maxLength={6}
                value={inviteCodeInput}
                onChange={(e) =>
                  setInviteCodeInput(e.target.value.toUpperCase())
                }
                helperText={`Masukkan 6 huruf/angka dari pasanganmu (contoh ruang aktif: ${
                  space?.invite_code || 'LOVE24'
                }).`}
                className="font-mono uppercase tracking-widest text-lg"
                required
              />
              <Input
                label="Panggilanmu di Ruang Ini"
                placeholder="Contoh: Nadia / Sayang"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                >
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memverifikasi kode...' : 'Gabung ke Ruang Pasangan'}
              </Button>
            </form>
          )}

          <div className="border-t border-stone-200 pt-3 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span>Kapasitas anggota ruang saat ini:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-200">
              {Math.min(members.length, 2)} / 2 Anggota Pasangan
            </span>
          </div>
        </Card>
      </div>
    </main>
  );
}
