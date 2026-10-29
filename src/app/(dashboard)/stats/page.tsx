'use client';

import React from 'react';
import { CalendarRange, TrendingUp } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRupiah } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { CategoryPieChart } from '@/components/stats/CategoryPieChart';
import { ContributionRatio } from '@/components/stats/ContributionRatio';

export default function StatsPage() {
  const {
    transactions,
    categories,
    balance,
    profiles,
    userAId,
    userBId,
  } = useKesflow();

  const userAName =
    profiles.find((p) => p.id === userAId)?.display_name || 'Pasangan A';
  const userBName =
    profiles.find((p) => p.id === userBId)?.display_name || 'Pasangan B';

  const treatCount = transactions.filter(
    (t) => t.split_type === 'FULL_TREAT'
  ).length;
  const equalCount = transactions.filter(
    (t) => t.split_type === 'EQUAL_50_50'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Stats Date
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Ringkasan pengeluaran bersama dan kontribusi pembayaran kalian berdua.
        </p>
      </div>

      <Card
        elevated
        className="border-orange-200/90 bg-warm-peach/60 p-5 dark:border-stone-800 dark:bg-stone-900 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <CalendarRange className="h-4 w-4 text-orange-700 dark:text-orange-400" />
            <span>Total Pengeluaran Date</span>
          </div>
          <TrendingUp className="h-4 w-4 text-orange-700 dark:text-orange-400" />
        </div>

        <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
          {formatRupiah(balance.totalDateExpense)}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-700 dark:text-stone-300">
          <span>
            Total transaksi: <strong>{transactions.length} kali</strong>
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>
            Split 50:50: <strong>{equalCount}x</strong>
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>
            Total treat: <strong>{treatCount}x</strong>
          </span>
        </div>
      </Card>

      <CategoryPieChart
        transactions={transactions}
        categories={categories}
      />

      <ContributionRatio
        userAName={userAName}
        userBName={userBName}
        totalPaidByA={balance.totalPaidByA}
        totalPaidByB={balance.totalPaidByB}
      />
    </div>
  );
}
