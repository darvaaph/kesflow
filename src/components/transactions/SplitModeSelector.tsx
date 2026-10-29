'use client';

import React from 'react';
import { SplitType } from '@/types';
import {
  formatNumberInput,
  formatRupiah,
  parseNumberInput,
  formatShortName,
} from '@/lib/format';
import { Input } from '@/components/ui/Input';

export interface SplitModeSelectorProps {
  value: SplitType;
  onChange: (mode: SplitType) => void;
  totalAmount: number;
  payerName: string;
  otherName: string;
  userAName: string;
  userBName: string;
  customShareA: number;
  customShareB: number;
  onChangeCustomShares: (shareA: number, shareB: number) => void;
}

export function SplitModeSelector({
  value,
  onChange,
  totalAmount,
  payerName,
  otherName,
  userAName,
  userBName,
  customShareA,
  customShareB,
  onChangeCustomShares,
}: SplitModeSelectorProps) {
  const shortPayer = formatShortName(payerName, 12);
  const shortOther = formatShortName(otherName, 12);
  const shortNameA = formatShortName(userAName, 12);
  const shortNameB = formatShortName(userBName, 12);

  const modes: {
    id: SplitType;
    title: string;
    subtitle: string;
  }[] = [
    {
      id: 'EQUAL_50_50',
      title: 'Split 50:50',
      subtitle:
        totalAmount > 0
          ? `Masing-masing ${formatRupiah(totalAmount / 2)}`
          : 'Dibagi sama rata berdua',
    },
    {
      id: 'FULL_TREAT',
      title: 'Treat 100%',
      subtitle: `${shortPayer} treat penuh (saldo tetap Rp 0)`,
    },
    {
      id: 'FULL_OWE',
      title: 'Talangin Semua',
      subtitle: `${shortOther} ganti 100% ke ${shortPayer}`,
    },
    {
      id: 'CUSTOM',
      title: 'Custom',
      subtitle: 'Atur porsi nominal masing-masing manual',
    },
  ];

  const handleShareAChange = (raw: string) => {
    const numA = parseNumberInput(raw);
    const clampedA = totalAmount > 0 ? Math.min(numA, totalAmount) : numA;
    const autoB = Math.max(0, totalAmount - clampedA);
    onChangeCustomShares(clampedA, autoB);
  };

  const handleShareBChange = (raw: string) => {
    const numB = parseNumberInput(raw);
    const clampedB = totalAmount > 0 ? Math.min(numB, totalAmount) : numB;
    const autoA = Math.max(0, totalAmount - clampedB);
    onChangeCustomShares(autoA, clampedB);
  };

  const currentMode = modes.find((m) => m.id === value) || modes[0];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="shrink-0 text-xs font-semibold text-stone-700 dark:text-stone-300">
          Bagi Beban (Split)
        </span>
        <span className="truncate text-right text-[11px] font-medium text-orange-700 dark:text-orange-400">
          {currentMode.subtitle}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-stone-100 p-1 dark:bg-stone-800/80">
        {modes.map((m) => {
          const selected = value === m.id;
          const shortTitle =
            m.id === 'EQUAL_50_50'
              ? '50:50'
              : m.id === 'FULL_TREAT'
              ? 'Treat'
              : m.id === 'FULL_OWE'
              ? 'Talangin'
              : 'Custom';

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              aria-pressed={selected}
              className={`h-8 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                selected
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              {shortTitle}
            </button>
          );
        })}
      </div>

      {value === 'CUSTOM' && (
        <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-2.5 dark:border-stone-800 dark:bg-stone-950">
          <Input
            label={`Porsi ${shortNameA}`}
            labelClassName="text-xs font-semibold text-stone-700 dark:text-stone-300 truncate"
            prefixText="Rp"
            inputMode="numeric"
            placeholder="0"
            value={customShareA > 0 ? formatNumberInput(customShareA) : ''}
            onChange={(e) => handleShareAChange(e.target.value)}
          />
          <Input
            label={`Porsi ${shortNameB}`}
            labelClassName="text-xs font-semibold text-stone-700 dark:text-stone-300 truncate"
            prefixText="Rp"
            inputMode="numeric"
            placeholder="0"
            value={customShareB > 0 ? formatNumberInput(customShareB) : ''}
            onChange={(e) => handleShareBChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
