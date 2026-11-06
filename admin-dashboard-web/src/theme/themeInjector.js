import themeConfig from '../../component.json';

/* ── R53: Injeksi token desain ────────────────────────────────────────────────
   Dulu berkas ini menuliskan warna sebagai inline style pada <html>, sehingga
   tema tidak bisa diganti lewat kelas CSS, lalu sempat memuat dua blok (:root
   untuk Terang dan .dark untuk Malam). Aplikasi kini satu tema terang, jadi
   hanya blok :root yang disuntikkan — seluruh warna tetap bersumber dari
   component.json (single source of truth).

   Setiap warna ditulis DUA KALI:
     --cream-50 : "251 248 243"  → tripel RGB, dipakai Tailwind lewat
                                    `rgb(var(--cream-50) / <alpha-value>)`
     --color-cream-50 : "#FBF8F3" → hex, dipakai kelas kustom di index.css
   */

const STYLE_ID = 'wb-design-tokens';

const hexToRgbTriplet = (hex) => {
  if (typeof hex !== 'string') return null;
  const h = hex.trim().replace(/^#/, '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const int = parseInt(full, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
};

const isHex = (value) =>
  typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

/** Skala warna (brand/gold/cream/ink) → pasangan var triplet + hex. */
const pushScale = (rows, prefix, scale) => {
  if (!scale) return;
  Object.entries(scale).forEach(([shade, value]) => {
    if (!isHex(value)) return;
    const triplet = hexToRgbTriplet(value);
    if (triplet) rows.push([`--${prefix}-${shade}`, triplet]);
    rows.push([`--color-${prefix}-${shade}`, value]);
  });
};

/** Pasangan var untuk satu warna tunggal (mis. primary, accent.gold). */
const pushSingle = (rows, tripletName, hexName, value) => {
  if (!isHex(value)) return;
  const triplet = hexToRgbTriplet(value);
  if (triplet) rows.push([tripletName, triplet]);
  rows.push([hexName, value]);
};

const buildColorVars = (palette) => {
  if (!palette) return [];
  const rows = [];

  pushScale(rows, 'brand', palette.brand);
  pushScale(rows, 'gold', palette.gold);
  pushScale(rows, 'cream', palette.cream);
  pushScale(rows, 'ink', palette.ink);

  if (palette.accent?.gold)
    pushSingle(rows, '--accent-gold', '--color-accent-gold', palette.accent.gold);

  const ui = palette.ui;
  if (ui) {
    pushSingle(rows, '--ui-bg', '--color-ui-bg', ui.background);
    pushSingle(rows, '--ui-surface', '--color-ui-surface', ui.surface);
    pushSingle(rows, '--ui-card', '--color-ui-card', ui.card);
    pushSingle(rows, '--ui-border', '--color-ui-border', ui.border);
    pushSingle(rows, '--ui-text', '--color-ui-text-primary', ui.textPrimary);
    pushSingle(rows, '--ui-text-secondary', '--color-ui-text-secondary', ui.textSecondary);
    pushSingle(rows, '--ui-text-muted', '--color-ui-text-muted', ui.textMuted);
  }

  const semantic = palette.semantic;
  if (semantic) {
    const pairs = [
      ['success', '--semantic-success'],
      ['successLight', '--semantic-success-light'],
      ['warning', '--semantic-warning'],
      ['warningLight', '--semantic-warning-light'],
      ['danger', '--semantic-danger'],
      ['dangerLight', '--semantic-danger-light'],
      ['dangerOnDark', '--semantic-danger-on-dark'],
      ['mutedOnDark', '--semantic-muted-on-dark'],
      ['info', '--semantic-info'],
      ['infoLight', '--semantic-info-light'],
    ];
    pairs.forEach(([key, tripletName]) => {
      if (semantic[key]) pushSingle(rows, tripletName, `--color-semantic-${key}`, semantic[key]);
    });
  }

  pushSingle(rows, '--primary', '--color-brand-primary', palette.primary);
  pushSingle(rows, '--primary-hover', '--color-brand-primary-hover', palette.primaryHover);
  pushSingle(rows, '--primary-light', '--color-brand-primary-light', palette.primaryLight);

  return rows;
};

const toBlock = (selector, rows) => {
  if (!rows.length) return '';
  const body = rows.map(([name, value]) => `  ${name}: ${value};`).join('\n');
  return `${selector} {\n${body}\n}\n`;
};

function applyThemeTokens(tokens = themeConfig) {
  if (typeof document === 'undefined') return;

  const rows = buildColorVars(tokens.colors);

  const css = toBlock(':root', rows);

  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

if (typeof window !== 'undefined') {
  applyThemeTokens(themeConfig);
}
