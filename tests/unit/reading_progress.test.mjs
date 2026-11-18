// Test: reading progress tracker
import { describe, it, expect } from 'vitest';

function calcProgress(currentPage, totalPages) {
  if (totalPages <= 0) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 100));
}

function estimateReadingTime(totalPages, pagesPerMinute = 2) {
  const minutes = Math.ceil(totalPages / pagesPerMinute);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours} jam ${rem} menit`;
}

describe('calcProgress', () => {
  it('returns 0 at start', () => {
    expect(calcProgress(0, 100)).toBe(0);
  });
  it('returns 50 at halfway', () => {
    expect(calcProgress(50, 100)).toBe(50);
  });
  it('caps at 100', () => {
    expect(calcProgress(150, 100)).toBe(100);
  });
  it('handles 0 total pages', () => {
    expect(calcProgress(5, 0)).toBe(0);
  });
});

describe('estimateReadingTime', () => {
  it('formats minutes', () => {
    expect(estimateReadingTime(10)).toBe('5 menit');
  });
  it('formats hours and minutes', () => {
    expect(estimateReadingTime(300)).toBe('2 jam 30 menit');
  });
});
