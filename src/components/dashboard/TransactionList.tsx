'use client';

import React from 'react';
import { AlertCircle, Plus, ReceiptText } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { TransactionItem } from './TransactionItem';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface TransactionListProps {
  eventFilterId?: string | null;
  onOpenAddTransaction?: () => void;
}

export function TransactionList({
  eventFilterId,
  onOpenAddTransaction,
}: TransactionListProps) {
  const {
    transactions,
    categories,
    events,
    currentUser,
    partnerUser,
    userAId,
    isLoading,
    error,
    clearError,
    deleteTransaction,
  } = useKesflow();

  const filteredTransactions = eventFilterId
    ? transactions.filter((t) => t.event_id === eventFilterId)
    : transactions;

  if (isLoading) {
    return (
      <Card className="p-6 text-center space-y-2" aria-busy="true">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-orange-700" />
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Memuat riwayat transaksi kencan kalian...
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        role="alert"
        className="border-red-300 bg-red-50/80 p-4 dark:border-red-900 dark:bg-red-950/40 space-y-3"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-900 dark:text-red-200">
              Gagal menyinkronkan catatan transaksi
            </p>
            <p className="text-xs text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={clearError}>
          Coba Lagi
        </Button>
      </Card>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <Card className="p-6 text-center space-y-3">
        <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Belum ada catatan pengeluaran kencan
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {eventFilterId
              ? 'Belum ada transaksi yang ditandai pada momen kencan ini. Tambahkan pengeluaran baru untuk mulai melacak biaya momen ini.'
              : 'Ketuk salah satu tombol cepat di atas (seperti Parkir Rp 2.000) atau catat pengeluaran lengkap pertama kalian.'}
          </p>
        </div>
        {onOpenAddTransaction && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenAddTransaction}
          >
            <Plus className="h-4 w-4" />
            <span>Catat Pengeluaran Pertama</span>
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {filteredTransactions.map((tx) => {
        const cat = categories.find((c) => c.id === tx.category_id);
        const evt = events.find((e) => e.id === tx.event_id);
        return (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            category={cat}
            event={evt}
            currentUser={currentUser}
            partnerUser={partnerUser}
            userAId={userAId}
            onDelete={deleteTransaction}
          />
        );
      })}
    </div>
  );
}
