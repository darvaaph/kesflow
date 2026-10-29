'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, HandHeart, Receipt } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRelativeDate, formatRupiah } from '@/lib/format';
import { buildBalanceEntries, buildDebtSummary } from '@/lib/balanceView';
import { SplitType } from '@/types';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

const SPLIT_LABELS: Record<SplitType, string> = {
  EQUAL_50_50: 'Split 50:50',
  FULL_TREAT: 'Treat 100%',
  FULL_OWE: 'Talangin Semua',
  CUSTOM: 'Custom',
};

const COLLAPSED_COUNT = 8;

export interface BalanceDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettleUp: () => void;
}

export function BalanceDetailSheet({
  isOpen,
  onClose,
  onOpenSettleUp,
}: BalanceDetailSheetProps) {
  const {
    balance,
    balanceBreakdownForA,
    transactions,
    settlements,
    currentUser,
    partnerUser,
    userAId,
    userBId,
  } = useKesflow();
  const [showAll, setShowAll] = useState(false);

  const myId = currentUser?.id ?? userAId;
  const myName = currentUser?.display_name || 'Raka';
  const partnerName = partnerUser?.display_name || 'Nadin';
  const isMeA = myId === userAId;

  const summary = useMemo(
    () => buildDebtSummary(balanceBreakdownForA, isMeA),
    [balanceBreakdownForA, isMeA]
  );

  const { entries, neutralTransactionCount } = useMemo(
    () =>
      buildBalanceEntries(
        userAId,
        userBId,
        isMeA,
        summary.partnerOwesMe,
        transactions,
        settlements
      ),
    [userAId, userBId, isMeA, summary.partnerOwesMe, transactions, settlements]
  );

  const nameOf = (id: string) => (id === myId ? myName : partnerName);
  const creditorName = summary.partnerOwesMe ? myName : partnerName;
  const debtorName = summary.partnerOwesMe ? partnerName : myName;

  const headline = summary.isSettled
    ? 'Saldo kalian seimbang'
    : summary.partnerOwesMe
    ? `${partnerName} masih utang ke kamu`
    : `Kamu masih utang ke ${partnerName}`;

  const settledDisplay =
    summary.settled > 0
      ? `−${formatRupiah(summary.settled)}`
      : summary.settled < 0
      ? `+${formatRupiah(-summary.settled)}`
      : formatRupiah(0);

  const visibleEntries = showAll ? entries : entries.slice(0, COLLAPSED_COUNT);

  const handleSettle = () => {
    onClose();
    onOpenSettleUp();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Saldo"
      description="Dari mana angka utang ini berasal."
    >
      <div className="space-y-5">
        <section
          aria-label="Perhitungan saldo"
          className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 dark:border-orange-900 dark:bg-orange-950/40"
        >
          <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
            {headline}
          </p>

          <dl className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <dt className="font-medium text-stone-800 dark:text-stone-200">
                  Total talangan (net)
                </dt>
                {summary.offsetOwed > 0 && (
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                    {creditorName} menalangi{' '}
                    {formatRupiah(summary.creditorOwed)}, dikurangi{' '}
                    {debtorName} menalangi {formatRupiah(summary.offsetOwed)}
                  </p>
                )}
              </div>
              <dd className="shrink-0 font-bold tabular-nums text-stone-900 dark:text-stone-100">
                {formatRupiah(summary.transactionNet)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-medium text-stone-800 dark:text-stone-200">
                Udah dibayar
              </dt>
              <dd className="shrink-0 font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                {settledDisplay}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-orange-200 pt-2 dark:border-orange-900">
              <dt className="font-bold text-stone-900 dark:text-stone-100">
                Sisa
              </dt>
              <dd className="text-lg font-extrabold tabular-nums text-orange-900 dark:text-orange-200">
                {formatRupiah(summary.remaining)}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="balance-entries-heading" className="space-y-2.5">
          <div className="space-y-0.5">
            <h3
              id="balance-entries-heading"
              className="text-sm font-bold text-stone-900 dark:text-stone-100"
            >
              Yang membentuk saldo ini
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Tiap baris menunjukkan pengaruhnya ke sisa utang{' '}
              {debtorName}.
            </p>
          </div>

          {entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-xs text-stone-600 dark:border-stone-700 dark:text-stone-400">
              Belum ada transaksi yang memengaruhi saldo.
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleEntries.map((entry) => {
                const adds = entry.delta > 0;
                const amountText = `${adds ? '+' : '−'}${formatRupiah(
                  Math.abs(entry.delta)
                )}`;
                return (
                  <li
                    key={`${entry.kind}-${entry.id}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          entry.kind === 'settlement'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {entry.kind === 'settlement' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Receipt className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100">
                          {entry.kind === 'settlement'
                            ? `${nameOf(entry.fromUserId)} udah bayar ke ${nameOf(
                                entry.toUserId
                              )}`
                            : entry.title}
                        </p>
                        <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                          {entry.kind === 'settlement'
                            ? `${formatRelativeDate(entry.date)}${
                                entry.notes ? ` · ${entry.notes}` : ''
                              }`
                            : `Dibayar ${nameOf(entry.payerId)} · ${
                                SPLIT_LABELS[entry.splitType]
                              } · ${formatRelativeDate(entry.date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-extrabold tabular-nums whitespace-nowrap ${
                          adds
                            ? 'text-orange-800 dark:text-orange-300'
                            : 'text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {amountText}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {adds ? 'menambah' : 'mengurangi'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {entries.length > COLLAPSED_COUNT && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? 'Tampilkan lebih sedikit'
                : `Tampilkan semua (${entries.length})`}
            </Button>
          )}

          {neutralTransactionCount > 0 && (
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {neutralTransactionCount} transaksi lain (mis. treat 100%) tidak
              memengaruhi saldo.
            </p>
          )}
        </section>

        <section
          aria-label="Total pengeluaran bersama"
          className="space-y-1.5 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs dark:border-stone-800 dark:bg-stone-900/60"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-stone-600 dark:text-stone-400">
              Total pengeluaran bersama
            </span>
            <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
              {formatRupiah(balance.totalDateExpense)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-stone-600 dark:text-stone-400">
              Dibayar {myName}
            </span>
            <span className="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {formatRupiah(
                isMeA ? balance.totalPaidByA : balance.totalPaidByB
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-stone-600 dark:text-stone-400">
              Dibayar {partnerName}
            </span>
            <span className="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {formatRupiah(
                isMeA ? balance.totalPaidByB : balance.totalPaidByA
              )}
            </span>
          </div>
        </section>

        {!summary.isSettled && (
          <Button type="button" fullWidth onClick={handleSettle}>
            <HandHeart className="h-4 w-4 shrink-0" />
            <span>Settle Up ({formatRupiah(summary.remaining)})</span>
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}
