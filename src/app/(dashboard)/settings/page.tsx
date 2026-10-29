'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronRight,
  Copy,
  History,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Users,
  Pencil,
  AlertTriangle,
  UserMinus,
  Bell,
  BellOff,
  Send,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRelativeDate } from '@/lib/format';
import { isIosDevice, isRunningStandalone, isWebPushSupported } from '@/lib/pushClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ActivityMutationSheet } from '@/components/transactions/ActivityMutationSheet';

export default function SettingsPage() {
  const router = useRouter();
  const {
    space,
    members,
    profiles,
    currentUser,
    partnerUser,
    activityLogs,
    isMockMode,
    loginAsAccount,
    updateNickname,
    clearSpaceTransactions,
    leaveCoupleSpace,
    logout,
    isPushSubscribed,
    pushPermission,
    enablePushNotifications,
    disablePushNotifications,
    sendTestPushNotification,
  } = useKesflow();

  const [copied, setCopied] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isMutationOpen, setIsMutationOpen] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);
  
  // Nickname sheet
  const [isEditNicknameOpen, setIsEditNicknameOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Confirm Reset Transactions Modal
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Confirm Leave Space Modal
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const inviteCode = space?.invite_code || 'LOVE24';
  const isFullCouple = members.length >= 2;

  const handleOpenEditNickname = () => {
    setNicknameInput(currentUser?.display_name || '');
    setNicknameError(null);
    setIsEditNicknameOpen(true);
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) {
      setNicknameError('Nickname tidak boleh kosong');
      return;
    }
    if (nicknameInput.trim().length > 20) {
      setNicknameError('Nickname maksimal 20 karakter');
      return;
    }
    setIsSavingNickname(true);
    setNicknameError(null);
    try {
      await updateNickname(nicknameInput.trim());
      setIsEditNicknameOpen(false);
    } catch (err) {
      setNicknameError(err instanceof Error ? err.message : 'Gagal menyimpan nickname');
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    setPushMessage(null);
    try {
      if (isPushSubscribed) {
        await disablePushNotifications();
        setPushMessage({ text: 'Notifikasi HP berhasil dimatikan.' });
      } else {
        const ok = await enablePushNotifications();
        setPushMessage({
          text: ok
            ? 'Notifikasi HP berhasil diaktifkan! ✨'
            : 'Gagal mengaktifkan notifikasi. Pastikan aplikasi sudah di-Add to Home Screen dan izin diberikan.',
          isError: !ok,
        });
      }
    } catch (err) {
      setPushMessage({
        text: err instanceof Error ? err.message : 'Gagal mengatur notifikasi.',
        isError: true,
      });
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setIsPushLoading(true);
    setPushMessage(null);
    try {
      await sendTestPushNotification();
      setPushMessage({
        text: 'Tes notifikasi dikirim! Cek banner di atas layar atau bar notifikasi HP kamu.',
      });
    } finally {
      setIsPushLoading(false);
    }
  };

  const isIosNonStandalone =
    typeof window !== 'undefined' && isIosDevice() && !isRunningStandalone();
  const webPushSupported =
    typeof window !== 'undefined' && isWebPushSupported();

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      await clearSpaceTransactions();
      setIsConfirmResetOpen(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Gagal mengosongkan transaksi');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmLeave = async () => {
    setIsLeaving(true);
    setLeaveError(null);
    try {
      await leaveCoupleSpace();
      setIsConfirmLeaveOpen(false);
      router.replace('/onboarding');
    } catch (err) {
      setLeaveError(err instanceof Error ? err.message : 'Gagal keluar dari ruang');
    } finally {
      setIsLeaving(false);
    }
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
          Kelola akun pasangan, invite code Space, dan riwayat transaksi.
        </p>
      </div>

      {resetSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          ✓ Seluruh riwayat transaksi date berhasil dikosongkan. Saldo kembali Rp 0!
        </div>
      )}

      {/* Anggota Pasangan Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Anggota Pasangan ({Math.min(members.length, 2)}/2)
            </h2>
          </div>
          <Badge variant={isFullCouple ? 'emerald' : 'coral'}>
            {isFullCouple ? 'Terhubung Berdua' : 'Menunggu Pasangan'}
          </Badge>
        </div>

        <div className="space-y-2.5">
          {profiles.slice(0, 2).map((profile, idx) => {
            const isCurrent = profile.id === currentUser?.id;
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={profile.display_name}
                    size="sm"
                    tone={idx === 0 ? 'coral' : 'stone'}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {profile.display_name}
                      </p>
                      {isCurrent && (
                        <button
                          type="button"
                          onClick={handleOpenEditNickname}
                          aria-label="Edit nickname"
                          title="Edit nickname"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                      {profile.email} {isCurrent && <span className="font-medium text-orange-700 dark:text-orange-400">&middot; Kamu</span>}
                    </p>
                  </div>
                </div>

                {!isCurrent && isMockMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loginAsAccount(profile.id)}
                    className="shrink-0 text-xs px-2.5 py-1"
                  >
                    Ganti Akun Demo
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Invite Code Box */}
        <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50/60 p-3.5 dark:border-orange-800 dark:bg-orange-950/30 flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Invite Code ({space?.name || 'Space Kita'})
            </p>
            <p className="font-mono text-xl font-extrabold tracking-widest text-orange-900 dark:text-orange-200">
              {inviteCode}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Bagikan kode ini ke pasanganmu untuk bergabung
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label={copied ? 'Kode tersalin' : 'Salin kode'}
            title={copied ? 'Tersalin!' : 'Salin kode'}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </Card>

      {/* Aktivitas Card */}
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

        {activityLogs.length > 0 ? (
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
        ) : (
          <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
            Belum ada aktivitas di ruang kencan ini. Catat pengeluaran date pertama kalian!
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

      {/* Notifikasi Pasangan (iOS & Android Push + Dynamic Island) */}
      <Card className="p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Notifikasi Pasangan (iOS &amp; Android)
            </h2>
          </div>
          {isPushSubscribed ? (
            <Badge variant="emerald">Push Aktif</Badge>
          ) : isIosNonStandalone ? (
            <Badge variant="coral">Wajib Add to Home Screen</Badge>
          ) : (
            <Badge variant="neutral">In-App Aktif</Badge>
          )}
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          Dapatkan notifikasi langsung ala <strong>Dynamic Island</strong> saat pasanganmu mencatat bill baru atau melakukan <strong>Settle Up</strong>, bahkan saat layar HP terkunci.
        </p>

        {isIosNonStandalone && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3 text-xs text-stone-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-stone-300 leading-relaxed">
            <strong className="text-orange-800 dark:text-orange-300">
              Info Pengguna iPhone (Safari iOS):
            </strong>{' '}
            Apple mewajibkan aplikasi dipasang dulu ke Home Screen (ketuk ikon{' '}
            <strong>Share</strong> &rarr; <strong>Add to Home Screen</strong>) agar notifikasi Lock Screen bisa diaktifkan.
          </div>
        )}

        {pushPermission === 'denied' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            Izin notifikasi diblokir di pengaturan browser/HP kamu. Silakan izinkan kembali melalui pengaturan situs.
          </div>
        )}

        {pushMessage && (
          <div
            className={`rounded-xl border p-3 text-xs font-medium ${
              pushMessage.isError
                ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            {pushMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <Button
            type="button"
            variant={isPushSubscribed ? 'outline' : 'primary'}
            fullWidth
            disabled={isPushLoading || (!webPushSupported && !isIosNonStandalone)}
            onClick={handleTogglePush}
          >
            {isPushSubscribed ? (
              <>
                <BellOff className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                <span>Matikan Notifikasi HP</span>
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                <span>Aktifkan Notifikasi HP</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={isPushLoading}
            onClick={handleTestPush}
          >
            <Send className="h-4 w-4 text-orange-700 dark:text-orange-400" />
            <span>Kirim Tes Notifikasi</span>
          </Button>
        </div>
      </Card>

      {/* PWA Install Guide */}
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

      {/* Space & Akun Controls: Clean, Gen-Z / Modern Action Rows */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Space &amp; Akun
          </h2>
        </div>

        {/* Status Koneksi Pasangan */}
        {isFullCouple ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-xs text-stone-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-stone-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
            <p className="leading-snug">
              <strong className="text-emerald-900 dark:text-emerald-300 font-semibold">
                Ruang Kencan Aktif:
              </strong>{' '}
              Kamu dan {partnerUser?.display_name || 'Pasangan'} sudah terhubung berdua.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-orange-200/90 bg-orange-50/50 p-3.5 text-xs text-stone-700 dark:border-orange-900/60 dark:bg-orange-950/20 dark:text-stone-300 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-orange-950 dark:text-orange-200">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <span>Menunggu Pasangan Bergabung</span>
            </div>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
              Bagikan kode unik di atas ke pacarmu untuk terhubung.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => router.push('/onboarding')}
                className="inline-flex items-center gap-1 font-bold text-orange-700 hover:text-orange-800 dark:text-orange-400 hover:underline"
              >
                <span>Pasangan sudah buat ruang duluan? Gabung kode &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* Menu Baris Pengaturan Ruang (Action Rows) */}
        <div className="divide-y divide-stone-100 dark:divide-stone-800/80 rounded-2xl border border-stone-200/80 bg-stone-50/40 dark:border-stone-800 dark:bg-stone-900/30 overflow-hidden">
          {/* Baris 1: Kosongkan Transaksi */}
          <button
            type="button"
            onClick={() => setIsConfirmResetOpen(true)}
            className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-stone-100/70 dark:hover:bg-stone-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 shrink-0">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  Reset Data Belanja
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  Kosongkan seluruh riwayat dan kembalikan saldo ke Rp 0
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
          </button>

          {/* Baris 2: Keluar Ruang Kencan */}
          <button
            type="button"
            onClick={() => setIsConfirmLeaveOpen(true)}
            className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-stone-100/70 dark:hover:bg-stone-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 shrink-0">
                <UserMinus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  Tinggalkan Space Ini
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  Keluar dari ruang kencan berdua saat ini
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
          </button>
        </div>

        {/* Tombol Logout: Bersih, Minimalis & Elegan */}
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleLogout}
            className="h-10 text-xs font-semibold text-stone-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50/50 dark:text-stone-400 dark:hover:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/20 transition-all gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar dari Akun (Logout)</span>
          </Button>
        </div>
      </Card>

      <ActivityMutationSheet
        isOpen={isMutationOpen}
        onClose={() => setIsMutationOpen(false)}
      />

      {/* Modal Edit Nickname */}
      <BottomSheet
        isOpen={isEditNicknameOpen}
        onClose={() => setIsEditNicknameOpen(false)}
        title="Ubah Nickname"
        description="Panggilan ini akan tampil di seluruh catatan belanja dan saldo bersama pasanganmu."
      >
        <form onSubmit={handleSaveNickname} className="space-y-4 pt-2">
          <Input
            label="Nickname / Nama Panggilan Baru"
            placeholder="Contoh: Sayang / Ayang"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            maxLength={20}
            helperText="Maksimal 20 karakter agar pas di tampilan aplikasi."
            required
            autoFocus
          />

          {nicknameError && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {nicknameError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditNicknameOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSavingNickname}>
              {isSavingNickname ? 'Menyimpan...' : 'Simpan Nickname'}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal Verifikasi / Konfirmasi Kosongkan Transaksi */}
      <BottomSheet
        isOpen={isConfirmResetOpen}
        onClose={() => !isResetting && setIsConfirmResetOpen(false)}
        title="Kosongkan Semua Transaksi?"
        description="Tindakan ini akan menghapus seluruh catatan belanja date berdua dan mengembalikan saldo hutang menjadi Rp 0."
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>Peringatan Penting:</span>
            </div>
            <p className="leading-relaxed">
              Akun Anda dan pasangan Anda <strong>tetap saling terhubung</strong>. Hanya seluruh daftar belanja, struk, dan riwayat pelunasan yang akan dihapus bersih.
            </p>
          </div>

          {resetError && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {resetError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isResetting}
              onClick={() => setIsConfirmResetOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isResetting}
              onClick={handleConfirmReset}
            >
              {isResetting ? 'Mengosongkan...' : 'Ya, Kosongkan Transaksi'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Modal Verifikasi / Konfirmasi Keluar dari Ruang */}
      <BottomSheet
        isOpen={isConfirmLeaveOpen}
        onClose={() => !isLeaving && setIsConfirmLeaveOpen(false)}
        title="Keluar dari Ruang Kencan?"
        description="Anda akan terputus dari ruang bersama ini dan diarahkan ke halaman onboarding."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Jika Anda keluar, Anda tidak dapat lagi melihat atau mencatat transaksi di ruang ini, kecuali Anda diundang kembali menggunakan kode 6 karakter.
          </p>

          {leaveError && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {leaveError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isLeaving}
              onClick={() => setIsConfirmLeaveOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isLeaving}
              onClick={handleConfirmLeave}
            >
              {isLeaving ? 'Memproses...' : 'Ya, Keluar dari Ruang'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
