const MIN_READER_ZOOM = 40;
const MAX_READER_ZOOM = 300;

const PINCH_RESPONSE = 0.75;

/**
 * Respons pinch trackpad (event `wheel` dengan `ctrlKey`). Dinyatakan per unit
 * `deltaY` dan bersifat perkalian, supaya rasio zoom tidak bergantung pada
 * dari mana gesture dimulai — sama seperti pinch dua jari.
 */
const WHEEL_RESPONSE = 0.005;

/** Satu notch mouse wheel (deltaMode 'lines') = naik/turun 20% zoom. */
const WHEEL_LINE_STEP = 1.2;

/** Batas gerak per event; trackpad kadang mengirim delta raksasa saat dilepas. */
const WHEEL_MAX_FACTOR = 1.35;

export const clampZoom = (value) =>
  Math.min(MAX_READER_ZOOM, Math.max(MIN_READER_ZOOM, Math.round(value)));

export const getPinchScale = (startZoom, startDistance, currentDistance) => {
  if (startDistance <= 0) return 1;
  const distanceRatio = Math.max(0.1, currentDistance / startDistance);
  const scale = distanceRatio ** PINCH_RESPONSE;
  return Math.min(MAX_READER_ZOOM / startZoom, Math.max(MIN_READER_ZOOM / startZoom, scale));
};

export const getPinchZoom = (startZoom, startDistance, currentDistance) =>
  clampZoom(startZoom * getPinchScale(startZoom, startDistance, currentDistance));

/**
 * Skala kumulatif pinch trackpad. `deltaMode === 1` berarti per-baris (mouse
 * wheel biasa): memakai langkah diskrit supaya satu notch tidak melompat
 * puluhan persen. Selain itu dianggap delta kontinu (trackpad presisi).
 */
export const getWheelScale = (currentScale, deltaY, deltaMode) => {
  if (!deltaY) return currentScale;
  const faktor =
    deltaMode === 1
      ? deltaY < 0
        ? WHEEL_LINE_STEP
        : 1 / WHEEL_LINE_STEP
      : Math.exp(-deltaY * WHEEL_RESPONSE);
  const aman = Math.min(WHEEL_MAX_FACTOR, Math.max(1 / WHEEL_MAX_FACTOR, faktor));
  const hasil = currentScale * aman;
  return Math.min(MAX_READER_ZOOM / 40, Math.max(MIN_READER_ZOOM / 300, hasil));
};
