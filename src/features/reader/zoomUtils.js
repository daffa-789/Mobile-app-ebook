const MIN_READER_ZOOM = 40;
const MAX_READER_ZOOM = 300;

const PINCH_RESPONSE = 0.75;

export const getPinchScale = (startZoom, startDistance, currentDistance) => {
  if (startDistance <= 0) return 1;
  const distanceRatio = Math.max(0.1, currentDistance / startDistance);
  const scale = distanceRatio ** PINCH_RESPONSE;
  return Math.min(MAX_READER_ZOOM / startZoom, Math.max(MIN_READER_ZOOM / startZoom, scale));
};

export const getPinchZoom = (startZoom, startDistance, currentDistance) => {
  const nextZoom = startZoom * getPinchScale(startZoom, startDistance, currentDistance);
  return Math.min(MAX_READER_ZOOM, Math.max(MIN_READER_ZOOM, Math.round(nextZoom)));
};
