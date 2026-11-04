/**
 * Custom hook untuk menangani gesture multi-touch 2 jari (Pinch-to-zoom) pada ContinuousPdfViewer.
 *
 * Zoom kini murni `transform: scale()` pada tumpukan halaman (lihat
 * `ContinuousPdfViewer`), jadi tidak ada lagi "preview transform" yang harus
 * dibuang saat jari diangkat: mengubah zoom berarti mengubah satu properti
 * gaya, dan itu murah. Yang tersisa di sini hanyalah menerjemahkan jarak dua
 * jari menjadi level zoom, dijatah satu pembaruan per frame.
 *
 * @module src/features/reader/usePdfPinchGesture
 */

import { useRef, useEffect } from 'react';
import { clampZoom, getPinchScale } from './zoomUtils';

/**
 * Hook gesture pinch-to-zoom lembar PDF.
 *
 * @param {object} params - Konfigurasi hook
 * @param {import('react').RefObject<HTMLDivElement>} params.containerRef - Ref elemen pembungkus scroll
 * @param {number} params.zoom - Level zoom saat ini (persentase)
 * @param {(newZoom: number) => void} params.setZoom - Setter level zoom
 * @param {(focalY?: number) => void} params.updateReadingPosition - Callback penanda posisi baca
 * @param {import('react').MutableRefObject<{page: number, ratio: number}>} params.currentViewRef - Ref posisi baca
 * @param {import('react').MutableRefObject<any>} params.pinchAnchorRef - Ref titik jangkar gestur
 * @returns {{
 *   handleTouchStart: (e: import('react').TouchEvent) => void,
 *   handleTouchEnd: (e: import('react').TouchEvent) => void,
 *   isPinchingRef: import('react').MutableRefObject<boolean>
 * }}
 */
export function usePdfPinchGesture({
  containerRef,
  zoom,
  setZoom,
  updateReadingPosition,
  currentViewRef,
  pinchAnchorRef,
}) {
  const zoomRef = useRef(zoom);
  const jarakAwalRef = useRef(0);
  const jarakTerakhirRef = useRef(0);
  const zoomAwalRef = useRef(100);
  const isPinchingRef = useRef(false);
  const rafRef = useRef(null);
  const moveHandlerRef = useRef(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const jarakDuaJari = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const terapkanZoom = (jarak) => {
    if (jarakAwalRef.current <= 10) return;
    const skala = getPinchScale(zoomAwalRef.current, jarakAwalRef.current, jarak);
    setZoom(clampZoom(zoomAwalRef.current * skala));
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 2) return;

    const container = containerRef.current;
    if (!container) return;

    const [pertama, kedua] = e.touches;
    const jarak = jarakDuaJari(pertama, kedua);
    const focalY = (pertama.clientY + kedua.clientY) / 2 - container.getBoundingClientRect().top;

    updateReadingPosition(focalY);
    jarakAwalRef.current = jarak;
    jarakTerakhirRef.current = jarak;
    zoomAwalRef.current = zoomRef.current;
    pinchAnchorRef.current = { ...currentViewRef.current, focalY };
    isPinchingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isPinchingRef.current || e.touches.length !== 2) return;
    if (e.cancelable) e.preventDefault();

    const container = containerRef.current;
    if (!container || jarakAwalRef.current <= 10) return;

    const [pertama, kedua] = e.touches;
    const jarak = jarakDuaJari(pertama, kedua);
    jarakTerakhirRef.current = jarak;
    pinchAnchorRef.current = {
      ...currentViewRef.current,
      focalY: (pertama.clientY + kedua.clientY) / 2 - container.getBoundingClientRect().top,
    };

    /* Dijatah satu pembaruan per frame, bukan per event sentuhan. */
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      terapkanZoom(jarak);
    });
  };

  moveHandlerRef.current = handleTouchMove;

  const handleTouchEnd = (e) => {
    if (!isPinchingRef.current || e.touches.length >= 2) return;

    isPinchingRef.current = false;
    if (rafRef.current) {
      // Frame terakhir belum sempat jalan: terapkan sekarang supaya hasil
      // gestur tidak hilang setengah jalan.
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      terapkanZoom(jarakTerakhirRef.current);
    }
    jarakAwalRef.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleNativeTouchMove = (event) => moveHandlerRef.current?.(event);
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchmove', handleNativeTouchMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  return {
    handleTouchStart,
    handleTouchEnd,
    isPinchingRef,
  };
}
