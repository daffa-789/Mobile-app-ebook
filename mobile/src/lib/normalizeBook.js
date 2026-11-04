// DISALIN dari src/lib/normalizers.js (normalizeBook) — murni tanpa DOM
// Diadaptasi: contentUrl dibuat absolut untuk klien native
import { API_BASE_URL } from '../config';

const pick = (source, ...keys) => {
  if (!source) return undefined;
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

export const normalizeBook = (book = {}) => ({
  id: book.id,
  title: book.title || 'Tanpa judul',
  pages: Number(book.pages || book.total_pages || 1),
  isLocked: Boolean(pick(book, 'is_locked', 'isLocked')),
  coverUrl:
    book.cover_url ||
    book.coverUrl ||
    (book.has_thumbnail ? `${API_BASE_URL}/books/${encodeURIComponent(book.id)}/thumbnail` : null),
  contentExtension: book.content_extension || book.contentExtension || '',
  contentType: pick(book, 'content_type', 'contentType') || (book.content_extension || '').replace('.', ''),
  contentUnsigned:
    book.contentUrl ||
    (book.has_content ? `/books/${encodeURIComponent(book.id)}/content` : null),
  contentName: pick(book, 'content_name', 'contentName') || null,
  contentSize: Number(book.content_size || 0) || null,
  hasContent: Boolean(pick(book, 'has_content', 'hasContent')),
  createdAt: pick(book, 'created_at', 'createdAt') || null,
  updatedAt: pick(book, 'updated_at', 'updatedAt') || null,
});
