'use client';

import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  ListChecks,
  Plus,
  Trash2,
  Users,
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

export interface ItemizedBillBuilderProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  items: BillLineItem[];
  extraFee: number;
  isMeUserA: boolean;
  myName: string;
  partnerName: string;
  onChange: (nextData: ItemizedBillData) => void;
}

export function ItemizedBillBuilder({
  isOpen,
  onToggleOpen,
  items,
  extraFee,
  isMeUserA,
  myName,
  partnerName,
  onChange,
}: ItemizedBillBuilderProps) {
  const shortMyName = formatShortName(myName, 10);
  const shortPartnerName = formatShortName(partnerName, 10);

  const myAssignee: ItemAssignee = isMeUserA ? 'A' : 'B';
  const partnerAssignee: ItemAssignee = isMeUserA ? 'B' : 'A';

  const calc = calculateItemizedSplit({ items, extraFee });
  const myShare = isMeUserA ? calc.shareA : calc.shareB;
  const partnerShare = isMeUserA ? calc.shareB : calc.shareA;
  const validItemCount = items.filter(
    (it) => it.name.trim().length > 0 || it.price > 0
  ).length;

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
      assignedTo: myAssignee,
    };
    onChange({ items: [...items, newItem], extraFee });
  };

  const handleRemoveItem = (id: string) => {
    const nextItems = items.filter((it) => it.id !== id);
    onChange({ items: nextItems, extraFee });
  };

  const handleExtraFeeChange = (raw: string) => {
    const val = parseNumberInput(raw);
    onChange({ items, extraFee: val });
  };

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/70 dark:border-stone-800 dark:bg-stone-900/50 overflow-hidden transition-all">
      {/* Header / Toggle Accordion */}
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-stone-100/80 dark:hover:bg-stone-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-400">
            <ListChecks className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
              Bagi per Menu (Rincian Pesanan)
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {validItemCount > 0 && calc.grandTotal > 0
                ? `${validItemCount} menu tercatat · Total ${formatRupiah(calc.grandTotal)}`
                : 'Hitung otomatis siapa pesan apa tanpa kalkulator'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {validItemCount > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
              {validItemCount} item
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-stone-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-stone-200/80 p-3 space-y-3 dark:border-stone-800">
          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const isMine = item.assignedTo === myAssignee;
              const isPartner = item.assignedTo === partnerAssignee;
              const isBoth = item.assignedTo === 'BOTH';

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-stone-200 bg-white p-2.5 space-y-2 shadow-2xs dark:border-stone-800 dark:bg-stone-950"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Menu ${idx + 1} (cth: Nasi Bebek)`}
                      value={item.name}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { name: e.target.value })
                      }
                      aria-label={`Nama menu ${idx + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-stone-50/70 px-2.5 py-1.5 text-base text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
                    />
                    <div className="relative w-32 shrink-0">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="25.000"
                        value={
                          item.price > 0 ? formatNumberInput(item.price) : ''
                        }
                        onChange={(e) => {
                          const num = parseNumberInput(e.target.value);
                          handleUpdateItem(item.id, { price: num });
                        }}
                        aria-label={`Harga menu ${idx + 1}`}
                        className="w-full rounded-lg border border-stone-200 bg-stone-50/70 pl-7 pr-2.5 py-1.5 text-right text-base font-bold tabular-nums text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Hapus menu ${idx + 1}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Pemilih Siapa yang Pesan Menu Ini */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateItem(item.id, { assignedTo: myAssignee })
                      }
                      aria-pressed={isMine}
                      className={`h-7 rounded-lg text-[11px] font-bold transition-all truncate px-2 ${
                        isMine
                          ? 'bg-orange-600 text-white shadow-2xs dark:bg-orange-500'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 dark:bg-stone-900 dark:text-stone-400'
                      }`}
                    >
                      {shortMyName} (Kamu)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateItem(item.id, {
                          assignedTo: partnerAssignee,
                        })
                      }
                      aria-pressed={isPartner}
                      className={`h-7 rounded-lg text-[11px] font-bold transition-all truncate px-2 ${
                        isPartner
                          ? 'bg-orange-600 text-white shadow-2xs dark:bg-orange-500'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 dark:bg-stone-900 dark:text-stone-400'
                      }`}
                    >
                      {shortPartnerName}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateItem(item.id, { assignedTo: 'BOTH' })
                      }
                      aria-pressed={isBoth}
                      className={`inline-flex h-7 items-center justify-center gap-1 rounded-lg text-[11px] font-bold transition-all truncate px-2 ${
                        isBoth
                          ? 'bg-emerald-700 text-white shadow-2xs dark:bg-emerald-600'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 dark:bg-stone-900 dark:text-stone-400'
                      }`}
                    >
                      <Users className="h-3 w-3 shrink-0" />
                      <span>Bareng 50:50</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100/60 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-orange-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Menu Lain</span>
          </button>

          {/* Pajak / Service / Ongkir Proporsional */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-950">
            <div className="min-w-0">
              <label
                htmlFor="extra-fee-input"
                className="block text-xs font-semibold text-stone-800 dark:text-stone-200"
              >
                Pajak / Service / Ongkir
              </label>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Otomatis dibagi adil sesuai proporsi pesanan
              </p>
            </div>
            <div className="relative w-32 shrink-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                Rp
              </span>
              <input
                id="extra-fee-input"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={extraFee > 0 ? formatNumberInput(extraFee) : ''}
                onChange={(e) => handleExtraFeeChange(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50/70 pl-7 pr-2.5 py-1.5 text-right text-base font-bold tabular-nums text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Ringkasan Hasil Hitungan */}
          {calc.grandTotal > 0 && (
            <div className="rounded-xl bg-orange-100/70 p-2.5 text-xs dark:bg-orange-950/50 space-y-1 border border-orange-200/70 dark:border-orange-900/50">
              <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                <span>Porsi {shortMyName} (Kamu):</span>
                <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                  {formatRupiah(myShare)}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                <span>Porsi {shortPartnerName}:</span>
                <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                  {formatRupiah(partnerShare)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-orange-200/80 pt-1 dark:border-orange-900/60 font-bold text-orange-950 dark:text-orange-200">
                <span>Total Otomatis:</span>
                <span className="tabular-nums">
                  {formatRupiah(calc.grandTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
