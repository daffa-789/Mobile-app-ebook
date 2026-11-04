// Pengelompokan ribuan MANUAL — Intl di Hermes hanya sebagian (§19).
// formatRupiah(25000) -> "Rp 25.000"
export function formatRupiah(value) {
  const n = Math.trunc(Number(value || 0));
  const neg = n < 0;
  const digits = String(Math.abs(n));
  const parts = [];
  let rest = digits;
  while (rest.length > 3) {
    parts.unshift(rest.slice(-3));
    rest = rest.slice(0, -3);
  }
  parts.unshift(rest);
  return `${neg ? '-Rp ' : 'Rp '}${parts.join('.')}`;
}
