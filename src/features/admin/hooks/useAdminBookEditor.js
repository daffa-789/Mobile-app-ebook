import { useState } from 'react';
import { toast } from 'sonner';
import { apiJson, apiJsonSend } from '@lib/api';
import { supabase } from '@lib/supabase';
import { withToast } from '@lib/withToast';

export const EMPTY_BOOK_FORM = {
  title: '',
  pages: '',
  is_locked: false,
  thumbnail: null,
  content: null,
};

export const useAdminBookEditor = ({ headers, loadDashboard }) => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState(EMPTY_BOOK_FORM);
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);

  const deleteBook = (book) => {
    if (
      !window.confirm(`Hapus buku “${book.title}”? Lampiran dan halaman terkait juga akan dihapus.`)
    )
      return undefined;
    return withToast(
      async () => {
        await apiJson(`/api/books/${encodeURIComponent(book.id)}`, { method: 'DELETE', headers });
        await loadDashboard();
      },
      'Buku belum dapat dihapus.',
      'Buku berhasil dihapus.',
    );
  };

  const submitBook = async (event) => {
    event.preventDefault();
    if (!editingBookId && !bookForm.thumbnail) {
      toast.error('Pilih berkas thumbnail terlebih dahulu.');
      return;
    }
    if (!editingBookId && !bookForm.content) {
      toast.error('Pilih lampiran konten buku terlebih dahulu.');
      return;
    }
    setIsSavingBook(true);
    return withToast(
      async () => {
        const data = new FormData();
        Object.entries(bookForm).forEach(([key, value]) => {
          if (key !== 'thumbnail' && key !== 'content' && value !== '' && value !== null) {
            data.append(key, String(value));
          }
        });
        data.set('is_locked', bookForm.is_locked ? 'true' : 'false');
        if (bookForm.thumbnail instanceof File) {
          data.set('thumbnail', bookForm.thumbnail);
        }
        if (bookForm.content instanceof File) {
          const berkas = bookForm.content;
          if (!supabase) throw new Error('Supabase Storage belum terkonfigurasi.');
          const tiket = await apiJsonSend(
            '/api/books/upload-intent',
            { filename: berkas.name },
            { headers },
          );
          /* Byte naskah dikirim peramban langsung ke Supabase Storage. Melalui
           * /api/books/upload ia akan ditolak Vercel di atas 4,5 MB.
           */
          const { error } = await supabase.storage
            .from(tiket.bucket)
            .uploadToSignedUrl(tiket.path, tiket.token, berkas);
          if (error) throw error;
          data.set('content_path', tiket.path);
          data.set('content_name', berkas.name);
        }

        if (editingBookId) {
          await apiJson(`/api/books/${encodeURIComponent(editingBookId)}`, {
            method: 'PUT',
            headers,
            body: data,
            timeoutMs: 120000,
          });
          toast.success('Buku berhasil diperbarui.');
        } else {
          await apiJson('/api/books/upload', {
            method: 'POST',
            headers,
            body: data,
            timeoutMs: 120000,
          });
          toast.success('Buku berhasil ditambahkan.');
        }
        setBookForm(EMPTY_BOOK_FORM);
        setEditingBookId(null);
        setIsBookModalOpen(false);
        await loadDashboard();
      },
      editingBookId ? 'Buku belum dapat diperbarui.' : 'Buku belum dapat disimpan.',
    ).finally(() => setIsSavingBook(false));
  };

  const startEditBook = (book) => {
    setEditingBookId(book.id);
    setBookForm({
      title: book.title || '',
      pages: String(book.pages || ''),
      is_locked: Boolean(book.isLocked),
      thumbnail: null,
      cover_url: book.coverUrl || '',
      content: null,
      content_name: book.contentName || '',
    });
    setIsBookModalOpen(true);
  };

  const openBookModal = () => setIsBookModalOpen(true);

  const closeBookModal = () => {
    setIsBookModalOpen(false);
    setEditingBookId(null);
    setBookForm(EMPTY_BOOK_FORM);
  };

  return {
    isBookModalOpen,
    bookForm,
    setBookForm,
    isSavingBook,
    editingBookId,
    submitBook,
    startEditBook,
    deleteBook,
    openBookModal,
    closeBookModal,
  };
};
