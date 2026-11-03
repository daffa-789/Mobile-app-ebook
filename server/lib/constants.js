// server/lib/constants.js

export const CONTENT_EXTENSIONS = new Set([
  '.pdf',
  '.txt',
  '.doc',
  '.docx',
  '.rtf',
  '.odt',
  '.epub',
  '.md',
  '.csv',
]);

export const CONTENT_MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  rtf: 'application/rtf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  epub: 'application/epub+zip',
};

export const BOOK_FIELDS = [
  'id',
  'title',
  'pages',
  'is_locked',
  'cover_url',
  'content_name',
  'content_extension',
  'content_size',
  'created_at',
  'updated_at',
].join(', ');

export const QRIS_ADMIN_FEE = 3000;

export const SUBSCRIPTION_PLANS = [
  { id: 'monthly', name: 'Paket Bulanan', price: 25000, period: '/bulan' },
];

const DEFAULT_PLAN_ID = 'monthly';

export const findPlan = (planId) =>
  SUBSCRIPTION_PLANS.find((plan) => plan.id === String(planId || '').trim()) ||
  SUBSCRIPTION_PLANS.find((plan) => plan.id === DEFAULT_PLAN_ID);

export const CAROUSEL_TITLE_MAX = 200;
export const CAROUSEL_DESCRIPTION_MAX = 500;

export const CAROUSEL_IMAGE_WIDTH = 1600;
export const CAROUSEL_IMAGE_QUALITY = 78;
export const CAROUSEL_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const CAROUSEL_FIELDS = [
  'id',
  'title',
  'description',
  'image_url',
  'event_id',
  'event_date',
  'sort_order',
  'is_active',
  'starts_at',
  'ends_at',
  'created_at',
  'updated_at',
].join(', ');

export const NON_SPA_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.css',
  '.map',
  '.json',
  '.webmanifest',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp3',
  '.mp4',
  '.webm',
  '.pdf',
  '.zip',
  '.txt',
  '.xml',
]);
