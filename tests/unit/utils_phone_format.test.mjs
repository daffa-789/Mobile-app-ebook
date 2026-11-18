// Test: phone number formatting
import { describe, it, expect } from 'vitest';

function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+62' + cleaned.slice(1);
  return '+62' + cleaned;
}

describe('formatPhone', () => {
  it('converts 08xx to +628xx', () => {
    expect(formatPhone('08123456789')).toBe('+628123456789');
  });
  it('keeps +62 prefix', () => {
    expect(formatPhone('628123456789')).toBe('+628123456789');
  });
  it('strips non-digit chars', () => {
    expect(formatPhone('0812-345-6789')).toBe('+628123456789');
  });
});
