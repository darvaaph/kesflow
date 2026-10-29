'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { SplitType, Transaction } from '@/types';
import {
  formatNumberInput,
  parseNumberInput,
  formatShortName,
} from '@/lib/format';
import {
  BillLineItem,
  ItemizedBillData,
  calculateItemizedSplit,
  encodeTransactionNotes,
  parseTransactionNotes,
} from '@/lib/itemizedBill';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SplitModeSelector } from './SplitModeSelector';
import { ReceiptUploader, uploadAndCompressReceipt } from './ReceiptUploader';
import { ItemizedBillBuilder } from './ItemizedBillBuilder';

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
  const isMeUserA = myId === userAId;
  const myName = currentUser?.display_name || 'Kamu';
  const partnerName = partnerUser?.display_name || 'Pasangan';

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

  // State Rincian Menu (Itemized Split) & AI OCR
  const [isItemizedOpen, setIsItemizedOpen] = useState(false);
  const [itemizedItems, setItemizedItems] = useState<BillLineItem[]>([]);
  const [extraFee, setExtraFee] = useState(0);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    setScanFeedback(null);
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
      const parsedNotes = parseTransactionNotes(initialTransaction.notes);
      setNotes(parsedNotes.plainNotes);
      if (parsedNotes.itemized && parsedNotes.itemized.items.length > 0) {
        setItemizedItems(parsedNotes.itemized.items);
        setExtraFee(parsedNotes.itemized.extraFee);
        setIsItemizedOpen(true);
      } else {
        setItemizedItems([]);
        setExtraFee(0);
        setIsItemizedOpen(false);
      }
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
      setItemizedItems([]);
      setExtraFee(0);
      setIsItemizedOpen(false);
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

  const handleToggleItemized = () => {
    const nextOpen = !isItemizedOpen;
    setIsItemizedOpen(nextOpen);
    if (nextOpen && itemizedItems.length === 0) {
      const myAssignee = isMeUserA ? 'A' : 'B';
      const partnerAssignee = isMeUserA ? 'B' : 'A';
      setItemizedItems([
        {
          id: `item-${Date.now()}-1`,
          name: '',
          price: 0,
          assignedTo: myAssignee,
        },
        {
          id: `item-${Date.now()}-2`,
          name: '',
          price: 0,
          assignedTo: partnerAssignee,
        },
      ]);
    }
  };

  const handleItemizedChange = (nextData: ItemizedBillData) => {
    setItemizedItems(nextData.items);
    setExtraFee(nextData.extraFee);

    const calc = calculateItemizedSplit(nextData);
    if (calc.grandTotal > 0) {
      setAmountDisplay(formatNumberInput(calc.grandTotal));
      setCustomShareA(calc.shareA);
      setCustomShareB(calc.shareB);
      setSplitType('CUSTOM');
    }
  };

  const handleScanReceiptFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningReceipt(true);
    setScanFeedback(null);
    setFormError(null);

    try {
      const { dataUrl, storedUrl } = await uploadAndCompressReceipt(
        file,
        space?.id || 'space-couple-uuid'
      );
      setReceiptUrl(storedUrl);

      const response = await fetch('/api/receipt/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: 'image/jpeg',
        }),
      });

      const resData = (await response.json()) as {
        error?: string;
        merchantName?: string;
        categoryName?: string;
        items?: Array<{ name: string; price: number }>;
        extraFee?: number;
        grandTotal?: number;
      };

      if (!response.ok) {
        throw new Error(
          resData.error || 'Gagal membaca struk dengan AI OCR.'
        );
      }

      if (resData.merchantName && !title.trim()) {
        setTitle(resData.merchantName);
      }

      if (resData.categoryName) {
        const matchedCat = categories.find(
          (c) =>
            c.name.toLowerCase() === resData.categoryName?.toLowerCase()
        );
        if (matchedCat) {
          setCategoryId(matchedCat.id);
        }
      }

      const validScannedItems = (resData.items || []).filter(
        (it) => it.price > 0
      );
      const scannedExtra = Math.max(0, Math.round(resData.extraFee || 0));

      if (validScannedItems.length > 0) {
        const builtItems: BillLineItem[] = validScannedItems.map(
          (it, idx) => ({
            id: `ocr-${Date.now()}-${idx}`,
            name: it.name,
            price: Math.round(it.price),
            assignedTo: 'BOTH',
          })
        );
        setIsItemizedOpen(true);
        handleItemizedChange({
          items: builtItems,
          extraFee: scannedExtra,
        });
        setScanFeedback({
          text: `Berhasil membaca ${builtItems.length} menu dari struk! Pilih pemilik tiap menu di bawah.`,
        });
      } else if (resData.grandTotal && resData.grandTotal > 0) {
        const total = Math.round(resData.grandTotal);
        setAmountDisplay(formatNumberInput(total));
        setCustomShareA(Math.round(total / 2));
        setCustomShareB(total - Math.round(total / 2));
        setScanFeedback({
          text: `Total struk terdeteksi Rp ${formatNumberInput(total)}.`,
        });
      } else {
        setScanFeedback({
          text: 'Struk berhasil dilampirkan, namun rincian menu tidak terbaca jelas. Silakan isi manual.',
          isError: true,
        });
      }
    } catch (err) {
      setScanFeedback({
        text:
          err instanceof Error
            ? err.message
            : 'Gagal memindai struk otomatis.',
        isError: true,
      });
    } finally {
      setIsScanningReceipt(false);
      if (scanInputRef.current) {
        scanInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Judul pengeluaran wajib diisi (contoh: Makan Malam Ramen).');
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
      const activeItemized: ItemizedBillData | null =
        isItemizedOpen && itemizedItems.some((i) => i.price > 0)
          ? { items: itemizedItems, extraFee }
          : null;

      const encodedNotes = encodeTransactionNotes(notes, activeItemized);

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
        notes: encodedNotes,
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
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Shortcut Scan Struk AI OCR */}
        <div className="space-y-1.5">
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            onChange={handleScanReceiptFile}
            className="hidden"
            aria-label="Scan struk kasir dengan AI"
          />
          <button
            type="button"
            disabled={isScanningReceipt}
            onClick={() => scanInputRef.current?.click()}
            className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-2xl border border-dashed border-orange-300 bg-gradient-to-r from-orange-50/90 to-amber-50/70 px-3.5 py-2.5 text-left transition-all hover:border-orange-400 hover:from-orange-100/80 dark:border-orange-800/70 dark:from-orange-950/40 dark:to-stone-900 dark:hover:border-orange-700"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
                {isScanningReceipt ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-xs font-bold text-orange-950 dark:text-orange-200">
                  <span>
                    {isScanningReceipt
                      ? 'Sedang Membaca Struk...'
                      : 'Scan Struk Kasir Otomatis'}
                  </span>
                  <Sparkles className="h-3 w-3 shrink-0 text-orange-600 dark:text-orange-400" />
                </p>
                <p className="truncate text-[11px] text-stone-600 dark:text-stone-400">
                  {isScanningReceipt
                    ? 'Mengekstrak nama toko, daftar menu & pajak...'
                    : 'Foto struk untuk isi otomatis judul, menu & total'}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-orange-800 shadow-xs ring-1 ring-orange-200 dark:bg-stone-800 dark:text-orange-300 dark:ring-orange-800/60">
              {isScanningReceipt ? 'Proses...' : 'Pilih Foto'}
            </span>
          </button>

          {scanFeedback && (
            <div
              className={`rounded-xl border px-3 py-2 text-[11px] font-medium ${
                scanFeedback.isError
                  ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
              }`}
            >
              {scanFeedback.text}
            </div>
          )}
        </div>

        {/* Judul & Nominal */}
        <Input
          label="Judul Pengeluaran"
          placeholder="Contoh: Makan Malam Ramen / Bioskop"
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

        {/* Rincian per Menu (Itemized Split Builder - Manual & Hasil Scan OCR) */}
        <ItemizedBillBuilder
          isOpen={isItemizedOpen}
          onToggleOpen={handleToggleItemized}
          items={itemizedItems}
          extraFee={extraFee}
          isMeUserA={isMeUserA}
          myName={myName}
          partnerName={partnerName}
          onChange={handleItemizedChange}
        />

        {/* Kategori: Horizontal Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Kategori
            </span>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              Geser pilihan →
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
            {categories.map((cat) => {
              const selected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  aria-pressed={selected}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 snap-start ${
                    selected
                      ? 'border-orange-600 bg-orange-50 font-semibold text-orange-950 dark:border-orange-500 dark:bg-orange-950/70 dark:text-orange-100 ring-1 ring-orange-500/30'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300'
                  }`}
                >
                  <CategoryIcon name={cat.icon} className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Siapa yang Membayar: Segmented Bar dengan target sentuh lega (h-11) */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Siapa yang Membayar di Kasir?
          </span>
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-stone-100 p-1.5 dark:bg-stone-800/80">
            <button
              type="button"
              onClick={() => setPayerId(myId)}
              aria-pressed={payerId === myId}
              title={`Dibayar ${myName} (Kamu)`}
              className={`flex h-11 items-center justify-center gap-1.5 truncate rounded-xl px-3 text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                payerId === myId
                  ? 'bg-white font-bold text-orange-950 shadow dark:bg-stone-900 dark:text-orange-200 ring-1 ring-black/5 dark:ring-white/10'
                  : 'font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <span className="truncate">Dibayar {formatShortName(myName, 10)} (Kamu)</span>
            </button>
            <button
              type="button"
              onClick={() => setPayerId(partnerId)}
              aria-pressed={payerId === partnerId}
              title={`Dibayar ${partnerName}`}
              className={`flex h-11 items-center justify-center gap-1.5 truncate rounded-xl px-3 text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                payerId === partnerId
                  ? 'bg-white font-bold text-orange-950 shadow dark:bg-stone-900 dark:text-orange-200 ring-1 ring-black/5 dark:ring-white/10'
                  : 'font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <span className="truncate">Dibayar {formatShortName(partnerName, 14)}</span>
            </button>
          </div>
        </div>

        {/* Mode Split: Segmented Control */}
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

        {/* Momen Date: Compact Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="event-select"
            className="block text-xs font-semibold text-stone-700 dark:text-stone-300"
          >
            Momen (opsional)
          </label>
          <select
            id="event-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value="">Harian Biasa (tanpa Momen)</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                Momen: {evt.title} {evt.is_active ? '(Sedang Berlangsung)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Catatan & Foto Struk Inline */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
            <label htmlFor="notes-input">Catatan & Struk (opsional)</label>
            {receiptUrl && (
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                ✓ Struk terlampir
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                id="notes-input"
                type="text"
                placeholder="Contoh: Pesan 2 matcha latte + kentang"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500"
              />
            </div>
            <ReceiptUploader
              receiptUrl={receiptUrl}
              onChange={setReceiptUrl}
              spaceId={space?.id || 'space-couple-uuid'}
              compact
            />
          </div>
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {formError}
          </div>
        )}

        {/* Action Buttons */}
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
