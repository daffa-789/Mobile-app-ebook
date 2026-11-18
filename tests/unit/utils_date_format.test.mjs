// Test: date formatting for Indonesian locale
import { describe, it, expect } from 'vitest';

function formatDateID(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

describe('formatDateID', () => {
  it('formats ISO date to Indonesian locale', () => {
    const result = formatDateID('2026-01-15');
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });
  it('handles end of month', () => {
    const result = formatDateID('2026-12-31');
    expect(result).toContain('31');
    expect(result).toContain('2026');
  });
});
