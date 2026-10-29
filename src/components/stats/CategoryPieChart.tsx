'use client';

import React, { useMemo } from 'react';
import { Category, Transaction } from '@/types';
import { formatRupiah } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

export interface CategoryPieChartProps {
  transactions: Transaction[];
  categories: Category[];
}

interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}

export function CategoryPieChart({
  transactions,
  categories,
}: CategoryPieChartProps) {
  const { items, grandTotal } = useMemo(() => {
    const totalsByCat = new Map<string, number>();
    let sum = 0;

    for (const tx of transactions) {
      const catId = tx.category_id || 'cat-other';
      const amt = Number(tx.amount);
      totalsByCat.set(catId, (totalsByCat.get(catId) ?? 0) + amt);
      sum += amt;
    }

    const breakdown: CategoryBreakdownItem[] = Array.from(
      totalsByCat.entries()
    )
      .map(([catId, total]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          categoryId: catId,
          name: cat?.name || 'Lain-lain',
          icon: cat?.icon || 'MoreHorizontal',
          color: cat?.color || '#c2410c',
          total,
          percentage: sum > 0 ? Math.round((total / sum) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { items: breakdown, grandTotal: sum };
  }, [transactions, categories]);

  if (items.length === 0 || grandTotal === 0) {
    return (
      <Card className="p-5 space-y-2">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
          Kategori apa yang paling banyak menyerap biaya kencan?
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Belum ada transaksi tercatat. Catat pengeluaran kencan pertama kalian
          untuk melihat rincian kategori.
        </p>
      </Card>
    );
  }

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
          Kategori apa yang paling banyak menyerap biaya kencan?
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Terbesar: <strong>{items[0].name}</strong> ({items[0].percentage}% dari
          total pengeluaran)
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 140 140"
            className="h-36 w-36 -rotate-90"
            role="img"
            aria-label="Diagram lingkaran distribusi kategori pengeluaran kencan"
          >
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#e7e5e4"
              strokeWidth="18"
            />
            {items.map((item) => {
              const fraction = item.total / grandTotal;
              const strokeLength = fraction * circumference;
              const strokeOffset = -cumulativePercent * circumference;
              cumulativePercent += fraction;
              return (
                <circle
                  key={item.categoryId}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="18"
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
            <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400">
              Terboros
            </span>
            <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
              {items[0].name.split(' ')[0]}
            </span>
            <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 tabular-nums">
              {items[0].percentage}%
            </span>
          </div>
        </div>

        <div className="w-full space-y-2.5">
          {items.map((item) => (
            <div
              key={item.categoryId}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <CategoryIcon
                  name={item.icon}
                  className="h-3.5 w-3.5 shrink-0 text-stone-600 dark:text-stone-400"
                />
                <span className="font-semibold leading-snug text-stone-800 dark:text-stone-200">
                  {item.name}
                </span>
              </div>
              <div className="shrink-0 text-right tabular-nums whitespace-nowrap">
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {formatRupiah(item.total)}
                </span>
                <span className="ml-1.5 text-stone-600 dark:text-stone-400">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
