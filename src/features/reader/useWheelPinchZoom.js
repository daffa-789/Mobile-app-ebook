/**
 * Custom hook: pinch pada trackpad (event `wheel` dengan `ctrlKey`/`metaKey`).
 *
 * Kenapa hook ini ada: jalur lama memanggil `setZoom` pada SETIAP event wheel.
 * Satu panggilan `setZoom` memicu render ulang canvas per halaman, dan satu
 * gestur trackpad mengirim puluhan event — itulah yang terasa patah-patah di
 * laptop. Pinch dua jari tidak mengalaminya karena ia hanya mengubah transform
 * CSS selama gestur dan meng-commit zoom satu kali saat jari diangkat. Hook ini
 * membuat trackpad memakai jalur yang sama, sehingga keduanya terasa setara.
 *
 * @module src/features/reader/useWheelPinchZoom
 */

import { useEffect, useRef } from 'react';
import { clampZoom, getWheelScale } from './zoomUtils';

/** Jeda tanpa event sebelum gestur dianggap selesai, lalu zoom di-commit. */
const SETTLE_MS = 120;

/**
 * @param {object} params - Konfigurasi hook
 * @param {import('react').RefObject<HTMLDivElement>} params.containerRef - Ref elemen pembungkus scroll
 * @param {import('react').RefObject<HTMLDivElement>} params.pageStackRef - Ref tumpukan halaman PDF
 * @param {number} params.zoom - Level zoom saat ini (persentase)
 * @param {(newZoom: number) => void} params.setZoom - Setter level zoom
 * @param {(focalY?: number) => void} params.updateReadingPosition - Callback penanda posisi baca
 * @param {import('react').MutableRefObject<{page: number, ratio: number}>} params.currentViewRef - Ref posisi baca
 * @param {import('react').MutableRefObject<any>} params.pinchAnchorRef - Ref jangkar zoom (dipakai bersama pinch)
 */
export function useWheelPinchZoom({
  containerRef,
  pageStackRef,
  zoom,
  setZoom,
  updateReadingPosition,
  currentViewRef,
  pinchAnchorRef,
}) {
  const zoomRef = useRef(zoom);
  const startZoomRef = useRef(0);
  const scaleRef = useRef(1);
  const originRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const settleRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const hapusTransform = () => {
      const stack = pageStackRef.current;
      if (!stack) return;
      stack.style.removeProperty('transform');
      stack.style.removeProperty('transform-origin');
      stack.style.removeProperty('will-change');
    };

    /* Commit dilakukan SEKALI per gestur. Kalau hasilnya sama dengan zoom
     * sekarang, transform dilepas tanpa memanggil React sama sekali —
     * inilah yang membuat gestur kecil tidak lagi memicu render ulang.
     */
    const commit = () => {
      activeRef.current = false;
      const target = clampZoom(startZoomRef.current * scaleRef.current);
      scaleRef.current = 1;
      if (target === zoomRef.current) {
        hapusTransform();
        return;
      }
      setZoom(target);
    };

    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const stack = pageStackRef.current;
      if (!stack) return;

      const containerRect = el.getBoundingClientRect();
      const stackRect = stack.getBoundingClientRect();
      const focalY = e.clientY - containerRect.top;

      if (!activeRef.current) {
        activeRef.current = true;
        startZoomRef.current = zoomRef.current;
        scaleRef.current = 1;
        originRef.current = { x: e.clientX - stackRect.left, y: e.clientY - stackRect.top };
        stack.style.willChange = 'transform';
        updateReadingPosition(focalY);
      }

      pinchAnchorRef.current = { ...currentViewRef.current, focalY };
      scaleRef.current = getWheelScale(scaleRef.current, e.deltaY, e.deltaMode);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        stack.style.transformOrigin = `${originRef.current.x}px ${originRef.current.y}px`;
        stack.style.transform = `scale(${scaleRef.current})`;
      });

      if (settleRef.current) clearTimeout(settleRef.current);
      settleRef.current = setTimeout(commit, SETTLE_MS);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleRef.current) clearTimeout(settleRef.current);
      rafRef.current = null;
      settleRef.current = null;
      activeRef.current = false;
    };
  }, [containerRef, pageStackRef, setZoom, updateReadingPosition, currentViewRef, pinchAnchorRef]);
}
