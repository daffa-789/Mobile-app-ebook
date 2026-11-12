import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tokens = require('./component.json');

const fontStack = (value) => value.split(',').map((part) => part.trim().replace(/'/g, '"'));

const controlHeights = {
  sm: tokens.sizing.control.heightSm,
  md: tokens.sizing.control.heightMd,
  lg: tokens.sizing.control.heightLg,
};

/* ── Warna berbasis CSS variable ─────────────────────────────────────────────
   Setiap token warna menunjuk ke CSS variable RGB bertripel
   (mis. `--cream-50: 251 248 243`) alih-alih hex statis. `<alpha-value>` menjaga
   modifier opasitas seperti `bg-cream-50/95` tetap bekerja.

   Nilainya disuntikkan oleh `src/theme/themeInjector.js` (bersumber dari
   component.json) dan punya fallback statis di `shared/styles/global.css` agar render
   pertama tidak berkedip. Satu tema terang, jadi hanya satu set nilai. */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const scale = (prefix, shades) =>
  Object.fromEntries(shades.map((shade) => [shade, v(`${prefix}-${shade}`)]));

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './landing-page/**/*.{js,ts,jsx,tsx,html}',
    './admin-dashboard-web/**/*.{js,ts,jsx,tsx,html}',
    './shared/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      xs: '3px',
      sm: '4px',
      DEFAULT: '6px',
      md: '6px',
      lg: '8px',
      xl: '8px',
      '2xl': '10px',
      '3xl': '12px',
      full: '9999px',
      btn: tokens.shapes.componentRadius.button,
      card: tokens.shapes.componentRadius.card,
      modal: tokens.shapes.componentRadius.modal,
      input: tokens.shapes.componentRadius.input,
      badge: tokens.shapes.componentRadius.badge,
      frame: tokens.shapes.componentRadius.deviceFrame,
    },
    extend: {
      screens: { ...tokens.breakpoints },
      colors: {
        brand: scale('brand', [
          '50',
          '100',
          '200',
          '300',
          '400',
          '500',
          '600',
          '700',
          '800',
          '900',
          '950',
        ]),
        gold: scale('gold', ['300', '400', '500', '600', '700']),
        cream: scale('cream', ['50', '100', '200', '300', '400']),
        ink: scale('ink', ['200', '300', '400', '500', '600', '700', '800', '900']),
        accent: { gold: v('accent-gold') },
        /* QRIS red — token brand pihak ketiga yang SENGAJA tetap (fixed),
           tidak mengikuti tema (lihat DESIGN.md 1.5 whitelist). */
        qris: tokens.colors.qris,
        ui: {
          background: v('ui-bg'),
          surface: v('ui-surface'),
          card: v('ui-card'),
          border: v('ui-border'),
          textPrimary: v('ui-text'),
          textSecondary: v('ui-text-secondary'),
          textMuted: v('ui-text-muted'),
        },
        semantic: {
          success: v('semantic-success'),
          successLight: v('semantic-success-light'),
          warning: v('semantic-warning'),
          warningLight: v('semantic-warning-light'),
          danger: v('semantic-danger'),
          dangerLight: v('semantic-danger-light'),
          dangerOnDark: v('semantic-danger-on-dark'),
          mutedOnDark: v('semantic-muted-on-dark'),
          info: v('semantic-info'),
          infoLight: v('semantic-info-light'),
        },
        primary: {
          DEFAULT: v('primary'),
          hover: v('primary-hover'),
          light: v('primary-light'),
        },
      },
      fontFamily: {
        sans: fontStack(tokens.typography.fontFamilySans),
        display: fontStack(tokens.typography.fontFamilyDisplay),
        arabic: fontStack(tokens.typography.fontFamilyArabic),
      },
      fontSize: { ...tokens.typography.scale },
      letterSpacing: { ...tokens.typography.tracking },
      borderWidth: { ...tokens.shapes.borderWidth },
      boxShadow: { ...tokens.elevation },
      transitionTimingFunction: {
        'out-quart': tokens.motion.easeOut,
        'in-out-quart': tokens.motion.easeInOut,
      },
      transitionDuration: {
        fast: tokens.motion.durationFast,
        base: tokens.motion.durationBase,
        slow: tokens.motion.durationSlow,
      },
      width: {
        icon: { ...tokens.sizing.icon },
        avatar: { ...tokens.sizing.avatar },
      },
      height: {
        icon: { ...tokens.sizing.icon },
        avatar: { ...tokens.sizing.avatar },
        control: controlHeights,
      },
      minHeight: {
        control: controlHeights,
        touch: tokens.sizing.touchTarget,
      },
      maxWidth: {
        'content-narrow': tokens.layout.contentNarrow,
        content: tokens.layout.contentDefault,
        'content-wide': tokens.layout.contentWide,
      },
      spacing: {
        'page-x': tokens.layout.pagePaddingX,
        'section-gap': tokens.layout.sectionGap,
      },
    },
  },
  plugins: [],
};
