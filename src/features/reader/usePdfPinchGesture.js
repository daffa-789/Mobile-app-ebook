/**
 * Custom hook untuk menangani gesture multi-touch 2 jari (Pinch-to-zoom) pada ContinuousPdfViewer.
 * Menggunakan akselerasi transform GPU selama gesture berlangsung, dan menerapkan zoom akhir
 * saat jari dilepaskan demi performa rendering 60 FPS tanpa jank.
 *
 * @module src/features/reader/usePdfPinchGesture
 */

import { useRef, useEffect } from 'react';
import { getPinchScale, getPinchZoom } from './zoomUtils';

/**
 * Hook gesture pinch-to-zoom lembar PDF.
 *
 * @param {object} params - Konfigurasi hook
 * @param {import('react').RefObject<HTMLDivElement>} params.containerRef - Ref elemen pembungkus scroll
 * @param {import('react').RefObject<HTMLDivElement>} params.pageStackRef - Ref tumpukan halaman PDF
 * @param {number} params.zoom - Level zoom saat ini (persentase)
 * @param {(newZoom: number) => void} params.setZoom - Setter level zoom
 * @param {(focalY?: number) => void} params.updateReadingPosition - Callback penanda posisi baca
 * @param {import('react').MutableRefObject<{page: number, ratio: number}>} params.currentViewRef - Ref posisi halaman
 * @param {import('react').MutableRefObject<any>} params.pinchAnchorRef - Ref titik jangkar pinch
 * @returns {{
 *   handleTouchStart: (e: import('react').TouchEvent) => void,
 *   handleTouchEnd: (e: import('react').TouchEvent) => void,
 *   isPinchingRef: import('react').MutableRefObject<boolean>
 * }}
 */
export function usePdfPinchGesture({
  containerRef,
  pageStackRef,
  zoom,
  setZoom,
  updateReadingPosition,
  currentViewRef,
  pinchAnchorRef,
}) {
  const touchStartDistRef = useRef(0);
  const initialPinchZoomRef = useRef(100);
  const lastPinchDistRef = useRef(0);
  const pinchOriginRef = useRef({ x: 0, y: 0, clientX: 0, clientY: 0 });
  const isPinchingRef = useRef(false);
  const pinchRafRef = useRef(null);
  const touchMoveHandlerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length !== 2) return;

    const [firstTouch, secondTouch] = e.touches;
    const distance = Math.hypot(
      firstTouch.clientX - secondTouch.clientX,
      firstTouch.clientY - secondTouch.clientY,
    );
    const midpointX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const midpointY = (firstTouch.clientY + secondTouch.clientY) / 2;
    const container = containerRef.current;
    const pageStack = pageStackRef.current;
    if (!container || !pageStack) return;

    const containerRect = container.getBoundingClientRect();
    const pageStackRect = pageStack.getBoundingClientRect();
    const focalY = midpointY - containerRect.top;
    updateReadingPosition(focalY);

    touchStartDistRef.current = distance;
    lastPinchDistRef.current = distance;
    initialPinchZoomRef.current = zoom;
    pinchOriginRef.current = {
      x: midpointX - pageStackRect.left,
      y: midpointY - pageStackRect.top,
      clientX: midpointX,
      clientY: midpointY,
    };
    pinchAnchorRef.current = { ...currentViewRef.current, focalY };
    isPinchingRef.current = true;
    pageStack.style.willChange = 'transform';
  };

  const handleTouchMove = (e) => {
    if (!isPinchingRef.current || e.touches.length !== 2) return;
    if (e.cancelable) e.preventDefault();

    const [firstTouch, secondTouch] = e.touches;
    const currentDist = Math.hypot(
      firstTouch.clientX - secondTouch.clientX,
      firstTouch.clientY - secondTouch.clientY,
    );
    const midpointX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const midpointY = (firstTouch.clientY + secondTouch.clientY) / 2;
    lastPinchDistRef.current = currentDist;

    const container = containerRef.current;
    if (container) {
      pinchAnchorRef.current = {
        ...currentViewRef.current,
        focalY: midpointY - container.getBoundingClientRect().top,
      };
    }

    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
    pinchRafRef.current = requestAnimationFrame(() => {
      const pageStack = pageStackRef.current;
      if (!pageStack || touchStartDistRef.current <= 10) {
        pinchRafRef.current = null;
        return;
      }

      const scale = getPinchScale(
        initialPinchZoomRef.current,
        touchStartDistRef.current,
        currentDist,
      );
      const origin = pinchOriginRef.current;
      pageStack.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      pageStack.style.transform = `translate(${midpointX - origin.clientX}px, ${midpointY - origin.clientY}px) scale(${scale})`;
      pinchRafRef.current = null;
    });
  };

  touchMoveHandlerRef.current = handleTouchMove;

  const handleTouchEnd = (e) => {
    if (!isPinchingRef.current || e.touches.length >= 2) return;

    isPinchingRef.current = false;
    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
    pinchRafRef.current = null;

    const targetZoom = getPinchZoom(
      initialPinchZoomRef.current,
      touchStartDistRef.current,
      lastPinchDistRef.current,
    );
    touchStartDistRef.current = 0;

    if (targetZoom === zoom) {
      pageStackRef.current?.style.removeProperty('transform');
      pageStackRef.current?.style.removeProperty('transform-origin');
      pageStackRef.current?.style.removeProperty('will-change');
      pinchAnchorRef.current = null;
      return;
    }

    setZoom(targetZoom);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleNativeTouchMove = (event) => touchMoveHandlerRef.current?.(event);
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => container.removeEventListener('touchmove', handleNativeTouchMove);
  }, [containerRef]);

  return {
    handleTouchStart,
    handleTouchEnd,
    isPinchingRef,
  };
}
