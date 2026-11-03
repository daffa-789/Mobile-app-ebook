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

const buildStructuralVars = (tokens) => {
  const rows = [];
  const push = (name, value) => {
    if (value !== undefined && value !== null && value !== '') rows.push([name, value]);
  };

  const cr = tokens.shapes?.componentRadius;
  if (cr) {
    push('--radius-btn', cr.button);
    push('--radius-card', cr.card);
    push('--radius-modal', cr.modal);
    push('--radius-input', cr.input);
    push('--radius-badge', cr.badge);
  }

  const btn = tokens.components?.button;
  if (btn) {
    push('--radius-btn', btn.radius);
    push('--btn-height-sm', btn.heightSm);
    push('--btn-height-md', btn.heightMd);
    push('--btn-height-lg', btn.heightLg);
    push('--btn-px-sm', btn.paddingXSm);
    push('--btn-px-md', btn.paddingXMd);
    push('--btn-px-lg', btn.paddingXLg);
    push('--btn-font-sm', btn.fontSizeSm);
    push('--btn-font-md', btn.fontSizeMd);
    push('--btn-font-lg', btn.fontSizeLg);
  }

  const card = tokens.components?.card;
  if (card) {
    push('--radius-card', card.radius);
    push('--card-padding-sm', card.paddingSm);
    push('--card-padding-md', card.paddingMd);
    push('--card-padding-lg', card.paddingLg);
    push('--card-border-width', card.borderWidth);
    push('--card-shadow', card.shadow);
  }

  const inp = tokens.components?.input;
  if (inp) {
    push('--radius-input', inp.radius);
    push('--input-height', inp.height);
    push('--input-px', inp.paddingX);
    push('--input-font-size', inp.fontSize);
    push('--input-border-width', inp.borderWidth);
  }

  const frame = tokens.components?.deviceFrame;
  if (frame) {
    push('--device-frame-radius', frame.radius);
    push('--device-frame-max-width', frame.maxWidth);
    push('--device-frame-max-height', frame.maxHeight);
    push('--device-frame-border-width', frame.borderWidth);
    push('--device-frame-border-color', frame.borderColor);
  }

  const modal = tokens.components?.modal;
  if (modal) {
    push('--radius-modal', modal.radius);
    push('--modal-padding', modal.padding);
    push('--modal-max-width', modal.maxWidth);
  }

  const sb = tokens.components?.sidebar;
  if (sb) {
    push('--sidebar-w-expanded', sb.widthExpanded);
    push('--sidebar-w-collapsed', sb.widthCollapsed);
    push('--sidebar-bg', sb.background);
    push('--sidebar-item-radius', sb.itemRadius);
  }

  if (tokens.elevation) {
    Object.entries(tokens.elevation).forEach(([key, value]) => push(`--shadow-${key}`, value));
  }

  const m = tokens.motion;
  if (m) {
    push('--duration-fast', m.durationFast);
    push('--duration-base', m.durationBase);
    push('--duration-slow', m.durationSlow);
    push('--ease-out', m.easeOut);
    push('--ease-in-out', m.easeInOut);
  }

  const L = tokens.layout;
  if (L) {
    push('--content-narrow', L.contentNarrow);
    push('--content-default', L.contentDefault);
    push('--content-wide', L.contentWide);
    push('--page-padding-x', L.pagePaddingX);
    push('--section-gap', L.sectionGap);
  }

  return rows;
};

const toBlock = (selector, rows) => {
  if (!rows.length) return '';
  const body = rows.map(([name, value]) => `  ${name}: ${value};`).join('\n');
  return `${selector} {\n${body}\n}\n`;
};

function applyThemeTokens(tokens = themeConfig) {
  if (typeof document === 'undefined') return;

  const rows = [...buildColorVars(tokens.colors), ...buildStructuralVars(tokens)];

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
