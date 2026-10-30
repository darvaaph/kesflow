'use client';

import React from 'react';
import {
  Camera,
  Check,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  BillLineItem,
  ItemAssignee,
  ItemizedBillData,
  calculateItemizedSplit,
} from '@/lib/itemizedBill';
import {
  formatNumberInput,
  formatRupiah,
  formatShortName,
  parseNumberInput,
} from '@/lib/format';
import { Button } from '@/components/ui/Button';

export interface ItemizedBillBuilderProps {
  items: BillLineItem[];
  extraFee: number;
  isMeUserA: boolean;
  myName: string;
  partnerName: string;
  onChange: (nextData: ItemizedBillData) => void;
  onTriggerScan?: () => void;
  isScanning?: boolean;
  scanFeedback?: { text: string; isError?: boolean } | null;
}

export function ItemizedBillBuilder({
  items,
  extraFee,
  isMeUserA,
  myName,
  partnerName,
  onChange,
  onTriggerScan,
  isScanning = false,
  scanFeedback = null,
}: ItemizedBillBuilderProps) {
  const shortMyName = formatShortName(myName, 10);
  const shortPartnerName = formatShortName(partnerName, 10);

  const myAssignee: ItemAssignee = isMeUserA ? 'A' : 'B';
  const partnerAssignee: ItemAssignee = isMeUserA ? 'B' : 'A';

  const calc = calculateItemizedSplit({ items, extraFee });
  const handleUpdateItem = (
    id: string,
    patch: Partial<Omit<BillLineItem, 'id'>>
  ) => {
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, ...patch } : it
    );
    onChange({ items: nextItems, extraFee });
  };

  const handleAddItem = () => {
    const newItem: BillLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      price: 0,
      assignedTo: items[items.length - 1]?.assignedTo ?? myAssignee,
    };
    onChange({ items: [...items, newItem], extraFee });
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      onChange({
        items: [
          {
            id: items[0]?.id || `item-${Date.now()}`,
            name: '',
            price: 0,
            assignedTo: myAssignee,
          },
        ],
        extraFee,
      });
      return;
    }
    const nextItems = items.filter((it) => it.id !== id);
    onChange({ items: nextItems, extraFee });
  };

  const handleExtraFeeChange = (raw: string) => {
    const val = parseNumberInput(raw);
    onChange({ items, extraFee: val });
  };

  const applyTaxPreset = (rate: number) => {
    if (calc.itemsSubtotal <= 0) return;
    const computed = Math.round(calc.itemsSubtotal * rate);
    onChange({ items, extraFee: computed });
  };

  const tenPercentFee = Math.round(calc.itemsSubtotal * 0.1);
  const fifteenPercentFee = Math.round(calc.itemsSubtotal * 0.15);

  return (
    <div className="space-y-3.5">
      {/* Pintasan Scan Struk AI di dalam Halaman Rincian Menu */}
      {onTriggerScan && (
        <div className="space-y-1.5">
          <button
            type="button"
            disabled={isScanning}
            onClick={onTriggerScan}
            className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50/60 px-3 py-2 text-xs font-bold text-orange-900 transition-colors hover:bg-orange-100/70 dark:border-orange-800/70 dark:bg-orange-950/30 dark:text-orange-200"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <span>
              {isScanning ? 'Membaca struk...' : 'Isi otomatis dari foto struk'}
            </span>
            <Sparkles className="h-3 w-3 shrink-0 text-orange-600 dark:text-orange-400" />
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
      )}

      {/* Daftar Kartu Menu — Layout Lega Anti Terpotong */}
      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isMine = item.assignedTo === myAssignee;
          const isPartner = item.assignedTo === partnerAssignee;
          const isBoth = item.assignedTo === 'BOTH';

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-stone-200/90 bg-white p-3 space-y-2.5 shadow-2xs dark:border-stone-800 dark:bg-stone-950"
            >
              {/* Baris 1: Nomor + Input Nama Menu Lebar Penuh + Tombol Hapus */}
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  placeholder="Nama menu"
                  enterKeyHint="next"
                  value={item.name}
                  onChange={(e) =>
                    handleUpdateItem(item.id, { name: e.target.value })
                  }
                  aria-label={`Nama menu ${idx + 1}`}
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-base font-medium text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label={`Hapus menu ${idx + 1}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Baris 2: Harga + Pemilih Pemilik dalam satu baris (hemat tinggi, jempol nyaman) */}
              <div className="flex items-center gap-2 pl-8">
                <div className="relative w-[7.25rem] shrink-0">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="next"
                    placeholder="0"
                    value={item.price > 0 ? formatNumberInput(item.price) : ''}
                    onChange={(e) => {
                      const num = parseNumberInput(e.target.value);
                      handleUpdateItem(item.id, { price: num });
                    }}
                    aria-label={`Harga menu ${idx + 1}`}
                    className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/80 pl-7 pr-2 text-right text-base font-bold tabular-nums text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
                  />
                </div>
                <div
                  role="group"
                  aria-label={`Pemesan menu ${idx + 1}`}
                  className="grid min-w-0 flex-1 grid-cols-3 gap-0.5 rounded-xl bg-stone-100 p-0.5 dark:bg-stone-900"
                >
                  {[
                    { key: myAssignee, label: shortMyName, on: isMine, tone: 'bg-orange-600 text-white' },
                    { key: partnerAssignee, label: shortPartnerName, on: isPartner, tone: 'bg-orange-600 text-white' },
                    { key: 'BOTH' as ItemAssignee, label: 'Berdua', on: isBoth, tone: 'bg-emerald-700 text-white' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        handleUpdateItem(item.id, { assignedTo: opt.key })
                      }
                      aria-pressed={opt.on}
                      className={`h-9 min-w-0 truncate rounded-[10px] px-1 text-[11px] font-bold transition-all ${
                        opt.on
                          ? opt.tone
                          : 'text-stone-600 hover:bg-stone-200/70 dark:text-stone-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol Tambah Baris Menu */}
      <button
        type="button"
        onClick={handleAddItem}
        className="flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-2xl border border-dashed border-orange-300 bg-orange-50/50 py-2.5 text-xs font-bold text-orange-800 hover:bg-orange-100/60 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-orange-300 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Tambah Menu Lain</span>
      </button>

      {/* Pajak / Service / Ongkir + Tombol Cepat +10% / +15% */}
      <div className="rounded-2xl border border-stone-200 bg-white p-3 space-y-2.5 dark:border-stone-800 dark:bg-stone-950">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <label
              htmlFor="extra-fee-input"
              className="block text-xs font-bold text-stone-800 dark:text-stone-200"
            >
              Pajak / Service / Ongkir
            </label>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Dibagi adil sesuai proporsi pesanan masing-masing
            </p>
          </div>
          <div className="relative w-36 shrink-0">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
              Rp
            </span>
            <input
              id="extra-fee-input"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={extraFee > 0 ? formatNumberInput(extraFee) : ''}
              onChange={(e) => handleExtraFeeChange(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/80 pl-8 pr-3 py-1.5 text-right text-base font-bold tabular-nums text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Tombol Cepat Persentase Pajak Resto */}
        {calc.itemsSubtotal > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mr-1">
              Isi cepat:
            </span>
            <button
              type="button"
              onClick={() => onChange({ items, extraFee: 0 })}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                extraFee === 0
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-900 dark:text-stone-400'
              }`}
            >
              Rp 0
            </button>
            <button
              type="button"
              onClick={() => applyTaxPreset(0.1)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                extraFee > 0 && extraFee === tenPercentFee
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/60 dark:text-orange-300'
              }`}
            >
              +10% PB1
            </button>
            <button
              type="button"
              onClick={() => applyTaxPreset(0.15)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                extraFee > 0 && extraFee === fifteenPercentFee
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/60 dark:text-orange-300'
              }`}
            >
              +15% Pajak+Service
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export interface ItemizedBillFooterProps {
  items: BillLineItem[];
  extraFee: number;
  isMeUserA: boolean;
  myName: string;
  partnerName: string;
  onDone: () => void;
}

/** Footer ringkas yang menempel di luar area scroll sheet. */
export function ItemizedBillFooter({
  items,
  extraFee,
  isMeUserA,
  myName,
  partnerName,
  onDone,
}: ItemizedBillFooterProps) {
  const calc = calculateItemizedSplit({ items, extraFee });
  const myShare = isMeUserA ? calc.shareA : calc.shareB;
  const partnerShare = isMeUserA ? calc.shareB : calc.shareA;
  const canApply = calc.grandTotal > 0;

  return (
    <div className="space-y-2">
      {canApply && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-stone-600 dark:text-stone-400">
          <span className="min-w-0 truncate">
            {formatShortName(myName, 8)}{' '}
            <b className="tabular-nums text-stone-900 dark:text-stone-100">
              {formatRupiah(myShare)}
            </b>
          </span>
          <span className="min-w-0 truncate text-right">
            {formatShortName(partnerName, 8)}{' '}
            <b className="tabular-nums text-stone-900 dark:text-stone-100">
              {formatRupiah(partnerShare)}
            </b>
          </span>
        </div>
      )}
      <Button
        type="button"
        variant="primary"
        onClick={onDone}
        disabled={!canApply}
        className="w-full"
      >
        <Check className="mr-1.5 h-4 w-4" />
        {canApply
          ? `Selesai · ${formatRupiah(calc.grandTotal)}`
          : 'Isi harga menu dulu'}
      </Button>
    </div>
  );
}

export interface ItemizedSummaryCardProps {
  items: BillLineItem[];
  extraFee: number;
  isMeUserA: boolean;
  myName: string;
  partnerName: string;
  onOpenEditor: () => void;
}

export function ItemizedSummaryCard({
  items,
  extraFee,
  isMeUserA,
  myName,
  partnerName,
  onOpenEditor,
}: ItemizedSummaryCardProps) {
  const shortMyName = formatShortName(myName, 10);
  const shortPartnerName = formatShortName(partnerName, 10);
  const myAssignee: ItemAssignee = isMeUserA ? 'A' : 'B';

  const calc = calculateItemizedSplit({ items, extraFee });
  const myShare = isMeUserA ? calc.shareA : calc.shareB;
  const partnerShare = isMeUserA ? calc.shareB : calc.shareA;
  const validItems = items.filter((it) => it.price > 0);

  return (
    <div className="rounded-2xl border border-orange-200/90 bg-gradient-to-b from-orange-50/70 to-white p-3.5 space-y-3 dark:border-orange-900/60 dark:from-orange-950/30 dark:to-stone-900">
      {/* Baris Atas: Total Tagihan dari Menu + Tombol Edit */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white">
            <ListChecks className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Total dari {validItems.length} Menu
              </span>
              {extraFee > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  +Pajak/Ongkir
                </span>
              )}
            </div>
            <p className="text-lg font-extrabold tabular-nums text-stone-900 dark:text-stone-100">
              {formatRupiah(calc.grandTotal)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenEditor}
          className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-orange-300 bg-white px-3 py-1.5 text-xs font-bold text-orange-800 shadow-2xs hover:bg-orange-50 dark:border-orange-800 dark:bg-stone-800 dark:text-orange-300 dark:hover:bg-stone-700 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Atur Menu</span>
        </button>
      </div>

      {/* Preview Singkat Daftar Menu */}
      {validItems.length > 0 && (
        <div className="rounded-xl bg-white/90 px-3 py-2 text-xs space-y-1 border border-stone-200/70 dark:bg-stone-950/70 dark:border-stone-800">
          {validItems.slice(0, 3).map((it, i) => {
            const ownerLabel =
              it.assignedTo === 'BOTH'
                ? '50:50'
                : it.assignedTo === myAssignee
                ? shortMyName
                : shortPartnerName;
            return (
              <div
                key={it.id}
                className="flex items-center justify-between gap-2 text-stone-600 dark:text-stone-400"
              >
                <span className="truncate">
                  {i + 1}. {it.name.trim() || `Menu ${i + 1}`}{' '}
                  <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-400">
                    ({ownerLabel})
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                  {formatRupiah(it.price)}
                </span>
              </div>
            );
          })}
          {validItems.length > 3 && (
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 pt-0.5">
              +{validItems.length - 3} menu lainnya...
            </p>
          )}
        </div>
      )}

      {/* Kotak Hasil Bagi Porsi Otomatis (Menggantikan SplitModeSelector Manual) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-950">
          <span className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
            Porsi {shortMyName} (Kamu)
          </span>
          <span className="text-sm font-bold tabular-nums text-orange-700 dark:text-orange-400">
            {formatRupiah(myShare)}
          </span>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-950">
          <span className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
            Porsi {shortPartnerName}
          </span>
          <span className="text-sm font-bold tabular-nums text-stone-900 dark:text-stone-100">
            {formatRupiah(partnerShare)}
          </span>
        </div>
      </div>
    </div>
  );
}