'use client';

import React, { useEffect, useState } from 'react';
import { useKesflow } from '@/context/KesflowContext';
import { SplitType, Transaction } from '@/types';
import { formatNumberInput, parseNumberInput } from '@/lib/format';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SplitModeSelector } from './SplitModeSelector';
import { ReceiptUploader } from './ReceiptUploader';

export interface AddTransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventId?: string | null;
  initialTransaction?: Transaction | null;
}

export function AddTransactionDrawer({
  isOpen,
  onClose,
  defaultEventId = null,
  initialTransaction = null,
}: AddTransactionDrawerProps) {
  const {
    addTransaction,
    updateTransaction,
    categories,
    events,
    currentUser,
    partnerUser,
    userAId,
    userBId,
    space,
    profiles,
  } = useKesflow();

  const isEditMode = Boolean(initialTransaction);

  const myId = currentUser?.id ?? userAId;
  const partnerId = partnerUser?.id ?? userBId;
  const myName = currentUser?.display_name || 'Kamu';
  const partnerName = partnerUser?.display_name || 'Pasangan (Belum Bergabung)';

  const userAProfile = profiles.find((p) => p.id === userAId);
  const userBProfile = profiles.find((p) => p.id === userBId);
  const userAName = userAProfile?.display_name || myName;
  const userBName = userBProfile?.display_name || partnerName;

  const [title, setTitle] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [categoryId, setCategoryId] = useState(
    categories[0]?.id || 'cat-food'
  );
  const [payerId, setPayerId] = useState(myId);
  const [splitType, setSplitType] = useState<SplitType>('EQUAL_50_50');
  const [customShareA, setCustomShareA] = useState(0);
  const [customShareB, setCustomShareB] = useState(0);
  const [eventId, setEventId] = useState<string>(defaultEventId || '');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    if (initialTransaction) {
      setTitle(initialTransaction.title);
      setAmountDisplay(formatNumberInput(Number(initialTransaction.amount)));
      setCategoryId(
        initialTransaction.category_id || categories[0]?.id || 'cat-food'
      );
      setPayerId(initialTransaction.payer_id);
      setSplitType(initialTransaction.split_type);
      setCustomShareA(Number(initialTransaction.user_a_share));
      setCustomShareB(Number(initialTransaction.user_b_share));
      setEventId(initialTransaction.event_id || '');
      setNotes(initialTransaction.notes || '');
      setReceiptUrl(initialTransaction.receipt_url || null);
    } else {
      setTitle('');
      setAmountDisplay('');
      setCategoryId(categories[0]?.id || 'cat-food');
      setPayerId(myId);
      setSplitType('EQUAL_50_50');
      setCustomShareA(0);
      setCustomShareB(0);
      const activeEvt = events.find((e) => e.is_active);
      setEventId(defaultEventId || activeEvt?.id || '');
      setNotes('');
      setReceiptUrl(null);
    }
  }, [isOpen, initialTransaction, myId, defaultEventId, events, categories]);

  const numericAmount = parseNumberInput(amountDisplay);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setAmountDisplay(formatted);
    const val = parseNumberInput(formatted);
    setCustomShareA(Math.round(val / 2));
    setCustomShareB(val - Math.round(val / 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Judul pengeluaran wajib diisi (contoh: Makan Malam Sushi).');
      return;
    }

    if (numericAmount <= 0) {
      setFormError('Masukkan nominal pengeluaran lebih dari Rp 0.');
      return;
    }

    if (
      splitType === 'CUSTOM' &&
      Math.round(customShareA + customShareB) !== Math.round(numericAmount)
    ) {
      setFormError(
        'Jumlah porsi kustom harus sama persis dengan total nominal pengeluaran.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        amount: numericAmount,
        category_id: categoryId,
        payer_id: payerId,
        split_type: splitType,
        user_a_share: customShareA,
        user_b_share: customShareB,
        event_id: eventId ? eventId : null,
        receipt_url: receiptUrl,
        notes: notes.trim() || null,
      };

      if (initialTransaction) {
        await updateTransaction(initialTransaction.id, payload);
      } else {
        await addTransaction(payload);
      }

      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan transaksi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const payerName = payerId === myId ? myName : partnerName;
  const otherName = payerId === myId ? partnerName : myName;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode ? 'Edit Pengeluaran Date' : 'Catat Pengeluaran Date'
      }
      description={
        isEditMode
          ? 'Perubahan otomatis menghitung ulang saldo berjalan kalian.'
          : 'Transaksi otomatis tersinkron ke layar pasanganmu.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Judul Pengeluaran"
          placeholder="Contoh: Makan Malam Ramen / Tiket Nonton"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Nominal Pengeluaran"
          prefixText="Rp"
          inputMode="numeric"
          placeholder="50.000"
          value={amountDisplay}
          onChange={handleAmountChange}
          required
          className="text-lg font-bold tabular-nums"
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
            Kategori
          </span>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const selected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  aria-pressed={selected}
                  className={`flex min-h-[46px] items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                    selected
                      ? 'border-orange-700 bg-orange-50 text-orange-950 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-100'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                  }`}
                >
                  <CategoryIcon name={cat.icon} className="h-4 w-4 shrink-0" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
            Siapa yang Membayar di Kasir?
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

        <SplitModeSelector
          value={splitType}
          onChange={setSplitType}
          totalAmount={numericAmount}
          payerName={payerName}
          otherName={otherName}
          userAName={userAName}
          userBName={userBName}
          customShareA={customShareA}
          customShareB={customShareB}
          onChangeCustomShares={(a, b) => {
            setCustomShareA(a);
            setCustomShareB(b);
          }}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="event-select"
            className="block text-sm font-medium text-stone-800 dark:text-stone-200"
          >
            Momen (opsional)
          </label>
          <select
            id="event-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value="">
              Harian Biasa (tanpa Momen)
            </option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                Momen: {evt.title} {evt.is_active ? '(Sedang Berlangsung)' : ''}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Notes (opsional)"
          placeholder="Contoh: Pesan 2 matcha latte + kentang"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <ReceiptUploader
          receiptUrl={receiptUrl}
          onChange={setReceiptUrl}
          spaceId={space?.id || 'space-couple-uuid'}
        />

        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Menyimpan...'
              : isEditMode
              ? 'Simpan Perubahan'
              : 'Simpan Transaksi'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
