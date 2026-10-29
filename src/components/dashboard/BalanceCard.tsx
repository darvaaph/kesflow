'use client';

import React from 'react';
import { CheckCircle2, HandHeart, Wallet } from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRupiah } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface BalanceCardProps {
  onOpenSettleUp: () => void;
}

export function BalanceCard({ onOpenSettleUp }: BalanceCardProps) {
  const {
    balance,
    netBalanceForCurrentUser,
    currentUser,
    partnerUser,
    userAId,
  } = useKesflow();

  const myName = currentUser?.display_name || 'Raka';
  const partnerName = partnerUser?.display_name || 'Nadin';

  const isCurrentUserA = (currentUser?.id ?? userAId) === userAId;
  const myTotalPaid = isCurrentUserA
    ? balance.totalPaidByA
    : balance.totalPaidByB;
  const partnerTotalPaid = isCurrentUserA
    ? balance.totalPaidByB
    : balance.totalPaidByA;

  const isSettled = netBalanceForCurrentUser === 0;
  const isOwedByPartner = netBalanceForCurrentUser > 0;

  let friendlyHeadline = 'Saldo kalian seimbang (Rp 0)';
  let friendlySubtext =
    'Tidak ada tanggungan yang perlu dilunasi saat ini. Siap untuk kencan berikutnya!';

  if (isOwedByPartner) {
    friendlyHeadline = `${partnerName} berhutang ke kamu ${formatRupiah(
      netBalanceForCurrentUser
    )}`;
    friendlySubtext = `Kamu (${myName}) sudah menalangi pengeluaran bersama sebesar ${formatRupiah(
      netBalanceForCurrentUser
    )}.`;
  } else if (!isSettled) {
    friendlyHeadline = `Kamu ditalangi ${partnerName} ${formatRupiah(
      Math.abs(netBalanceForCurrentUser)
    )}`;
    friendlySubtext = `Yuk lunasi ke ${partnerName} supaya catatan kencan kalian kembali seimbang.`;
  }

  return (
    <Card
      elevated
      className="relative overflow-hidden border-orange-200/90 bg-warm-peach/60 p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Wallet className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
            <span>Status Saldo Berjalan ({myName})</span>
          </div>
          {isSettled ? (
            <Badge variant="emerald">Lunas Seimbang</Badge>
          ) : isOwedByPartner ? (
            <Badge variant="coral">Menunggu Pelunasan</Badge>
          ) : (
            <Badge variant="amber">Perlu Dilunasi</Badge>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-lg sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
            {friendlyHeadline}
          </p>
          <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
            {friendlySubtext}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl border border-stone-200/80 bg-white/90 p-3 dark:border-stone-800 dark:bg-stone-950/70">
          <div className="flex sm:block items-center justify-between">
            <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
              Total Kencan Bersama
            </p>
            <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
              {formatRupiah(balance.totalDateExpense)}
            </p>
          </div>
          <div className="flex sm:block items-center justify-between border-t sm:border-t-0 sm:border-l border-stone-200 pt-1.5 sm:pt-0 sm:pl-2.5 dark:border-stone-800">
            <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
              Dibayar {myName}
            </p>
            <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
              {formatRupiah(myTotalPaid)}
            </p>
          </div>
          <div className="flex sm:block items-center justify-between border-t sm:border-t-0 sm:border-l border-stone-200 pt-1.5 sm:pt-0 sm:pl-2.5 dark:border-stone-800">
            <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
              Dibayar {partnerName}
            </p>
            <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
              {formatRupiah(partnerTotalPaid)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {isSettled ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Semua tagihan kencan sudah impas!</span>
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
                Tandai Lunas ({formatRupiah(Math.abs(netBalanceForCurrentUser))})
              </span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
