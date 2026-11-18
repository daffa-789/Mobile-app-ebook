// Test: slug generation
import { describe, it, expect } from 'vitest';

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });
  it('removes special characters', () => {
    expect(slugify('Buku @#Wahidiyah!')).toBe('buku-wahidiyah');
  });
  it('trims leading/trailing hyphens', () => {
    expect(slugify('  test  ')).toBe('test');
  });
  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});
