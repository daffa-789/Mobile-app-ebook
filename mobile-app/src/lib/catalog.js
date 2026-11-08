/**
 * Normalisasi URL relatif atau absolut ke API.
 */
export function absoluteApiUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
    'http://localhost:5000/api';
  const cleanBase = String(baseUrl).replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Format angka ke mata uang Rupiah.
 */
export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

/**
 * Format tanggal pembelian / transaksi ke zona waktu WIB (UTC+7).
 */
export function formatPurchaseDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return (
      d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }) +
      ', ' +
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }) +
      ' WIB'
    );
  } catch (_) {
    return String(dateStr);
  }
}

/**
 * Konversi teks HTML naskah menjadi teks polos untuk pembaca mobile.
 */
export function htmlToPlainText(html) {
  if (!html) return '';
  let text = String(html);
  // Ganti tag jeda baris dan paragraf dengan baris baru ganda
  text = text.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  // Hapus sisa tag HTML
  text = text.replace(/<[^>]+>/g, '');
  // Decode entitas umum
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
  // Rapikan spasi berlebih
  return text
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Paginasi teks polos menjadi lembaran halaman bacaan.
 */
export function paginateText(text, charsPerPage = 1100) {
  if (!text || typeof text !== 'string') return [''];
  const paragraphs = text.split('\n\n');
  const pages = [];
  let currentPage = '';

  for (const p of paragraphs) {
    if ((currentPage + '\n\n' + p).length > charsPerPage && currentPage.length > 0) {
      pages.push(currentPage.trim());
      currentPage = p;
    } else {
      currentPage = currentPage ? `${currentPage}\n\n${p}` : p;
    }
  }

  if (currentPage.trim().length > 0) {
    pages.push(currentPage.trim());
  }

  return pages.length > 0 ? pages : [''];
}

/**
 * Normalisasi data buku dari server Supabase / Express.
 */
export function normalizeBook(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id || raw.slug || `book-${index}`);
  const title = String(raw.title || 'Tanpa Judul');
  const author = String(raw.author || 'Penyiar Sholawat Wahidiyah');
  const category = String(raw.category || 'Kitab & Amalan');
  const description = String(raw.description || 'Naskah bacaan resmi Wahidiyah Book.');
  const pagesCount = Number(raw.pages_count || raw.pages || 0);
  const isLocked = Boolean(raw.is_locked || raw.is_pro || raw.requires_pro);

  // URL thumbnail cover dari server
  const coverUrl =
    raw.cover_url || raw.thumbnail_url || (id ? absoluteApiUrl(`/books/${id}/thumbnail`) : null);

  const fileType = String(raw.file_type || raw.extension || 'txt').toLowerCase();
  const contentName = raw.content_name || raw.filename || '';
  const sampleText = raw.sample_text || '';

  return {
    id,
    title,
    author,
    category,
    description,
    pages_count: pagesCount,
    is_locked: isLocked,
    cover_url: coverUrl,
    file_type: fileType,
    content_name: contentName,
    sample_text: sampleText,
  };
}

/**
 * Normalisasi agenda / event kegiatan.
 */
export function normalizeEvent(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id || `event-${index}`);
  const title = String(raw.title || 'Agenda Wahidiyah');
  const eventDate = String(raw.event_date || raw.date || '');
  const timeStart = String(raw.time_start || '08:00');
  const timeEnd = String(raw.time_end || '11:00');
  const location = String(raw.location || 'Pesantren Kedunglo, Kediri');
  const category = String(raw.category || 'Mujahadah');
  const description = String(raw.description || '');

  let dateDisplay = eventDate;
  if (eventDate) {
    try {
      const parts = eventDate.split('-');
      if (parts.length === 3) {
        const d = new Date(eventDate);
        dateDisplay = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch (_) {}
  }

  const mapsUrl =
    raw.mapsUrl ||
    raw.maps_url ||
    (location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : 'https://maps.google.com');

  return {
    id,
    title,
    event_date: eventDate,
    dateDisplay,
    time_start: timeStart,
    time_end: timeEnd,
    location,
    mapsUrl,
    category,
    description,
  };
}

/**
 * Normalisasi slide banner carousel.
 */
export function normalizeSlide(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id || `crs-${index}`);
  const title = String(raw.title || 'Wahidiyah Book');
  const description = String(raw.description || '');
  const eventDate = String(raw.eventDate || raw.event_date || '');
  const dateLabel = String(raw.dateLabel || raw.date_label || 'AGENDA');

  return {
    id,
    title,
    description,
    eventDate,
    dateLabel,
  };
}

/**
 * Normalisasi riwayat transaksi & langganan Pro.
 */
export function normalizeSubscription(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id || `sub-${index}`);
  const planName = String(raw.plan_name || raw.plan || 'Paket Bulanan');
  const amount = Number(raw.amount || raw.total_paid || 25000);
  const status = String(raw.status || 'success');
  const createdAt = String(raw.created_at || raw.date || new Date().toISOString());
  const expiresAt = String(raw.expires_at || '');
  const paymentMethod = String(raw.payment_method || 'QRIS');

  return {
    id,
    plan_name: planName,
    amount,
    status,
    created_at: createdAt,
    expires_at: expiresAt,
    payment_method: paymentMethod,
    formattedAmount: formatRupiah(amount),
    formattedDate: formatPurchaseDate(createdAt),
  };
}

/**
 * Bangun teks fallback pembaca saat konten naskah belum dapat diunduh.
 */
export function buildReaderFallback(book) {
  if (!book) return 'Naskah tidak tersedia.';
  return (
    `JUDUL: ${book.title}\n` +
    `PENULIS: ${book.author}\n` +
    `KATEGORI: ${book.category}\n\n` +
    `RINGKASAN:\n${book.description}\n\n` +
    `CATATAN:\nNaskah lengkap format ${book.file_type?.toUpperCase() || 'DOKUMEN'} dapat diakses langsung saat tersambung ke jaringan.`
  );
}
