import { describe, expect, it } from 'vitest';
import {
  calculateItemizedSplit,
  encodeTransactionNotes,
  parseTransactionNotes,
} from '../src/lib/itemizedBill';

describe('itemizedBill', () => {
  it('calculates individual and shared items with proportional extra fee', () => {
    const result = calculateItemizedSplit({
      items: [
        { id: '1', name: 'Nasi Bebek', price: 35000, assignedTo: 'A' },
        { id: '2', name: 'Ayam Goreng', price: 25000, assignedTo: 'B' },
        { id: '3', name: 'Tahu Tempe', price: 12000, assignedTo: 'BOTH' },
      ],
      extraFee: 7200, // 10% tax on 72,000
    });

    // Subtotal A: 35000 + 6000 = 41000
    // Subtotal B: 25000 + 6000 = 31000
    expect(result.subtotalA).toBe(41000);
    expect(result.subtotalB).toBe(31000);
    expect(result.itemsSubtotal).toBe(72000);

    // Extra A: 4100, Extra B: 3100
    expect(result.extraA).toBe(4100);
    expect(result.extraB).toBe(3100);
    expect(result.shareA).toBe(45100);
    expect(result.shareB).toBe(34100);
    expect(result.grandTotal).toBe(79200);
  });

  it('encodes and parses transaction notes with itemized bill data cleanly', () => {
    const encoded = encodeTransactionNotes('Makan malam anniversary', {
      items: [
        { id: '1', name: 'Matcha Latte', price: 28000, assignedTo: 'A' },
        { id: '2', name: 'Kopi Susu', price: 22000, assignedTo: 'B' },
      ],
      extraFee: 5000,
    });

    const parsed = parseTransactionNotes(encoded);
    expect(parsed.plainNotes).toBe('Makan malam anniversary');
    expect(parsed.itemized).not.toBeNull();
    expect(parsed.itemized?.items).toHaveLength(2);
    expect(parsed.itemized?.extraFee).toBe(5000);
  });
});
