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
    const shareA = Number(tx.user_a_share);
    const shareB = Number(tx.user_b_share);

    totalDateExpense += amount;

    if (tx.payer_id === userAId) {
      totalPaidByA += amount;
    } else if (tx.payer_id === userBId) {
      totalPaidByB += amount;
    }

    switch (tx.split_type) {
      case 'EQUAL_50_50': {
        if (tx.payer_id === userAId) {
          netBalanceForA += amount / 2;
        } else if (tx.payer_id === userBId) {
          netBalanceForA -= amount / 2;
        }
        break;
      }
      case 'FULL_TREAT': {
        // Traktir penuh tidak menambah hutang/piutang sama sekali
        break;
      }
      case 'FULL_OWE': {
        if (tx.payer_id === userAId) {
          netBalanceForA += amount;
        } else if (tx.payer_id === userBId) {
          netBalanceForA -= amount;
        }
        break;
      }
      case 'CUSTOM': {
        if (tx.payer_id === userAId) {
          netBalanceForA += shareB;
        } else if (tx.payer_id === userBId) {
          netBalanceForA -= shareA;
        }
        break;
      }
    }
  }

  for (const st of settlements) {
    const settlementAmount = Number(st.amount);
    if (st.from_user_id === userBId && st.to_user_id === userAId) {
      // User B melunasi hutang ke User A -> piutang A berkurang
      netBalanceForA -= settlementAmount;
    } else if (st.from_user_id === userAId && st.to_user_id === userBId) {
      // User A melunasi hutang ke User B -> kewajiban hutang A berkurang (menuju 0)
      netBalanceForA += settlementAmount;
    }
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
