// Test: book search filtering
import { describe, it, expect } from 'vitest';

function filterBooks(books, query) {
  const q = query.toLowerCase();
  return books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
}

describe('filterBooks', () => {
  const books = [
    { title: 'Sholawat Wahidiyah', author: 'KH Abdul Latif' },
    { title: 'Panduan Mujahadah', author: 'Tim Wahidiyah' },
    { title: 'Risalah Tauhid', author: 'Imam Ghazali' },
  ];

  it('finds by title', () => {
    expect(filterBooks(books, 'sholawat')).toHaveLength(1);
  });
  it('finds by author', () => {
    expect(filterBooks(books, 'ghazali')).toHaveLength(1);
  });
  it('case insensitive search', () => {
    expect(filterBooks(books, 'WAHIDIYAH')).toHaveLength(2);
  });
  it('returns empty for no match', () => {
    expect(filterBooks(books, 'xyz')).toHaveLength(0);
  });
});
