/* Bersihkan Service Worker dan CacheStorage dari kunjungan sebelumnya pada
 * origin dashboard admin. Sengaja berupa berkas eksternal (bukan skrip
 * inline di index.html): CSP yang kini ditegakkan memakai `script-src 'self'`
 * tanpa 'unsafe-inline', sehingga skrip inline akan diblokir peramban.
 * Berkas ini disalin Vite dari `public/` ke `dist/admin/sw-cleanup.js`.
 */
(function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        registrations.forEach(function (registration) {
          registration.unregister();
        });
      })
      .catch(function () {
        /* Origin tanpa izin Service Worker: tidak ada yang perlu dibersihkan. */
      });
  }
  if ('caches' in window) {
    caches
      .keys()
      .then(function (names) {
        names.forEach(function (name) {
          caches.delete(name);
        });
      })
      .catch(function () {
        /* CacheStorage bisa tidak tersedia pada mode privat. */
      });
  }
})();
