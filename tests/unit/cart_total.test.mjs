// Test: shopping cart total
import { describe, it, expect } from 'vitest';

function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

describe('cartTotal', () => {
  it('calculates single item total', () => {
    expect(cartTotal([{ price: 25000, qty: 2 }])).toBe(50000);
  });
  it('calculates multiple items', () => {
    const items = [
      { price: 10000, qty: 1 },
      { price: 20000, qty: 3 },
    ];
    expect(cartTotal(items)).toBe(70000);
  });
  it('returns 0 for empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
