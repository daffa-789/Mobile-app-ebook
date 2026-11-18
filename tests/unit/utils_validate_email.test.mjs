// Test: email validation
import { describe, it, expect } from 'vitest';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe('isValidEmail', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });
  it('rejects email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });
  it('rejects email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });
  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});
