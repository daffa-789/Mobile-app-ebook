// Test: membership tier resolution
import { describe, it, expect } from 'vitest';

function getMemberTier(totalSpent) {
  if (totalSpent >= 1000000) return 'gold';
  if (totalSpent >= 500000) return 'silver';
  if (totalSpent >= 100000) return 'bronze';
  return 'free';
}

describe('getMemberTier', () => {
  it('returns free for new user', () => {
    expect(getMemberTier(0)).toBe('free');
  });
  it('returns bronze at 100k', () => {
    expect(getMemberTier(100000)).toBe('bronze');
  });
  it('returns silver at 500k', () => {
    expect(getMemberTier(500000)).toBe('silver');
  });
  it('returns gold at 1M+', () => {
    expect(getMemberTier(1500000)).toBe('gold');
  });
});
