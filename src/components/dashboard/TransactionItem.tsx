'use client';

import React, { useMemo, useState } from 'react';
import {
  History,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Category, DateEvent, Profile, Transaction } from '@/types';
import { useKesflow } from '@/context/KesflowContext';
import { formatRelativeDate, formatRupiah } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { AddTransactionDrawer } from '@/components/transactions/AddTransactionDrawer';

export interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  event?: DateEvent;
  currentUser: Profile | null;
  partnerUser: Profile | null;
  userAId: string;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionItem({
  transaction,
  category,
  event,
  currentUser,
  partnerUser,
  userAId,
  onDelete,
}: TransactionItemProps) {
  const { activityLogs } = useKesflow();
  const [showDetail, setShowDetail] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const myId = currentUser?.id ?? userAId;
  const myName = currentUser?.display_name || 'Raka';
  const partnerName = partnerUser?.display_name || 'Nadin';

  const paidByMe = transaction.payer_id === myId;
  const payerLabel = paidByMe ? `${myName} (Kamu)` : partnerName;

  const txLogs = useMemo(
    () => activityLogs.filter((l) => l.target_id === transaction.id),
    [activityLogs, transaction.id]
  );

  const latestEditLog = useMemo(
    () => txLogs.find((l) => l.action_type === 'TX_UPDATED') ?? null,
    [txLogs]
  );

  const getSplitLabel = () => {
    switch (transaction.split_type) {
      case 'EQUAL_50_50':
        return 'Split 50:50';
      case 'FULL_TREAT':
        return 'Treat 100%';
      case 'FULL_OWE':
        return 'Talangin';
      case 'CUSTOM':
        return 'Custom';
    }
  };

  const getSplitBadge = () => {
    switch (transaction.split_type) {
      case 'EQUAL_50_50':
        return <Badge variant="neutral">Split 50:50</Badge>;
      case 'FULL_TREAT':
        return <Badge variant="emerald">Treat 100%</Badge>;
      case 'FULL_OWE':
        return <Badge variant="coral">Talangin Semua</Badge>;
      case 'CUSTOM':
        return <Badge variant="violet">Custom</Badge>;
    }
  };

  const getImpactText = () => {
    const isMeUserA = myId === userAId;
    const myShare = isMeUserA
      ? Number(transaction.user_a_share)
      : Number(transaction.user_b_share);
    const partnerShare = isMeUserA
      ? Number(transaction.user_b_share)
      : Number(transaction.user_a_share);

    if (transaction.split_type === 'FULL_TREAT') {
      return paidByMe
        ? `Kamu treat ${partnerName}`
        : `Treat (Rp 0)`;
    }

    if (paidByMe) {
      return `Kamu nalangi ${formatRupiah(partnerShare)}`;
    }
    return `Bagianmu ${formatRupiah(myShare)}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      setShowDetail(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = () => {
    setShowDetail(false);
    setShowEditDrawer(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDetail(true)}
        className="w-full rounded-2xl border border-stone-200/90 bg-white p-3 text-left transition-colors hover:border-stone-300 hover:bg-stone-50/70 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
              <CategoryIcon
                name={category?.icon || 'MoreHorizontal'}
                className="h-5 w-5"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-bold leading-tight text-stone-900 dark:text-stone-100 truncate">
                  {transaction.title}
                </p>
                {transaction.receipt_url && (
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-stone-500 dark:text-stone-400">
                <span>{paidByMe ? 'Kamu' : partnerName}</span>
                <span aria-hidden="true">&middot;</span>
                <span>{formatRelativeDate(transaction.spent_at)}</span>
                <span aria-hidden="true">&middot;</span>
                <span className="font-medium text-stone-600 dark:text-stone-300">
                  {getSplitLabel()}
                </span>
                {event && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400 truncate max-w-[90px]">
                      {event.title}
                    </span>
                  </>
                )}
                {latestEditLog && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Diubah {latestEditLog.actor_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right space-y-0.5">
            <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
              {formatRupiah(Number(transaction.amount))}
            </p>
            <p
              className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                transaction.split_type === 'FULL_TREAT'
                  ? 'text-stone-500 dark:text-stone-400'
                  : paidByMe
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-orange-700 dark:text-orange-400'
              }`}
            >
              {getImpactText()}
            </p>
          </div>
        </div>
      </button>

      <BottomSheet
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Detail Pengeluaran Date"
        description={formatRelativeDate(transaction.spent_at)}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Judul Pengeluaran
              </span>
              <span className="text-sm font-bold text-right text-stone-900 dark:text-stone-100">
                {transaction.title}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Kategori
              </span>
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                {category?.name || 'Lain-lain'}
              </span>
            </div>
            {event && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  Momen
                </span>
                <Badge variant="amber">{event.title}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Total Nominal
              </span>
              <span className="text-base font-extrabold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
                {formatRupiah(Number(transaction.amount))}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Dibayar Oleh
              </span>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {payerLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Skema Pembagian
              </span>
              <div>{getSplitBadge()}</div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Porsi Beban Berdua
              </span>
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 tabular-nums whitespace-nowrap">
                {formatRupiah(Number(transaction.user_a_share))} /{' '}
                {formatRupiah(Number(transaction.user_b_share))}
              </span>
            </div>
            {transaction.notes && (
              <div className="border-t border-stone-200 pt-2 dark:border-stone-800">
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Catatan:
                </p>
                <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                  {transaction.notes}
                </p>
              </div>
            )}
          </div>

          {txLogs.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-900/60 space-y-2">
              <div className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-orange-700 dark:text-orange-400" />
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Riwayat Perubahan
                </p>
              </div>
              <div className="space-y-2">
                {txLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-stone-200/80 bg-white p-2.5 text-xs dark:border-stone-800 dark:bg-stone-950 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {log.action_type === 'TX_UPDATED'
                          ? `Diubah oleh ${log.actor_name}`
                          : `Dicatat oleh ${log.actor_name}`}
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 whitespace-nowrap">
                        {formatRelativeDate(log.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-300 break-words">
                      {log.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transaction.receipt_url && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Lampiran Foto Struk
              </p>
              <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={transaction.receipt_url}
                  alt={`Struk pembayaran ${transaction.title}`}
                  className="max-h-72 w-full object-contain"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenEdit}
            >
              <Pencil className="h-4 w-4" />
              <span>Edit Transaksi</span>
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Catatan'}</span>
            </Button>
          </div>
        </div>
      </BottomSheet>

      <AddTransactionDrawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        initialTransaction={transaction}
      />
    </>
  );
}
