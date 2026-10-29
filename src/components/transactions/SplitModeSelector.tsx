'use client';

import React from 'react';
import { SplitType } from '@/types';
import { formatNumberInput, formatRupiah, parseNumberInput } from '@/lib/format';
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
      subtitle: `${payerName} treat penuh (saldo tetap Rp 0)`,
    },
    {
      id: 'FULL_OWE',
      title: 'Talangin Semua',
      subtitle: `${otherName} mengganti 100% ke ${payerName}`,
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

  return (
    <div className="space-y-3">
      <p className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        Mode Split
      </p>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((m) => {
          const selected = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              aria-pressed={selected}
              className={`flex min-h-[60px] flex-col justify-center rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                selected
                  ? 'border-orange-700 bg-orange-50/90 text-stone-900 dark:border-orange-500 dark:bg-orange-950/50 dark:text-stone-100'
                  : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
              }`}
            >
              <span className="text-xs font-bold">{m.title}</span>
              <span className="mt-0.5 text-[11px] leading-snug text-stone-600 dark:text-stone-400">
                {m.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {value === 'CUSTOM' && (
        <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <Input
            label={`Porsi ${userAName}`}
            prefixText="Rp"
            inputMode="numeric"
            placeholder="0"
            value={customShareA > 0 ? formatNumberInput(customShareA) : ''}
            onChange={(e) => handleShareAChange(e.target.value)}
          />
          <Input
            label={`Porsi ${userBName}`}
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
