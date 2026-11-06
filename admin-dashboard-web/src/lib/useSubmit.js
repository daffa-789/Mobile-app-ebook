import { useCallback, useState } from 'react';

/**
 * Pola submit seragam untuk layar formulir.
 *
 * Menghimpun tiga hal yang selalu berulang di tiap layar: penanda sibuk
 * (`isSubmitting`), pesan galat (`error`), dan pembersihan keduanya di sekitar
 * aksi async. Galat dimatikan lebih dulu, lalu diisi dari `message` server bila
 * ada — sehingga layar tidak perlu lagi menulis blok `try/catch/finally`
 * sendiri, dan perilaku "matikan indikator apa pun yang terjadi" dijamin sama
 * di semua layar.
 *
 * @param {string} fallbackMessage pesan galat bila server tidak mengirim pesan
 * @returns {{ error: string, setError: Function, isSubmitting: boolean, runSubmit: Function }}
 */
export const useSubmit = (fallbackMessage = 'Terjadi kendala. Silakan coba lagi.') => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runSubmit = useCallback(
    async (action) => {
      setIsSubmitting(true);
      setError('');
      try {
        return await action();
      } catch (requestError) {
        setError(requestError?.message || fallbackMessage);
        return undefined;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fallbackMessage],
  );

  return { error, setError, isSubmitting, runSubmit };
};
