export const layout = {
  authShell: 'auth-shell',
  authCard: 'auth-card w-full max-w-md',
  pageShell: 'flex min-h-full w-full flex-col gap-section-gap px-page-x py-section-gap',
  screen: 'min-h-screen bg-cream-50 app-surface',
  contentCenter: 'mx-auto w-full max-w-2xl',
  rowBetween: 'flex items-center justify-between',
  rowCenter: 'flex items-center justify-center',
  rowStart: 'flex items-center gap-1.5',
  rowGap2: 'flex items-center gap-2',
  rowWrap: 'flex flex-wrap items-center gap-2',
  rowShrink: 'flex shrink-0 items-center gap-1.5',
  rowEnd: 'flex items-start justify-between gap-4',
  rowStartGap: 'flex items-start gap-2.5',
  column: 'flex flex-col justify-between gap-3 sm:flex-row sm:items-end',
  toolbarRow: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
  media: 'h-full w-full object-cover',
  divider: 'divide-y divide-cream-200',
  stack: 'flex flex-col gap-3',
};

export const typography = {
  fieldLabel: 'mb-1 block text-small font-bold text-ink-700',
  fieldLabelSoft: 'mb-1 block text-small font-semibold text-ink-700',
  legend: 'mb-1.5 block text-caption font-bold uppercase tracking-wider text-ink-500',
  sectionTitle: 'font-display text-title font-bold tracking-tight text-ink-900',
  sectionTitlePlain: 'font-display text-title font-bold tracking-tight',
  subTitle: 'font-display text-subtitle font-bold text-ink-900',
  cardTitle: 'text-h2 font-bold text-ink-900',
  emphasis: 'font-bold text-ink-900',
  emphasisInline: 'text-h2 font-bold text-ink-900',
  helper: 'mt-1 text-body text-ink-500',
  helperMuted: 'mt-1 text-body text-ink-500',
  helperRelaxed: 'mt-2 text-body leading-relaxed text-ink-500',
  helperTight: 'mt-0.5 text-caption text-ink-500',
  helperInline: 'text-caption text-ink-500',
  meta: 'text-small text-ink-500',
  metaTight: 'text-small text-ink-500 mt-0.5',
};

export const surfaces = {
  panel: 'rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-sm',
  panelSpaced: 'rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-sm space-y-4',
  panelMuted: 'rounded-card border border-cream-300 bg-cream-100 shadow-sm',
  dropzone:
    'flex h-full items-center justify-center rounded-2xl border border-dashed ' +
    'border-cream-300 bg-cream-100 text-center text-small text-ink-500',
  statBadge:
    'w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5',
};

export const controls = {
  input:
    'w-full rounded-input border border-cream-300 px-3 py-2.5 text-body transition ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:opacity-60',
  inputWrap: 'auth-input-wrap mt-1.5',
  select:
    'w-full rounded-input border border-cream-300 bg-cream-50 px-3 py-2.5 text-body transition ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
  iconSm: 'w-3.5 h-3.5 text-brand-800',
  iconMd: 'w-4 h-4 text-brand-800',
  iconXs: 'w-3 h-3 text-brand-600',
  iconBrand: 'h-4 w-4 text-brand-600',
  spinner: 'h-4 w-4 animate-spin',
  emptyIcon: 'mx-auto h-9 w-9 text-cream-300',
  chip:
    'inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-cream-50 ' +
    'px-3.5 py-2.5 text-caption font-bold text-ink-700 shadow-sm',
};
