/**
 * Custom hook: pinch pada trackpad (event `wheel` dengan `ctrlKey`/`metaKey`).
 *
 * Kenapa hook ini ada: jalur lama memanggil `setZoom` dengan `Math.round` pada
 * SETIAP event wheel. Delta trackpad yang kecil dibulatkan menjadi nol
 * perubahan — dead zone — lalu zoom melompat saat ambangnya terlampaui. Itulah
 * yang terasa patah-patah di laptop sementara pinch di HP mulus.
 *
 * Setelah zoom menjadi murni `transform: scale()` pada tumpukan halaman,
 * mengubah zoom berarti mengubah satu properti gaya saja. Hook ini karenanya
 * tidak lagi menulis preview transform sendiri: ia mengumpulkan skala gestur
 * dan menuliskannya ke state, dijatah satu pembaruan per frame.
 *
 * @module src/features/reader/useWheelPinchZoom
 */

import { useEffect, useRef } from 'react';
import { clampZoom, getWheelScale } from './zoomUtils';

/** Setelah sedetik tanpa event, gestur dianggap selesai dan skala direset. */
const GESTUR_SELESAI_MS = 1000;

/**
 * @param {object} params - Konfigurasi hook
 * @param {import('react').RefObject<HTMLDivElement>} params.containerRef - Ref elemen pembungkus scroll
 * @param {number} params.zoom - Level zoom saat ini (persentase)
 * @param {(newZoom: number) => void} params.setZoom - Setter level zoom
 * @param {(focalY?: number) => void} params.updateReadingPosition - Callback penanda posisi baca
 * @param {import('react').MutableRefObject<{page: number, ratio: number}>} params.currentViewRef - Ref posisi baca
 * @param {import('react').MutableRefObject<any>} params.pinchAnchorRef - Ref jangkar gestur (dipakai bersama pinch)
 */
export function useWheelPinchZoom({
  containerRef,
  zoom,
  setZoom,
  updateReadingPosition,
  currentViewRef,
  pinchAnchorRef,
}) {
  const zoomRef = useRef(zoom);
  const zoomAwalRef = useRef(100);
  const skalaRef = useRef(1);
  const rafRef = useRef(null);
  const resetRef = useRef(null);
  const aktifRef = useRef(false);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const focalY = e.clientY - el.getBoundingClientRect().top;

      if (!aktifRef.current) {
        aktifRef.current = true;
        zoomAwalRef.current = zoomRef.current;
        skalaRef.current = 1;
        updateReadingPosition(focalY);
      }

      pinchAnchorRef.current = { ...currentViewRef.current, focalY };
      skalaRef.current = getWheelScale(skalaRef.current, e.deltaY, e.deltaMode);

      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setZoom(clampZoom(zoomAwalRef.current * skalaRef.current));
      });

      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => {
        aktifRef.current = false;
        skalaRef.current = 1;
      }, GESTUR_SELESAI_MS);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resetRef.current) clearTimeout(resetRef.current);
      rafRef.current = null;
      resetRef.current = null;
      aktifRef.current = false;
    };
  }, [containerRef, setZoom, updateReadingPosition, currentViewRef, pinchAnchorRef]);
}
