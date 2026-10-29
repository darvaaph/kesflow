'use client';

import React, { useState } from 'react';
import { CheckCircle2, History, Plus } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRelativeDate, formatRupiah } from '@/lib/format';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { QuickPresets } from '@/components/dashboard/QuickPresets';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddTransactionDrawer } from '@/components/transactions/AddTransactionDrawer';
import { SettleUpModal } from '@/components/transactions/SettleUpModal';
import { ActivityMutationSheet } from '@/components/transactions/ActivityMutationSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const { settlements, profiles } = useKesflow();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isMutationOpen, setIsMutationOpen] = useState(false);

  const getUserName = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name || 'Pasangan';

  return (
    <div className="space-y-6">
      <BalanceCard onOpenSettleUp={() => setIsSettleOpen(true)} />

      <QuickPresets />

      <section aria-labelledby="recent-transactions-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="recent-transactions-heading"
            className="text-sm font-bold text-stone-900 dark:text-stone-100"
          >
            Riwayat Belanja Kencan
          </h2>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 whitespace-nowrap"
              onClick={() => setIsMutationOpen(true)}
            >
              <History className="h-4 w-4 text-stone-700 dark:text-stone-300" />
              <span>Log Mutasi</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 whitespace-nowrap"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-4 w-4 text-orange-700 dark:text-orange-400" />
              <span>Catat Lengkap</span>
            </Button>
          </div>
        </div>

        <TransactionList onOpenAddTransaction={() => setIsAddOpen(true)} />
      </section>

      {settlements.length > 0 && (
        <section aria-labelledby="settlements-heading" className="space-y-2.5">
          <h2
            id="settlements-heading"
            className="text-xs font-bold text-stone-700 dark:text-stone-300"
          >
            Riwayat Pelunasan Saldo (Settle Up)
          </h2>
          <div className="space-y-2">
            {settlements.map((st) => (
              <Card
                key={st.id}
                className="flex items-center justify-between gap-3 border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-snug text-stone-900 dark:text-stone-100">
                      {getUserName(st.from_user_id)} melunasi ke{' '}
                      {getUserName(st.to_user_id)}
                    </p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      {formatRelativeDate(st.settled_at)}
                      {st.notes ? ` · ${st.notes}` : ''}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-extrabold text-emerald-900 dark:text-emerald-200 tabular-nums whitespace-nowrap">
                  {formatRupiah(Number(st.amount))}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      <AddTransactionDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
      />

      <ActivityMutationSheet
        isOpen={isMutationOpen}
        onClose={() => setIsMutationOpen(false)}
      />
    </div>
  );
}
