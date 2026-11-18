// Test: text truncation
import { describe, it, expect } from 'vitest';

function truncate(str, maxLen = 100) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

describe('truncate', () => {
  it('returns short text as-is', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  it('truncates long text with ellipsis', () => {
    const result = truncate('a'.repeat(200), 50);
    expect(result.length).toBe(50);
    expect(result.endsWith('...')).toBe(true);
  });
  it('handles exact boundary', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });
});
