'use client';

import React from 'react';
import { formatRupiah } from '@/lib/format';
import { Card } from '@/components/ui/Card';

export interface ContributionRatioProps {
  userAName: string;
  userBName: string;
  totalPaidByA: number;
  totalPaidByB: number;
}

export function ContributionRatio({
  userAName,
  userBName,
  totalPaidByA,
  totalPaidByB,
}: ContributionRatioProps) {
  const combined = totalPaidByA + totalPaidByB;
  const percentA =
    combined > 0 ? Math.round((totalPaidByA / combined) * 100) : 50;
  const percentB = combined > 0 ? 100 - percentA : 50;

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
          Bagaimana perbandingan pembayaran nyata kalian berdua?
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Menghitung seluruh pembayaran di kasir (termasuk traktir penuh).
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-orange-800 dark:text-orange-300">
            {userAName} ({percentA}%)
          </span>
          <span className="text-stone-800 dark:text-stone-200">
            {userBName} ({percentB}%)
          </span>
        </div>

        <div
          className="flex h-4 w-full overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
          role="img"
          aria-label={`Rasio pembayaran: ${userAName} ${percentA} persen, ${userBName} ${percentB} persen`}
        >
          <div
            className="h-full bg-orange-700 transition-all duration-300"
            style={{ width: `${percentA}%` }}
          />
          <div
            className="h-full bg-stone-700 dark:bg-stone-400 transition-all duration-300"
            style={{ width: `${percentB}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Total Dibayar {userAName}
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
              {formatRupiah(totalPaidByA)}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Total Dibayar {userBName}
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
              {formatRupiah(totalPaidByB)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
