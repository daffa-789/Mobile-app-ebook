// Test: price calculations with discount
import { describe, it, expect } from 'vitest';

function calcDiscount(price, discountPct) {
  if (discountPct < 0 || discountPct > 100) throw new Error('Invalid discount');
  return Math.round(price * (1 - discountPct / 100));
}

describe('calcDiscount', () => {
  it('calculates 10% discount', () => {
    expect(calcDiscount(100000, 10)).toBe(90000);
  });
  it('returns full price at 0%', () => {
    expect(calcDiscount(50000, 0)).toBe(50000);
  });
  it('returns 0 at 100%', () => {
    expect(calcDiscount(50000, 100)).toBe(0);
  });
  it('throws on invalid discount', () => {
    expect(() => calcDiscount(100, 150)).toThrow('Invalid discount');
  });
});
