'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, HandHeart, Wallet } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRupiah } from '@/lib/format';
import { buildDebtSummary } from '@/lib/balanceView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BalanceDetailSheet } from '@/components/dashboard/BalanceDetailSheet';

export interface BalanceCardProps {
  onOpenSettleUp: () => void;
}

export function BalanceCard({ onOpenSettleUp }: BalanceCardProps) {
  const {
    balanceBreakdownForA,
    netBalanceForCurrentUser,
    transactions,
    settlements,
    currentUser,
    partnerUser,
    userAId,
  } = useKesflow();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const myName = currentUser?.display_name || 'Kamu';
  const partnerName = partnerUser?.display_name || 'Pasangan';

  const isMeA = (currentUser?.id ?? userAId) === userAId;
  const summary = useMemo(
    () => buildDebtSummary(balanceBreakdownForA, isMeA),
    [balanceBreakdownForA, isMeA]
  );

  const isSettled = netBalanceForCurrentUser === 0;
  const isOwedByPartner = netBalanceForCurrentUser > 0;

  let friendlyHeadline = 'Saldo kalian seimbang (Rp 0)';
  let friendlySubtext =
    'Nggak ada yang perlu dibayar saat ini. Siap buat date berikutnya!';

  if (!partnerUser) {
    friendlyHeadline = 'Menunggu Pasangan Bergabung';
    friendlySubtext =
      'Bagikan kode undangan ke pacar/pasanganmu agar saldo otomatis terhitung berdua.';
  } else if (isOwedByPartner) {
    friendlyHeadline = `${partnerName} masih utang ke kamu ${formatRupiah(
      netBalanceForCurrentUser
    )}`;
    friendlySubtext = `Kamu (${myName}) sudah menalangi pengeluaran bersama sebesar ${formatRupiah(
      netBalanceForCurrentUser
    )}.`;
  } else if (!isSettled) {
    friendlyHeadline = `Kamu masih utang ke ${partnerName} ${formatRupiah(
      Math.abs(netBalanceForCurrentUser)
    )}`;
    friendlySubtext = `Yuk bayar ke ${partnerName} biar saldo date kalian impas lagi.`;
  }

  const settledDisplay =
    summary.settled > 0
      ? `−${formatRupiah(summary.settled)}`
      : summary.settled < 0
      ? `+${formatRupiah(-summary.settled)}`
      : formatRupiah(0);

  return (
    <>
    <Card
      elevated
      className="relative overflow-hidden border-orange-200/90 bg-warm-peach/60 p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Wallet className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
            <span>Saldo Kita ({myName})</span>
          </div>
          {isSettled ? (
            <Badge variant="emerald">Impas</Badge>
          ) : isOwedByPartner ? (
            <Badge variant="coral">Belum Lunas</Badge>
          ) : (
            <Badge variant="amber">Perlu Dibayar</Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsDetailOpen(true)}
          aria-haspopup="dialog"
          className="block w-full space-y-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
        >
          <div className="space-y-1">
            <p className="text-lg sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
              {friendlyHeadline}
            </p>
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {friendlySubtext}
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-stone-200/80 bg-white/90 p-3 text-xs dark:border-stone-800 dark:bg-stone-950/70">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-stone-700 dark:text-stone-300">
                Total talangan (net)
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
                {formatRupiah(summary.transactionNet)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-stone-700 dark:text-stone-300">
                Udah dibayar
              </span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 tabular-nums whitespace-nowrap">
                {settledDisplay}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-1.5 dark:border-stone-800">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                Sisa
              </span>
              <span className="text-sm font-extrabold text-orange-900 dark:text-orange-200 tabular-nums whitespace-nowrap">
                {formatRupiah(summary.remaining)}
              </span>
            </div>
          </div>

          <span className="flex min-h-[44px] items-center justify-between gap-2 text-xs font-semibold text-orange-800 dark:text-orange-300">
            <span>
              Lihat detail · {transactions.length} transaksi,{' '}
              {settlements.length} settle up
            </span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </span>
        </button>

        <div className="flex items-center justify-between gap-3">
          {isSettled ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Semua tagihan date udah impas!</span>
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={onOpenSettleUp}
            >
              <HandHeart className="h-4 w-4 shrink-0" />
              <span>
                Settle Up ({formatRupiah(Math.abs(netBalanceForCurrentUser))})
              </span>
            </Button>
          )}
        </div>
      </div>
    </Card>
    <BalanceDetailSheet
      isOpen={isDetailOpen}
      onClose={() => setIsDetailOpen(false)}
      onOpenSettleUp={onOpenSettleUp}
    />
    </>
  );
}
