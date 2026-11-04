import { useLayoutEffect, useRef } from 'react';
import { getPinchScale, getPinchZoom } from './zoomUtils';

const getTouchDistance = (touches) =>
  Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

const getTextPositionAtPoint = (x, y) => {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (position?.offsetNode?.nodeType === Node.TEXT_NODE) {
      return { node: position.offsetNode, offset: position.offset };
    }
  }

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range?.startContainer?.nodeType === Node.TEXT_NODE) {
      return { node: range.startContainer, offset: range.startOffset };
    }
  }

  return null;
};

const clearPreviewTransform = (preview) => {
  if (!preview) return;
  preview.style.removeProperty('transform');
  preview.style.removeProperty('transform-origin');
  preview.style.removeProperty('will-change');
};

/** Menerapkan gerak pinch di compositor, lalu satu reflow saat gestur selesai. */
export const useAnchoredPinchZoom = ({ containerRef, previewRef, zoom, setZoom }) => {
  const startDistanceRef = useRef(0);
  const startZoomRef = useRef(zoom);
  const startMidpointRef = useRef({ x: 0, y: 0 });
  const transformOriginRef = useRef({ x: 0, y: 0 });
  const lastDistanceRef = useRef(0);
  const isPinchingRef = useRef(false);
  const pinchRafRef = useRef(null);
  const touchMoveHandlerRef = useRef(null);
  const pendingAnchorRef = useRef(null);
  const previousZoomRef = useRef(zoom);

  const captureAnchor = (clientX, clientY, focalX, focalY) => {
    const container = containerRef.current;
    if (!container) return null;

    return {
      container,
      position: getTextPositionAtPoint(clientX, clientY),
      focalX,
      focalY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      scrollWidth: container.scrollWidth,
      scrollHeight: container.scrollHeight,
    };
  };

  const prepareZoom = () => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const focalX = container.clientWidth / 2;
    const focalY = container.clientHeight * 0.35;
    pendingAnchorRef.current = captureAnchor(rect.left + focalX, rect.top + focalY, focalX, focalY);
  };

  const handleTouchStart = (event) => {
    if (event.touches.length !== 2) return;

    const [firstTouch, secondTouch] = event.touches;
    const midpointX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const midpointY = (firstTouch.clientY + secondTouch.clientY) / 2;
    const containerRect = containerRef.current?.getBoundingClientRect();
    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!containerRect || !previewRect) return;

    const distance = getTouchDistance(event.touches);
    startDistanceRef.current = distance;
    lastDistanceRef.current = distance;
    startZoomRef.current = zoom;
    startMidpointRef.current = { x: midpointX, y: midpointY };
    transformOriginRef.current = {
      x: midpointX - previewRect.left,
      y: midpointY - previewRect.top,
    };
    pendingAnchorRef.current = captureAnchor(
      midpointX,
      midpointY,
      midpointX - containerRect.left,
      midpointY - containerRect.top,
    );
    isPinchingRef.current = true;
    previewRef.current.style.willChange = 'transform';
  };

  const handleTouchMove = (event) => {
    if (!isPinchingRef.current || event.touches.length !== 2) return;
    if (event.cancelable) event.preventDefault();

    const [firstTouch, secondTouch] = event.touches;
    const currentDistance = getTouchDistance(event.touches);
    const midpointX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const midpointY = (firstTouch.clientY + secondTouch.clientY) / 2;
    lastDistanceRef.current = currentDistance;

    const container = containerRef.current;
    const containerRect = container?.getBoundingClientRect();
    if (containerRect) {
      pendingAnchorRef.current = captureAnchor(
        midpointX,
        midpointY,
        midpointX - containerRect.left,
        midpointY - containerRect.top,
      );
    }

    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
    pinchRafRef.current = requestAnimationFrame(() => {
      const preview = previewRef.current;
      if (!preview || startDistanceRef.current <= 10) {
        pinchRafRef.current = null;
        return;
      }

      const scale = getPinchScale(startZoomRef.current, startDistanceRef.current, currentDistance);
      const { x: originX, y: originY } = transformOriginRef.current;
      const { x: startX, y: startY } = startMidpointRef.current;

      preview.style.transformOrigin = `${originX}px ${originY}px`;
      preview.style.transform = `translate(${midpointX - startX}px, ${midpointY - startY}px) scale(${scale})`;
      pinchRafRef.current = null;
    });
  };

  touchMoveHandlerRef.current = handleTouchMove;

  const handleTouchEnd = (event) => {
    if (!isPinchingRef.current || event.touches.length >= 2) return;

    isPinchingRef.current = false;
    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
    pinchRafRef.current = null;

    const targetZoom = getPinchZoom(
      startZoomRef.current,
      startDistanceRef.current,
      lastDistanceRef.current,
    );
    startDistanceRef.current = 0;

    if (targetZoom === zoom) {
      clearPreviewTransform(previewRef.current);
      pendingAnchorRef.current = null;
      return;
    }

    setZoom(targetZoom);
  };

  useLayoutEffect(() => {
    if (previousZoomRef.current === zoom) return;
    previousZoomRef.current = zoom;

    const anchor = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    const container = containerRef.current;
    clearPreviewTransform(previewRef.current);
    if (!anchor || anchor.container !== container || !container?.isConnected) return;

    const { position } = anchor;
    if (position?.node?.isConnected && container.contains(position.node)) {
      const range = document.createRange();
      const maxOffset = position.node.textContent?.length || 0;
      range.setStart(position.node, Math.min(position.offset, maxOffset));
      range.collapse(true);

      const caretRect = range.getBoundingClientRect();
      if (caretRect.height > 0) {
        const containerRect = container.getBoundingClientRect();
        container.scrollTop += caretRect.top - (containerRect.top + anchor.focalY);
        container.scrollLeft += caretRect.left - (containerRect.left + anchor.focalX);
        return;
      }
    }

    const verticalRange = Math.max(1, anchor.scrollHeight - container.clientHeight);
    const horizontalRange = Math.max(1, anchor.scrollWidth - container.clientWidth);
    container.scrollTop =
      (anchor.scrollTop / verticalRange) *
      Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollLeft =
      (anchor.scrollLeft / horizontalRange) *
      Math.max(0, container.scrollWidth - container.clientWidth);
  }, [containerRef, previewRef, zoom]);

  useLayoutEffect(
    () => () => {
      if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
      clearPreviewTransform(previewRef.current);
    },
    [previewRef],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleNativeTouchMove = (event) => touchMoveHandlerRef.current?.(event);
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => container.removeEventListener('touchmove', handleNativeTouchMove);
  });

  return { handleTouchStart, handleTouchEnd, prepareZoom };
};
