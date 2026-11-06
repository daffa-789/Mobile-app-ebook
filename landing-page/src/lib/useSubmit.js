import { useCallback, useState } from 'react';

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
