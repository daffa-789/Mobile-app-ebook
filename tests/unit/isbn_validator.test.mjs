// Test: ISBN-13 validator
import { describe, it, expect } from 'vitest';

function isValidISBN13(isbn) {
  const digits = isbn.replace(/-/g, '');
  if (digits.length !== 13 || !/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(digits[12]);
}

describe('isValidISBN13', () => {
  it('validates correct ISBN-13', () => {
    expect(isValidISBN13('978-3-16-148410-0')).toBe(true);
  });
  it('rejects wrong check digit', () => {
    expect(isValidISBN13('978-3-16-148410-1')).toBe(false);
  });
  it('rejects too-short string', () => {
    expect(isValidISBN13('12345')).toBe(false);
  });
  it('rejects non-numeric', () => {
    expect(isValidISBN13('978-ABC-DEF-GHI-J')).toBe(false);
  });
});
