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
  Users,
  Pencil,
  AlertTriangle,
  UserMinus,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRelativeDate } from '@/lib/format';
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
  } = useKesflow();

  const [copied, setCopied] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isMutationOpen, setIsMutationOpen] = useState(false);
  
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
                  <div className="flex items-center gap-1.5">
                    <Badge variant="emerald">Sedang Login</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenEditNickname}
                      className="px-2.5 py-1 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5 text-stone-600 dark:text-stone-300" />
                      <span>Edit Nickname</span>
                    </Button>
                  </div>
                ) : (
                  isMockMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loginAsAccount(profile.id)}
                    >
                      Ganti Akun Demo
                    </Button>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Invite Code Box */}
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

      {/* Space & Akun Controls */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Space &amp; Akun
          </h2>
        </div>

        {isFullCouple ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-stone-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-stone-300">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              ✓ Ruang Kencan Aktif:
            </span>{' '}
            Anda dan {partnerUser?.display_name || 'Pasangan'} sudah terhubung berdua di ruang ini.
          </div>
        ) : (
          <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3 text-xs text-stone-700 dark:border-orange-900/60 dark:bg-orange-950/20 dark:text-stone-300 space-y-2">
            <p>
              <span className="font-bold text-orange-800 dark:text-orange-300">
                Menunggu Pasangan:
              </span>{' '}
              Ruang kencan ini baru ada Anda. Bagikan kode di atas ke pacar/pasanganmu.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => router.push('/onboarding')}
            >
              Pasangan sudah buat ruang duluan? Gabung kodenya di sini
            </Button>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          {/* Tombol Kosongkan Transaksi dengan Verifikasi */}
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => setIsConfirmResetOpen(true)}
            className="text-stone-700 hover:text-red-700 dark:text-stone-300 dark:hover:text-red-400"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Kosongkan Riwayat Transaksi (Reset ke Rp 0)</span>
          </Button>

          {/* Tombol Keluar dari Ruang */}
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => setIsConfirmLeaveOpen(true)}
            className="text-stone-700 hover:text-stone-900 dark:text-stone-300"
          >
            <UserMinus className="h-4 w-4" />
            <span>Keluar dari Ruang Kencan Ini</span>
          </Button>

          {/* Tombol Logout */}
          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={handleLogout}
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
