/**
 * Ambil nilai dari objek dengan mencoba beberapa nama kunci berurutan.
 *
 * Supabase (PostgREST) mengembalikan `snake_case`, sementara seluruh kode
 * klien memakai `camelCase`. Setiap normalizer karena itu sebelumnya menulis
 * `data.subscription_period ?? data.subscriptionPeriod ?? null` — pola yang
 * berulang 27 kali di berkas ini.
 *
 * Dengan helper ini menjadi `pick(data, 'subscription_period', 'subscriptionPeriod')`.
 *
 * Aturan penting yang dipertahankan persis: `undefined` dan `null` SAMA-SAMA
 * dilewati (memakai `??`), tetapi `false`, `0`, dan `''` dianggap nilai sah
 * sehingga tidak tertimpa oleh fallback. Ini yang membuat `is_pro: false`
 * tidak keliru jatuh ke default.
 */
const pick = (source, ...keys) => {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const EVENT_BADGE_COLORS = {
  Mujahadah: 'bg-brand-50 text-brand-800 border-brand-200',
  Pengajian: 'bg-brand-50 text-brand-800 border-brand-200',
  Kubro: 'bg-brand-50 text-brand-800 border-brand-200',
  Peringatan: 'bg-brand-50 text-brand-800 border-brand-200',
};

export const EMPTY_USER = {
  id: null,
  name: '',
  email: '',
  phone: '',
  role: 'user',
  loginMethod: 'email',
  isPro: false,
  activePlan: null,
  subscriptionPeriod: null,
  subscriptionExpiresAt: null,
  createdAt: null,
};

export const normalizeUser = (data = {}) => {
  const isPro = Boolean(pick(data, 'is_pro', 'isPro'));
  return {
    id: data.id ?? null,
    name: data.name ?? '',
    email: data.email ?? '',
    phone: pick(data, 'phone') ?? '',
    role: data.role === 'admin' ? 'admin' : 'user',
    loginMethod: pick(data, 'login_method', 'loginMethod') ?? 'email',
    isPro,
    activePlan: null,
    subscriptionPeriod: isPro
      ? (pick(data, 'subscription_period', 'subscriptionPeriod') ?? null)
      : null,
    subscriptionExpiresAt: isPro
      ? (pick(data, 'subscription_expires_at', 'subscriptionExpiresAt') ?? null)
      : null,
    createdAt: pick(data, 'created_at', 'createdAt') ?? null,
  };
};

export const userSignature = (target = EMPTY_USER) =>
  JSON.stringify([
    target.id ?? null,
    target.name ?? '',
    target.email ?? '',
    target.role ?? 'user',
    target.loginMethod ?? 'email',
    Boolean(target.isPro),
    target.activePlan ?? null,
    target.subscriptionPeriod ?? null,
    target.subscriptionExpiresAt ?? null,
    target.createdAt ?? null,
  ]);

export const normalizeBook = (book = {}) => ({
  id: book.id,
  title: book.title || 'Tanpa judul',
  pages: Number(book.pages || book.total_pages || 1),
  isLocked: Boolean(pick(book, 'is_locked', 'isLocked')),
  coverUrl:
    book.cover_url ||
    book.coverUrl ||
    (book.has_thumbnail ? `/api/books/${encodeURIComponent(book.id)}/thumbnail` : null),
  contentUrl:
    book.contentUrl ||
    (book.has_content ? `/api/books/${encodeURIComponent(book.id)}/content` : null),
  contentName: pick(book, 'content_name', 'contentName') || null,
  contentType:
    pick(book, 'content_type', 'contentType') || (book.content_extension || '').replace('.', ''),
  contentExtension: book.content_extension || '',
  hasContent: Boolean(pick(book, 'has_content', 'hasContent')),
  createdAt: pick(book, 'created_at', 'createdAt') || null,
});

export const normalizeEvent = (event = {}) => {
  const dateStr = String(pick(event, 'event_date', 'date') ?? '').slice(0, 10);
  const timeStart = pick(event, 'time_start', 'timeStart') || '';
  const timeEnd = pick(event, 'time_end', 'timeEnd') || '';
  const category = event.category || '';
  return {
    id: event.id,
    title: event.title || 'Tanpa judul',
    date: dateStr,
    timeStart,
    timeEnd,

    time: event.time || [timeStart, timeEnd].filter(Boolean).join(' – '),
    location: event.location || '',
    category,
    description: event.description || '',
    organizer: event.organizer || '',

    showInCarousel: Boolean(pick(event, 'show_in_carousel', 'showInCarousel')),
    badgeColor:
      event.badgeColor ||
      EVENT_BADGE_COLORS[category] ||
      'bg-brand-50 text-brand-800 border-brand-200',
    createdAt: pick(event, 'created_at', 'createdAt') ?? null,
  };
};

export const normalizeCarouselSlide = (slide = {}) => {
  const rawImage = String(pick(slide, 'image_url', 'imageUrl') ?? '');
  return {
    id: slide.id,
    title: slide.title || 'Tanpa judul',
    description: slide.description || '',
    imageUrl: /^(data:image\/|https?:\/\/)/i.test(rawImage) ? rawImage : null,
    eventId: pick(slide, 'event_id', 'eventId') ?? null,
    eventDate: String(pick(slide, 'event_date', 'eventDate') ?? '').slice(0, 10) || null,
    sortOrder: Number(pick(slide, 'sort_order', 'sortOrder') ?? 0) || 0,
    isActive: Boolean(pick(slide, 'is_active', 'isActive') ?? true),
    startsAt: String(pick(slide, 'starts_at', 'startsAt') ?? '').slice(0, 10) || null,
    endsAt: String(pick(slide, 'ends_at', 'endsAt') ?? '').slice(0, 10) || null,
    createdAt: pick(slide, 'created_at', 'createdAt') ?? null,
  };
};

export const normalizeTransaction = (tx = {}) => ({
  id: tx.id,
  refNo: pick(tx, 'ref_no', 'refNo') ?? '',
  planName: pick(tx, 'plan_name', 'planName') ?? '',
  amount: Number(tx.amount ?? 0),
  adminFee: Number(pick(tx, 'admin_fee', 'adminFee') ?? 0),
  totalPaid: Number(pick(tx, 'total_paid', 'totalPaid') ?? 0),
  paymentMethod: pick(tx, 'payment_method', 'paymentMethod') ?? '',
  status: tx.status ?? '',
  verifiedAt: pick(tx, 'verified_at', 'verifiedAt') ?? null,
  createdAt: pick(tx, 'created_at', 'createdAt') ?? null,
  userName: tx.userName ?? '',
  userEmail: tx.userEmail ?? '',
});
