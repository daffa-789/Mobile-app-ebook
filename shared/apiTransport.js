/**
 * Transport API bersama untuk reader dan admin.
 * Kebijakan fallback tetap ditentukan tiap aplikasi lewat callback.
 */
export const createApiTransport = ({ fallbackOrigin, timeoutMs, canUseFallback }) => {
  const offlineError = () => {
    const error = new Error('Server tidak dapat dihubungi.');
    error.network = true;
    return error;
  };

  const timeoutError = () => {
    const error = new Error('Server tidak membalas dalam batas waktu.');
    error.network = true;
    error.timeout = true;
    return error;
  };

  const fetchWithTimeout = async (url, options = {}) => {
    const { timeoutMs: requestTimeoutMs, ...rest } = options;
    if (rest.signal) return fetch(url, rest);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs || timeoutMs);
    try {
      return await fetch(url, { ...rest, signal: controller.signal });
    } catch (error) {
      if (error?.name === 'AbortError') throw timeoutError();
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  const apiRequest = async (path, options = {}) => {
    try {
      return await fetchWithTimeout(path, options);
    } catch (error) {
      if (error?.timeout) throw error;
      if (!canUseFallback(path)) throw offlineError();

      try {
        return await fetchWithTimeout(`${fallbackOrigin}${path}`, options);
      } catch (fallbackError) {
        if (fallbackError?.timeout) throw fallbackError;
        throw offlineError();
      }
    }
  };

  const apiJson = async (path, options = {}) => {
    const response = await apiRequest(path, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.message || 'Permintaan ke server gagal.');
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const apiJsonSend = (path, body, { method = 'POST', headers, ...rest } = {}) =>
    apiJson(path, {
      ...rest,
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  return { apiRequest, apiJson, apiJsonSend };
};

export const readableError = (error) => {
  if (error?.timeout) return 'Server tidak membalas tepat waktu. Coba lagi.';
  if (error?.network) return 'Server tidak dapat dihubungi.';
  if (error?.status === 503 || error?.status === 500)
    return 'Server menolak permintaan (basis data mungkin mati).';
  return error?.message || 'Data gagal dimuat.';
};
