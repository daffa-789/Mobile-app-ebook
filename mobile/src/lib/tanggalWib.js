// WIB = UTC+7. Geser +7 jam manual (§19) — tidak memakai Intl/timezone plugin.
export const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export function wibDate(input) {
  if (!input) return null;
  const t = new Date(input).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + 7 * 60 * 60 * 1000);
}

export function formatWIB(input, { withTime = true } = {}) {
  const d = wibDate(input);
  if (!d) return '-';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTH_NAMES[d.getUTCMonth()];
  const yyyy = d.getUTCFullYear();
  let out = `${dd} ${mon} ${yyyy}`;
  if (withTime) {
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    out += `, ${hh}.${mm}`;
  }
  return out;
}

export function dateLabel(input) {
  const d = wibDate(input);
  if (!d) return '—';
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
