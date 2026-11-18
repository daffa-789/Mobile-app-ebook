// Test: password strength checker
import { describe, it, expect } from 'vitest';

function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return ['weak', 'fair', 'good', 'strong', 'very-strong'][score];
}

describe('passwordStrength', () => {
  it('rates short password as weak', () => {
    expect(passwordStrength('abc')).toBe('weak');
  });
  it('rates long lowercase as fair', () => {
    expect(passwordStrength('abcdefgh')).toBe('fair');
  });
  it('rates mixed as good', () => {
    expect(passwordStrength('Abcdefgh')).toBe('good');
  });
  it('rates with number as strong', () => {
    expect(passwordStrength('Abcdefg1')).toBe('strong');
  });
  it('rates with special char as very-strong', () => {
    expect(passwordStrength('Abcdefg1!')).toBe('very-strong');
  });
});
