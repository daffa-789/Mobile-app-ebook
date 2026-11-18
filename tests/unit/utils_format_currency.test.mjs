// Test: formatCurrency utility
import { describe, it, expect } from 'vitest';

function formatCurrency(amount, locale = 'id-ID') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

describe('formatCurrency', () => {
  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toContain('0');
  });
  it('formats thousands with separator', () => {
    const result = formatCurrency(50000);
    expect(result).toContain('50');
  });
  it('formats large amounts', () => {
    const result = formatCurrency(1500000);
    expect(result).toContain('1.500.000');
  });
});
