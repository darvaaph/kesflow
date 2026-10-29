'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, HandHeart } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatNumberInput, formatRupiah, parseNumberInput } from '@/lib/format';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettleUpModal({ isOpen, onClose }: SettleUpModalProps) {
  const {
    netBalanceForCurrentUser,
    currentUser,
    partnerUser,
    settleUpBalance,
  } = useKesflow();

  const myName = currentUser?.display_name || 'Raka';
  const partnerName = partnerUser?.display_name || 'Nadin';

  const absAmount = Math.abs(netBalanceForCurrentUser);
  const payerName = netBalanceForCurrentUser > 0 ? partnerName : myName;
  const receiverName = netBalanceForCurrentUser > 0 ? myName : partnerName;

  const [settleMode, setSettleMode] = useState<'full' | 'partial'>('full');
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settledResult, setSettledResult] = useState<{
    paid: number;
    remaining: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettleMode('full');
      setAmountInput(formatNumberInput(absAmount));
      setNotes('');
      setFormError(null);
      setSettledResult(null);
    }
  }, [isOpen, absAmount]);

  const numericInputAmount =
    settleMode === 'full' ? absAmount : parseNumberInput(amountInput);
  const clampedPaid = Math.min(Math.max(0, numericInputAmount), absAmount);
  const remainingAfterPay = Math.max(0, absAmount - clampedPaid);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignore in headless environments without canvas support
    }
  };

  const handleSelectMode = (mode: 'full' | 'partial') => {
    setSettleMode(mode);
    setFormError(null);
    if (mode === 'full') {
      setAmountInput(formatNumberInput(absAmount));
    } else {
      // Default ke 50% dari total tanggungan saat pilih Cicil / Sebagian
      const half = Math.max(1000, Math.round(absAmount / 2));
      setAmountInput(formatNumberInput(Math.min(half, absAmount)));
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (numericInputAmount <= 0) {
      setFormError('Masukkan nominal pembayaran lebih dari Rp 0.');
      return;
    }

    if (numericInputAmount > absAmount) {
      setFormError(
        `Nominal tidak boleh melebihi total utang (${formatRupiah(absAmount)}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const defaultNote =
        remainingAfterPay === 0
          ? 'Settle up penuh saldo date'
          : `Cicilan settle up (${formatRupiah(clampedPaid)} dari ${formatRupiah(absAmount)})`;

      await settleUpBalance(notes.trim() || defaultNote, clampedPaid);
      triggerConfetti();
      setSettledResult({
        paid: clampedPaid,
        remaining: remainingAfterPay,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal mencatat settle up.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Up Saldo"
      description="Bayar penuh sampai Rp 0 atau catat cicilan sebagian."
    >
      {settledResult ? (
        <div className="space-y-4 py-3 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {settledResult.remaining === 0
                ? 'Saldo Kalian Udah Impas (Rp 0)!'
                : `Pembayaran ${formatRupiah(settledResult.paid)} Tercatat!`}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {settledResult.remaining === 0
                ? 'Semua tagihan date udah impas, riwayat belanja tetap tersimpan.'
                : `Sisa yang belum dibayar sekarang tinggal ${formatRupiah(
                    settledResult.remaining
                  )}.`}
            </p>
          </div>
          <Button type="button" fullWidth onClick={onClose}>
            Balik ke Home
          </Button>
        </div>
      ) : absAmount === 0 ? (
        <div className="space-y-4 py-3 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Saldo Kalian Sudah Seimbang (Rp 0)
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Nggak ada yang perlu dibayar saat ini.
            </p>
          </div>
          <Button type="button" fullWidth onClick={onClose}>
            Tutup
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSettle} className="space-y-4" noValidate>
          <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-center dark:border-orange-900 dark:bg-orange-950/40 space-y-1">
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
              Total utang <strong>{payerName}</strong> ke{' '}
              <strong>{receiverName}</strong> saat ini:
            </p>
            <p className="text-2xl font-extrabold text-orange-900 dark:text-orange-200 tabular-nums whitespace-nowrap">
              {formatRupiah(absAmount)}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
              Pilih Cara Bayar
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectMode('full')}
                aria-pressed={settleMode === 'full'}
                className={`min-h-[48px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                  settleMode === 'full'
                    ? 'border-orange-700 bg-orange-700 text-white dark:border-orange-600 dark:bg-orange-600'
                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
                }`}
              >
                Bayar Penuh (100%)
              </button>
              <button
                type="button"
                onClick={() => handleSelectMode('partial')}
                aria-pressed={settleMode === 'partial'}
                className={`min-h-[48px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                  settleMode === 'partial'
                    ? 'border-orange-700 bg-orange-700 text-white dark:border-orange-600 dark:bg-orange-600'
                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
                }`}
              >
                Bayar Sebagian
              </button>
            </div>
          </div>

          {settleMode === 'partial' && (
            <div className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-800 dark:bg-stone-950">
              <Input
                label={`Nominal yang Dibayar ${payerName} Sekarang`}
                prefixText="Rp"
                inputMode="numeric"
                placeholder="Masukkan nominal bayar"
                value={amountInput}
                onChange={(e) =>
                  setAmountInput(formatNumberInput(e.target.value))
                }
                className="font-bold tabular-nums"
                required
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-stone-600 dark:text-stone-400 mr-1">
                  Pilih cepat:
                </span>
                {[0.25, 0.5, 0.75].map((ratio) => {
                  const presetVal = Math.max(
                    1000,
                    Math.round((absAmount * ratio) / 500) * 500
                  );
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() =>
                        setAmountInput(
                          formatNumberInput(Math.min(presetVal, absAmount))
                        )
                      }
                      className="min-h-[36px] rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-800 hover:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                    >
                      {Math.round(ratio * 100)}% ({formatRupiah(presetVal)})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ringkasan Saldo Setelah Pembayaran */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-950 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-400">
                Dibayar sekarang:
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
                {formatRupiah(clampedPaid)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 pt-1.5 dark:border-stone-800">
              <span className="text-stone-600 dark:text-stone-400">
                Sisa utang setelah bayar:
              </span>
              <span
                className={`font-extrabold tabular-nums whitespace-nowrap ${
                  remainingAfterPay === 0
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-orange-800 dark:text-orange-300'
                }`}
              >
                {remainingAfterPay === 0
                  ? 'Rp 0 (Impas)'
                  : formatRupiah(remainingAfterPay)}
              </span>
            </div>
          </div>

          <Input
            label="Notes (opsional)"
            placeholder="Contoh: Transfer BCA / QRIS / Tunai"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Nanti Saja
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              <HandHeart className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">
                {isSubmitting
                  ? 'Menyimpan...'
                  : remainingAfterPay === 0
                  ? 'Settle Up'
                  : `Bayar ${formatRupiah(clampedPaid)}`}
              </span>
            </Button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
