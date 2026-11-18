// Test: pagination logic
import { describe, it, expect } from 'vitest';

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    total: items.length,
    totalPages: Math.ceil(items.length / perPage),
    currentPage: page,
  };
}

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it('returns correct page size', () => {
    expect(paginate(items, 1, 10).data.length).toBe(10);
  });
  it('calculates total pages', () => {
    expect(paginate(items, 1, 10).totalPages).toBe(3);
  });
  it('returns partial last page', () => {
    expect(paginate(items, 3, 10).data.length).toBe(5);
  });
  it('returns empty for out-of-range page', () => {
    expect(paginate(items, 5, 10).data.length).toBe(0);
  });
});
