/**
 * Hook kustom untuk manajemen aksi dan form carousel admin (tambah, ubah, hapus, unggah gambar).
 *
 * @module src/features/admin/hooks/useAdminCarouselEditor
 */

import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiJson, apiJsonSend, authHeaders } from '@lib/api';
import { withToast } from '@lib/withToast';

const EMPTY_SLIDE_FORM = {
  title: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Hook pengelola formulir dan aksi carousel dashboard admin.
 *
 * @param {object} params - Parameter hook
 * @param {string|null} params.sessionToken - Token otentikasi admin
 * @param {() => Promise<void>} params.refreshCarousel - Callback penyegaran data banner
 * @returns {object} State dan handler editor banner carousel
 */
export const useAdminCarouselEditor = ({ sessionToken, refreshCarousel }) => {
  const [form, setForm] = useState(EMPTY_SLIDE_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const imageInputRef = useRef(null);

  const headers = useMemo(() => authHeaders(sessionToken), [sessionToken]);

  const resetForm = () => {
    setForm(EMPTY_SLIDE_FORM);
    setEditingId(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const startEdit = (slide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title,
      description: slide.description || '',
      sort_order: slide.sortOrder,
      is_active: slide.isActive,
    });
  };

  const uploadImage = (slideId, file) => {
    if (!(file instanceof File)) return undefined;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Ukuran gambar melebihi 8 MB.');
      return undefined;
    }
    const data = new FormData();
    data.set('image', file);
    return withToast(
      async () => {
        await apiJson(`/api/carousel/${encodeURIComponent(slideId)}/image`, {
          method: 'POST',
          headers,
          body: data,
          timeoutMs: 60000,
        });
        await refreshCarousel();
      },
      'Gambar banner gagal diunggah.',
      'Gambar banner diperbarui.',
    );
  };

  const submitSlide = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Judul banner wajib diisi.');
      return;
    }

    setIsSaving(true);
    return withToast(async () => {
      const payload = {
        title: form.title.trim(),
        description: (form.description || '').trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      if (editingId) {
        await apiJsonSend(`/api/carousel/${encodeURIComponent(editingId)}`, payload, {
          method: 'PUT',
          headers,
        });
        toast.success('Banner berhasil diperbarui.');
      } else {
        const created = await apiJsonSend('/api/carousel', payload, { headers });
        toast.success('Banner berhasil ditambahkan.');
        const file = imageInputRef.current?.files?.[0];
        if (file && created.slideId) {
          await uploadImage(created.slideId, file);
        }
      }

      resetForm();
      await refreshCarousel();
    }, 'Banner gagal disimpan.').finally(() => setIsSaving(false));
  };

  const deleteSlide = (slide) => {
    if (!window.confirm(`Hapus banner “${slide.title}”?`)) return undefined;
    setBusyId(slide.id);
    return withToast(
      async () => {
        await apiJson(`/api/carousel/${encodeURIComponent(slide.id)}`, {
          method: 'DELETE',
          headers,
        });
        if (editingId === slide.id) resetForm();
        await refreshCarousel();
      },
      'Banner gagal dihapus.',
      'Banner berhasil dihapus.',
    ).finally(() => setBusyId(null));
  };

  return {
    form,
    setForm,
    editingId,
    isSaving,
    busyId,
    imageInputRef,
    resetForm,
    startEdit,
    uploadImage,
    submitSlide,
    deleteSlide,
  };
};
