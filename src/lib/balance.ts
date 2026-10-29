import {
  BalanceCalculationSettlement,
  BalanceCalculationTransaction,
  RunningBalanceResult,
  SplitType,
} from '@/types';

/**
 * Menghitung porsi beban User A dan User B sesuai aturan SPLIT_BILL_LOGIC.md
 */
export function computeTransactionShares(
  amount: number,
  splitType: SplitType,
  payerId: string,
  userAId: string,
  customUserAShare?: number,
  customUserBShare?: number
): { user_a_share: number; user_b_share: number } {
  const cleanAmount = Math.max(0, Number(amount));

  switch (splitType) {
    case 'EQUAL_50_50': {
      const half = cleanAmount / 2;
      return {
        user_a_share: half,
        user_b_share: half,
      };
    }
    case 'FULL_TREAT': {
      // Pembayar menanggung 100%, pihak lain 0%
      if (payerId === userAId) {
        return { user_a_share: cleanAmount, user_b_share: 0 };
      }
      return { user_a_share: 0, user_b_share: cleanAmount };
    }
    case 'FULL_OWE': {
      // Pembayar menalangi penuh 100% untuk pasangannya
      if (payerId === userAId) {
        return { user_a_share: 0, user_b_share: cleanAmount };
      }
      return { user_a_share: cleanAmount, user_b_share: 0 };
    }
    case 'CUSTOM': {
      const shareA = Math.max(0, Number(customUserAShare ?? 0));
      const shareB =
        customUserBShare !== undefined
          ? Math.max(0, Number(customUserBShare))
          : Math.max(0, cleanAmount - shareA);
      return {
        user_a_share: shareA,
        user_b_share: shareB,
      };
    }
  }
}

/**
 * Dampak satu transaksi terhadap saldo dari sudut pandang User A.
 * > 0 : User B berhutang ke User A, < 0 : User A berhutang ke User B.
 */
export function getTransactionImpactForA(
  tx: BalanceCalculationTransaction,
  userAId: string,
  userBId: string
): number {
  const amount = Number(tx.amount);
  const shareA = Number(tx.user_a_share);
  const shareB = Number(tx.user_b_share);

  switch (tx.split_type) {
    case 'EQUAL_50_50': {
      if (tx.payer_id === userAId) return amount / 2;
      if (tx.payer_id === userBId) return -amount / 2;
      return 0;
    }
    case 'FULL_TREAT': {
      // Traktir penuh tidak menambah hutang/piutang sama sekali
      return 0;
    }
    case 'FULL_OWE': {
      if (tx.payer_id === userAId) return amount;
      if (tx.payer_id === userBId) return -amount;
      return 0;
    }
    case 'CUSTOM': {
      if (tx.payer_id === userAId) return shareB;
      if (tx.payer_id === userBId) return -shareA;
      return 0;
    }
  }
}

/**
 * Dampak satu pelunasan terhadap saldo dari sudut pandang User A.
 */
export function getSettlementImpactForA(
  st: BalanceCalculationSettlement,
  userAId: string,
  userBId: string
): number {
  const settlementAmount = Number(st.amount);
  if (st.from_user_id === userBId && st.to_user_id === userAId) {
    // User B melunasi hutang ke User A -> piutang A berkurang
    return -settlementAmount;
  }
  if (st.from_user_id === userAId && st.to_user_id === userBId) {
    // User A melunasi hutang ke User B -> kewajiban hutang A berkurang (menuju 0)
    return settlementAmount;
  }
  return 0;
}

/**
 * Menghitung Saldo Berjalan (Net Running Balance) dari sudut pandang User A
 * sesuai spesifikasi di SPLIT_BILL_LOGIC.md.
 *
 * - netBalanceForA > 0 : User B berhutang kepada User A sebesar netBalanceForA
 * - netBalanceForA < 0 : User A berhutang kepada User B sebesar |netBalanceForA|
 * - netBalanceForA = 0 : Kondisi Seimbang / Lunas Sempurna (Rp 0)
 */
export function calculateRunningBalance(
  userAId: string,
  userBId: string,
  transactions: BalanceCalculationTransaction[],
  settlements: BalanceCalculationSettlement[]
): RunningBalanceResult {
  let netBalanceForA = 0;
  let totalDateExpense = 0;
  let totalPaidByA = 0;
  let totalPaidByB = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);

    totalDateExpense += amount;

    if (tx.payer_id === userAId) {
      totalPaidByA += amount;
    } else if (tx.payer_id === userBId) {
      totalPaidByB += amount;
    }

    netBalanceForA += getTransactionImpactForA(tx, userAId, userBId);
  }

  for (const st of settlements) {
    netBalanceForA += getSettlementImpactForA(st, userAId, userBId);
  }

  // Hindari -0 pada JavaScript floating point
  if (Object.is(netBalanceForA, -0) || Math.abs(netBalanceForA) < 0.005) {
    netBalanceForA = 0;
  }

  return {
    netBalanceForA,
    totalDateExpense,
    totalPaidByA,
    totalPaidByB,
  };
}

export interface BalanceBreakdown {
  /** Total piutang A dari transaksi yang A bayarkan (porsi B). */
  owedToA: number;
  /** Total hutang A dari transaksi yang B bayarkan (porsi A). */
  owedByA: number;
  /** owedToA - owedByA: selisih talangan bersih sebelum pelunasan. */
  transactionNetForA: number;
  /** Total pelunasan yang sudah mengurangi saldo A (positif = berkurang). */
  settledForA: number;
  /** transactionNetForA - settledForA, selalu sama dengan netBalanceForA. */
  netBalanceForA: number;
}

/**
 * Memecah Saldo Berjalan menjadi komponen yang bisa ditampilkan sebagai rumus:
 * Talangan Bersih - Sudah Dilunasi = Sisa. Memakai fungsi dampak yang sama
 * dengan calculateRunningBalance sehingga angkanya selalu konsisten.
 */
export function calculateBalanceBreakdown(
  userAId: string,
  userBId: string,
  transactions: BalanceCalculationTransaction[],
  settlements: BalanceCalculationSettlement[]
): BalanceBreakdown {
  let owedToA = 0;
  let owedByA = 0;
  let settledForA = 0;

  for (const tx of transactions) {
    const impact = getTransactionImpactForA(tx, userAId, userBId);
    if (impact > 0) owedToA += impact;
    else if (impact < 0) owedByA += -impact;
  }

  for (const st of settlements) {
    settledForA -= getSettlementImpactForA(st, userAId, userBId);
  }

  const clean = (n: number) =>
    Object.is(n, -0) || Math.abs(n) < 0.005 ? 0 : n;

  const transactionNetForA = clean(owedToA - owedByA);
  settledForA = clean(settledForA);

  return {
    owedToA: clean(owedToA),
    owedByA: clean(owedByA),
    transactionNetForA,
    settledForA,
    netBalanceForA: clean(transactionNetForA - settledForA),
  };
}
