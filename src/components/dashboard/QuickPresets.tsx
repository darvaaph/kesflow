'use client';

import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { QUICK_PRESETS } from '@/lib/mockData';
import { formatNumberInput, formatRupiah, parseNumberInput } from '@/lib/format';
import { QuickPresetItem, SplitType } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function QuickPresets() {
  const {
    addTransaction,
    categories,
    currentUser,
    partnerUser,
    events,
    userAId,
    userBId,
  } = useKesflow();

  const myId = currentUser?.id || userAId;
  const partnerId = partnerUser?.id || userBId;
  const myName = currentUser?.display_name || 'Raka';
  const partnerName = partnerUser?.display_name || 'Nadin';

  const [selectedPreset, setSelectedPreset] = useState<QuickPresetItem | null>(
    null
  );
  const [customTitle, setCustomTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [payerId, setPayerId] = useState<string>(myId);
  const [splitType, setSplitType] = useState<SplitType>('EQUAL_50_50');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentSuccess, setRecentSuccess] = useState<string | null>(null);

  const handleTapPreset = (preset: QuickPresetItem) => {
    const activeEvent = events.find((e) => e.is_active);
    setSelectedPreset(preset);
    setCustomTitle(preset.label);
    setAmountInput(formatNumberInput(preset.amount));
    setPayerId(currentUser?.id || userAId);
    setSplitType('EQUAL_50_50');
    setSelectedEventId(activeEvent?.id || '');
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset || isSubmitting) return;

    const finalAmount = parseNumberInput(amountInput) || selectedPreset.amount;
    const finalTitle = customTitle.trim() || selectedPreset.label;
    const payerName = payerId === myId ? myName : partnerName;

    setIsSubmitting(true);
    try {
      const matchedCategory =
        categories.find((c) => c.name === selectedPreset.categoryName) ??
        categories[0];

      await addTransaction({
        title: finalTitle,
        amount: finalAmount,
        category_id: matchedCategory?.id || 'cat-transport',
        payer_id: payerId,
        split_type: splitType,
        event_id: selectedEventId ? selectedEventId : null,
        notes: null,
      });

      setSelectedPreset(null);
      setRecentSuccess(
        `${finalTitle} (${formatRupiah(finalAmount)}) dibayar ${payerName} berhasil dicatat!`
      );
      setTimeout(() => {
        setRecentSuccess(null);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="quick-presets-heading" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
          <h2
            id="quick-presets-heading"
            className="text-sm font-bold text-stone-900 dark:text-stone-100"
          >
            Catat Cepat Pengeluaran Kecil
          </h2>
        </div>
        <span className="text-xs text-stone-600 dark:text-stone-400 whitespace-nowrap">
          Pilih &amp; konfirmasi pembayar
        </span>
      </div>

      {recentSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          <Check className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <span>{recentSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleTapPreset(preset)}
            className="flex min-h-[56px] items-center gap-2.5 rounded-xl border border-stone-200/90 bg-white p-2.5 text-left transition-colors hover:border-orange-400 hover:bg-orange-50/40 active:bg-orange-100/50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100/80 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
              <CategoryIcon name={preset.iconName} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-snug text-stone-900 dark:text-stone-100">
                {preset.label}
              </p>
              <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 tabular-nums whitespace-nowrap">
                {formatRupiah(preset.amount)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <BottomSheet
        isOpen={Boolean(selectedPreset)}
        onClose={() => setSelectedPreset(null)}
        title={`Catat Cepat: ${selectedPreset?.label || ''}`}
        description="Pastikan siapa yang membayar dan cara pembagiannya sebelum disimpan."
      >
        {selectedPreset && (
          <form onSubmit={handleConfirmSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nama Pengeluaran"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
              />
              <Input
                label="Nominal"
                prefixText="Rp"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) =>
                  setAmountInput(formatNumberInput(e.target.value))
                }
                className="font-bold tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                Siapa yang Membayar?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayerId(myId)}
                  aria-pressed={payerId === myId}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                    payerId === myId
                      ? 'border-orange-700 bg-orange-700 text-white dark:border-orange-600 dark:bg-orange-600'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
                  }`}
                >
                  Dibayar {myName} (Kamu)
                </button>
                <button
                  type="button"
                  onClick={() => setPayerId(partnerId)}
                  aria-pressed={payerId === partnerId}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                    payerId === partnerId
                      ? 'border-orange-700 bg-orange-700 text-white dark:border-orange-600 dark:bg-orange-600'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
                  }`}
                >
                  Dibayar {partnerName}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                Mode Bagi
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'EQUAL_50_50' as const, label: 'Bagi 50:50' },
                  { id: 'FULL_TREAT' as const, label: '100% Traktir' },
                  { id: 'FULL_OWE' as const, label: 'Ditalangi' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSplitType(m.id)}
                    aria-pressed={splitType === m.id}
                    className={`min-h-[44px] rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                      splitType === m.id
                        ? 'border-orange-700 bg-orange-50 text-orange-950 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-100'
                        : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {events.length > 0 && (
              <div className="space-y-1.5">
                <label
                  htmlFor="quick-preset-event"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  Masukkan ke Album Acara Kencan? (Opsional)
                </label>
                <select
                  id="quick-preset-event"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                >
                  <option value="">
                    Pengeluaran Harian Biasa (Tanpa Album Acara)
                  </option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      Album: {evt.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPreset(null)}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>
    </section>
  );
}
