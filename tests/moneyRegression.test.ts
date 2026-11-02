import { calculateRunningBalance, computeTransactionShares } from '../src/lib/balance';
import { describe, expect, it } from 'vitest';
import { formatNumberInput, parseNumberInput } from '../src/lib/format';
import { calculateItemizedSplit, encodeTransactionNotes, parseTransactionNotes } from '../src/lib/itemizedBill';

describe('money regressions', () => {
  it('matches PostgreSQL rounding when splitting 0.29', () => {
    expect(computeTransactionShares(0.29, 'EQUAL_50_50', 'A', 'A')).toEqual({ user_a_share: 0.15, user_b_share: 0.14 });
  });
  it('uses an exact cents value for the settlement snapshot', () => {
    const tx = [0.1, 0.2].map((amount) => ({payer_id:'A', amount, split_type:'FULL_OWE' as const, user_a_share:0, user_b_share:amount}));
    expect(calculateRunningBalance('A','B',tx,[]).netBalanceForA).toBe(0.3);
  });
  it('preserves decimal amounts when an input is reopened', () => {
    expect(formatNumberInput(1000.5)).toBe('1.000,5');
    expect(parseNumberInput(formatNumberInput(1000.5))).toBe(1000.5);
  });
  it('distributes discounts and preserves them through notes', () => {
    const data = { items: [{ id: '1', name: 'Meal', price: 100000, assignedTo: 'BOTH' as const }], extraFee: -20000 };
    const result = calculateItemizedSplit(data);
    expect(result.grandTotal).toBe(80000);
    expect(result.shareA).toBe(40000);
    expect(result.shareB).toBe(40000);
    expect(parseTransactionNotes(encodeTransactionNotes('', data)).itemized?.extraFee).toBe(-20000);
  });
  it('never allocates a discount larger than the subtotal', () => {
    expect(calculateItemizedSplit({ items: [{ id: '1', name: 'Meal', price: 100, assignedTo: 'A' }], extraFee: -101 }).grandTotal).toBe(0);
  });
});
