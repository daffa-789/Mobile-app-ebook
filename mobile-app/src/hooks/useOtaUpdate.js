/**
 * Hook pemantau pembaruan OTA saat aplikasi dibuka / kembali ke foreground.
 *
 * Sengaja TIDAK memutuskan UI: hook hanya menyediakan status dan aksi,
 * sehingga dialog "perbarui atau nanti" bisa berdiri sendiri sebagai
 * komponen dan dipakai ulang. Penolakan berlaku per sesi aplikasi — pembaruan
 * berikutnya tetap ditawarkan saat aplikasi dibuka lagi.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  OTA_CHECK_THROTTLE_MS,
  applyOtaUpdate,
  checkForOtaUpdate,
  isOtaSupported,
} from '../lib/ota';

export const useOtaUpdate = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const dismissedRef = useRef(false);
  const lastCheckRef = useRef(0);
  const checkingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isOtaSupported() || dismissedRef.current || checkingRef.current) return;
    const now = Date.now();
    if (now - lastCheckRef.current < OTA_CHECK_THROTTLE_MS) return;
    lastCheckRef.current = now;
    checkingRef.current = true;
    try {
      const available = await checkForOtaUpdate();
      if (!dismissedRef.current) setIsAvailable(available);
    } catch (_) {
      /* Offline / server sibuk: diam saja. Pemeriksaan native mengulang pada
       * peluncuran berikutnya tanpa perlu pesan galat yang mengganggu. */
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isOtaSupported()) return undefined;
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription?.remove?.();
  }, [refresh]);

  const apply = useCallback(async () => {
    if (isApplying) return { success: false, cancelled: true };
    setIsApplying(true);
    try {
      await applyOtaUpdate();
      return { success: true };
    } catch (_) {
      setIsApplying(false);
      return { success: false, error: 'Gagal memuat pembaruan. Periksa koneksi internet Anda.' };
    }
  }, [isApplying]);

  /** Pilihan "nanti": sembunyikan prompt sampai aplikasi dibuka ulang. */
  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setIsAvailable(false);
  }, []);

  return { isAvailable, isApplying, apply, dismiss, refresh };
};
