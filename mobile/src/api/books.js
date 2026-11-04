import { apiJson } from './client';

export const listBooks = ({ search = '', sort = '' } = {}) => {
  const q = new URLSearchParams();
  if (search) q.set('search', search);
  if (sort) q.set('sort', sort);
  const s = q.toString();
  return apiJson(`/books${s ? `?${s}` : ''}`, { method: 'GET' });
};

export const getBook = (id) => apiJson(`/books/${encodeURIComponent(id)}`, { method: 'GET' });

export const getBookHtml = (id) =>
  apiJson(`/books/${encodeURIComponent(id)}/html`, { method: 'GET' });

export const listCarousel = () => apiJson('/carousel', { method: 'GET' });
