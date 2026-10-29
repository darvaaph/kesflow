import {
  getSettlementImpactForA,
  getTransactionImpactForA,
  type BalanceBreakdown,
} from './balance';
import type { Settlement, SplitType, Transaction } from '@/types';

/**
 * Ringkasan rumus saldo yang diorientasikan ke arah hutang saat ini,
 * sehingga selalu terbaca: talangan bersih - sudah dilunasi = sisa.
 */
export interface DebtSummary {
  /** true jika pasangan yang berhutang ke pengguna (atau saldo seimbang). */
  partnerOwesMe: boolean;
  isSettled: boolean;
  /** Sisa hutang (selalu >= 0). */
  remaining: number;
  /** Talangan bersih dari semua transaksi sebelum pelunasan. */
  transactionNet: number;
  /** Total pelunasan yang sudah mengurangi hutang. */
  settled: number;
  /** Total talangan pihak yang dihutangi (kreditur). */
  creditorOwed: number;
  /** Total talangan pihak yang berhutang (pengurang). */
  offsetOwed: number;
}

export function buildDebtSummary(
  breakdownForA: BalanceBreakdown,
  isMeA: boolean
): DebtSummary {
  const orient = isMeA ? 1 : -1;
  const netMine = breakdownForA.netBalanceForA * orient;
  const partnerOwesMe = netMine >= 0;
  const d = partnerOwesMe ? 1 : -1;

  const owedToMe = isMeA ? breakdownForA.owedToA : breakdownForA.owedByA;
  const owedByMe = isMeA ? breakdownForA.owedByA : breakdownForA.owedToA;

  return {
    partnerOwesMe,
    isSettled: netMine === 0,
    remaining: Math.abs(netMine),
    transactionNet: breakdownForA.transactionNetForA * orient * d,
    settled: breakdownForA.settledForA * orient * d,
    creditorOwed: partnerOwesMe ? owedToMe : owedByMe,
    offsetOwed: partnerOwesMe ? owedByMe : owedToMe,
  };
}

export type BalanceEntry =
  | {
      kind: 'transaction';
      id: string;
      title: string;
      date: string;
      payerId: string;
      splitType: SplitType;
      /** > 0 menambah sisa hutang, < 0 mengurangi. */
      delta: number;
    }
  | {
      kind: 'settlement';
      id: string;
      title: string;
      date: string;
      fromUserId: string;
      toUserId: string;
      notes: string | null;
      delta: number;
    };

export interface BalanceEntries {
  /** Baris yang memengaruhi sisa, terbaru dulu. */
  entries: BalanceEntry[];
  /** Jumlah transaksi yang tidak mengubah saldo (mis. traktir 100%). */
  neutralTransactionCount: number;
}

/**
 * Daftar transaksi + pelunasan yang membentuk saldo. Jumlah seluruh delta
 * sama dengan DebtSummary.remaining.
 */
export function buildBalanceEntries(
  userAId: string,
  userBId: string,
  isMeA: boolean,
  partnerOwesMe: boolean,
  transactions: Transaction[],
  settlements: Settlement[]
): BalanceEntries {
  const orient = isMeA ? 1 : -1;
  const d = partnerOwesMe ? 1 : -1;
  const entries: BalanceEntry[] = [];
  let neutralTransactionCount = 0;

  for (const tx of transactions) {
    const impactForA = getTransactionImpactForA(tx, userAId, userBId);
    if (impactForA === 0) {
      neutralTransactionCount += 1;
      continue;
    }
    entries.push({
      kind: 'transaction',
      id: tx.id,
      title: tx.title,
      date: tx.spent_at,
      payerId: tx.payer_id,
      splitType: tx.split_type,
      delta: impactForA * orient * d,
    });
  }

  for (const st of settlements) {
    const impactForA = getSettlementImpactForA(st, userAId, userBId);
    if (impactForA === 0) continue;
    entries.push({
      kind: 'settlement',
      id: st.id,
      title: 'Pelunasan',
      date: st.settled_at,
      fromUserId: st.from_user_id,
      toUserId: st.to_user_id,
      notes: st.notes,
      delta: impactForA * orient * d,
    });
  }

  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { entries, neutralTransactionCount };
}
