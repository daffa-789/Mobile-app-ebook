/**
 * Helper utilitas untuk tautan Google Maps universal
 * Mendukung URL langsung (maps.app.goo.gl, google.com/maps/place), format pipa "Nama Tempat | URL",
 * titik koordinat lat,lng, atau mode rute langsung.
 * 100% Gratis & Native tanpa butuh Google Maps Platform API key / kartu kredit.
 */

export function getMapUrl(location) {
  if (!location) return null;
  const trimmed = String(location).trim();

  // 1. Format gabungan: "Nama Tempat | https://maps.app.goo.gl/..."
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    const urlPart = parts.find((p) => /^https?:\/\//i.test(p.trim()));
    if (urlPart) return urlPart.trim();
  }

  // 2. URL langsung Google Maps (maps.app.goo.gl, google.com/maps, goo.gl)
  if (
    /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  // 3. Titik Koordinat Latitude, Longitude (contoh: -7.8279855, 112.0081854)
  const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    return `https://www.google.com/maps/search/?api=1&query=${coordMatch[1]},${coordMatch[2]}`;
  }

  // 4. Jika nama tempat teks biasa: arahkan langsung ke Mode Rute (Directions API 1)
  // Pengguna langsung melihat rute navigasi dari posisi mereka ke tujuan
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmed)}`;
}

export function getDisplayLocation(location) {
  if (!location) return '';
  const trimmed = String(location).trim();
  if (trimmed.includes('|')) {
    return trimmed.split('|')[0].trim();
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return 'Buka Titik Lokasi Google Maps';
  }
  return trimmed;
}
