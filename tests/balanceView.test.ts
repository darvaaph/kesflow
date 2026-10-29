import { describe, it, expect } from 'vitest';
import {
  calculateBalanceBreakdown,
  calculateRunningBalance,
} from '../src/lib/balance';
import { buildBalanceEntries, buildDebtSummary } from '../src/lib/balanceView';
import type { Settlement, Transaction } from '../src/types';

const A = 'user-a';
const B = 'user-b';

function tx(
  id: string,
  payer: string,
  amount: number,
  split: Transaction['split_type'],
  shareA: number,
  shareB: number,
  spentAt: string
): Transaction {
  return {
    id,
    space_id: 's',
    payer_id: payer,
    event_id: null,
    category_id: 'c',
    title: `tx ${id}`,
    amount,
    split_type: split,
    user_a_share: shareA,
    user_b_share: shareB,
    receipt_url: null,
    notes: null,
    spent_at: spentAt,
    created_at: spentAt,
  };
}

function settle(
  id: string,
  from: string,
  to: string,
  amount: number,
  at: string
): Settlement {
  return {
    id,
    space_id: 's',
    from_user_id: from,
    to_user_id: to,
    amount,
    notes: null,
    settled_at: at,
  };
}

describe('Balance breakdown', () => {
  const transactions = [
    tx('1', A, 2000, 'EQUAL_50_50', 1000, 1000, '2026-01-01T10:00:00Z'),
    tx('2', B, 100000, 'EQUAL_50_50', 50000, 50000, '2026-01-02T10:00:00Z'),
    tx('3', A, 150000, 'FULL_TREAT', 150000, 0, '2026-01-03T10:00:00Z'),
    tx('4', A, 60000, 'FULL_OWE', 0, 60000, '2026-01-04T10:00:00Z'),
  ];
  const settlements = [settle('s1', B, A, 5000, '2026-01-05T10:00:00Z')];

  it('rumus talangan bersih - dilunasi = sisa selalu sama dengan saldo berjalan', () => {
    const running = calculateRunningBalance(A, B, transactions, settlements);
    const bd = calculateBalanceBreakdown(A, B, transactions, settlements);

    expect(bd.owedToA).toBe(61000);
    expect(bd.owedByA).toBe(50000);
    expect(bd.transactionNetForA).toBe(11000);
    expect(bd.settledForA).toBe(5000);
    expect(bd.netBalanceForA).toBe(6000);
    expect(bd.netBalanceForA).toBe(running.netBalanceForA);
  });

  it('diorientasikan ke arah hutang untuk kedua pengguna', () => {
    const bd = calculateBalanceBreakdown(A, B, transactions, settlements);

    const forA = buildDebtSummary(bd, true);
    expect(forA.partnerOwesMe).toBe(true);
    expect(forA.remaining).toBe(6000);
    expect(forA.transactionNet - forA.settled).toBe(forA.remaining);
    expect(forA.creditorOwed).toBe(61000);
    expect(forA.offsetOwed).toBe(50000);

    const forB = buildDebtSummary(bd, false);
    expect(forB.partnerOwesMe).toBe(false);
    expect(forB.remaining).toBe(6000);
    expect(forB.transactionNet - forB.settled).toBe(forB.remaining);
    expect(forB.creditorOwed).toBe(61000);
    expect(forB.offsetOwed).toBe(50000);
  });

  it('daftar rincian berjumlah sama dengan sisa dan mengabaikan traktir', () => {
    const bd = calculateBalanceBreakdown(A, B, transactions, settlements);

    for (const isMeA of [true, false]) {
      const summary = buildDebtSummary(bd, isMeA);
      const { entries, neutralTransactionCount } = buildBalanceEntries(
        A,
        B,
        isMeA,
        summary.partnerOwesMe,
        transactions,
        settlements
      );
      const sum = entries.reduce((acc, e) => acc + e.delta, 0);
      expect(sum).toBe(summary.remaining);
      expect(neutralTransactionCount).toBe(1);
      expect(entries).toHaveLength(4);
      expect(entries[0].kind).toBe('settlement');
    }
  });

  it('kondisi lunas menghasilkan sisa 0 tanpa tanda minus', () => {
    const bd = calculateBalanceBreakdown(
      A,
      B,
      [tx('1', A, 100000, 'EQUAL_50_50', 50000, 50000, '2026-01-01T10:00:00Z')],
      [settle('s1', B, A, 50000, '2026-01-02T10:00:00Z')]
    );
    const summary = buildDebtSummary(bd, true);
    expect(summary.isSettled).toBe(true);
    expect(summary.remaining).toBe(0);
    expect(Object.is(summary.remaining, -0)).toBe(false);
  });
});
