/**
 * Service Worker — Wahidiyah Book PWA
 * Mendukung App Shell Offline, Cache-First untuk Aset Statis, Network-First untuk Data Publik,
 * dan Web Push Notification untuk pengingat kegiatan/agenda.
 */

// CACHE_NAME wajib di-bump setiap deploy (aturan proyek §R5.6) agar cache app shell
// versi lama dibuang saat activate — kali ini karena server ikut melayani dist/.
// v8 (R20): referensi `/api/categories` yang sudah mati dibuang dari rute cache.
// v9 (R55): handler Web Push (pengingat agenda H-1) + aksi notificationclick.
// v10: pengumuman agenda mujahadah baru + pengingat H-1.
// v11 (VULN-21): /api/payments/ masuk deny-list, respons Cache-Control
//      private/no-store tidak pernah disimpan, blok cache-first dibatasi
//      aset internal, dan cache dibuang saat pengguna keluar akun.
// v15: pinch zoom memakai preview GPU dan header baca buku diringkas.
// v16: wordmark QRIS resmi dipasang. Aset .svg dilayani cache-first, jadi tanpa
//      bump ini browser pengguna terus menampilkan logo lama meski server sudah
//      mengirim yang baru (inilah sebabnya aturan §R5.6 mewajibkan bump).
// v17: wordmark QRIS diberi latar putih — varian hitam transparan tidak terbaca
//      di tema gelap, tempat lencana metode pembayaran memakai permukaan gelap.
// v18: latar putih dipindah ke kelas .logo-plate; pita putih di dalam SVG tidak
//      memenuhi kotak lencana, jadi pelatnya kini whole-square di kedua tema.
// v19: pelat putih dibuang lagi. Wordmark QRIS satu warna, jadi ia dibalik lewat
//      dark:invert (penanda mono pada katalog metode) sehingga menyatu dengan kartu.
const CACHE_NAME = 'wahidiyah-app-shell-v19';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. Install & Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan sentuh request selain GET
  if (request.method !== 'GET') {
    return;
  }

  /* Respons yang tidak boleh masuk CacheStorage: sudah dipakai peramban
   * (private), atau ditandai jangan disimpan. Rute ber-`requireAuth` dan
   * gambar QR pembayaran berada di kelompok ini (VULN-21).
   */
  const isCacheable = (response) => {
    if (!response || response.status !== 200) return false;
    const cacheControl = response.headers.get('cache-control') || '';
    return !cacheControl.includes('private') && !cacheControl.includes('no-store');
  };

  // JANGAN cache endpoint buku berbayar/privat & autentikasi (Invarian Keamanan Konten)
  if (
    url.pathname.includes('/api/books/') && url.pathname.endsWith('/content') ||
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/api/subscriptions/') ||
    url.pathname.startsWith('/api/transactions') ||
    /* Pembayaran: QR, status polling, dan bukti. Semuanya privat, jadi tak
     * pernah masuk cache — termasuk PNG QR yang bisa bocor lewat CacheStorage.
     */
    url.pathname.startsWith('/api/payments/')
  ) {
    return;
  }

  // A. Data Publik API (Katalog Buku, Agenda, Iklan) -> Network First dengan Fallback Cache
  if (
    url.pathname === '/api/books' ||
    url.pathname === '/api/events' ||
    url.pathname === '/api/ads' ||
    url.pathname.endsWith('/thumbnail') ||
    url.pathname.endsWith('/image')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // B. Aset Statis Ber-hash Vite (/assets/*, fonts, images) -> Cache-First
  if (
    url.origin === self.location.origin && (
      url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png')
    )
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // C. HTML Navigasi Halaman SPA -> Network First dengan fallback ke index.html cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => (
        caches.match('/index.html').then((cached) => cached || caches.match('/'))
      ))
    );
    return;
  }

  // D. Default -> Fetch normal dengan fallback cache
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// 3b. Bersihkan cache saat pengguna keluar akun. Sesi login sudah disimpan di
// storage, tapi cache app shell adalah sisa terakhir di perangkat yang mungkin
// dipakai bergantian — lebih baik dibuang daripada dibiarkan.
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'CLEAR_APP_SHELL') {
    event.waitUntil(caches.delete(CACHE_NAME));
  }
});

// 4. Web Push — Pengingat Agenda
//
// Payload dikirim server dalam bentuk terenkripsi aes128gcm; peramban sudah
// mendekripsinya sebelum sampai ke sini, jadi `event.data` sudah JSON biasa.
self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Kiriman tanpa payload (mis. push "keepalive") — tetap tampilkan sesuatu
    // daripada dibuang diam-diam, supaya peramban tidak mencabut izin.
    payload = { title: 'Buku Wahidiyah', body: 'Ada pembaruan agenda majelis.' };
  }

  const title = payload.title || 'Buku Wahidiyah';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    // `tag` membuat notifikasi dengan agenda yang sama saling menggantikan,
    // bukan menumpuk di baki notifikasi.
    tag: payload.tag || 'wahidiyah-notification',
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/calendar', kind: payload.kind || 'general' },
    vibrate: [80, 40, 80]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Klik notifikasi -> fokuskan tab yang sudah terbuka, atau buka tab baru.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || '/calendar';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Fokuskan tab aplikasi yang sudah terbuka, lalu arahkan ke agenda.
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
