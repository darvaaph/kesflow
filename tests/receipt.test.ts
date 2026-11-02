import { describe, expect, it } from 'vitest';
import { normalizeReceipt } from '../src/lib/receipt';

describe('receipt validation', () => {
  it('keeps a discount when line totals match the final total', () => {
    expect(normalizeReceipt({ items: [{ name: 'Meal', price: 100000 }], extraFee: -20000, grandTotal: 80000 }).extraFee).toBe(-20000);
  });
  it('does not silently replace the final total with incorrect line totals', () => {
    expect(() => normalizeReceipt({ items: [{ name: 'Meal', price: 100000 }], extraFee: 0, grandTotal: 80000 })).toThrow('tidak cocok');
  });
  it('rejects malformed model output', () => {
    expect(() => normalizeReceipt({ items: [{ price: 'NaN' }], grandTotal: 100 })).toThrow();
  });
});
