import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import { AppProvider } from '@context/AppContext';
import { ErrorBoundary } from '@ui/ErrorBoundary';
import { Toaster } from 'sonner';
import './theme/themeInjector.js';

/* Font di-host sendiri via @fontsource (dibundel Vite, satu origin, ter-cache).
   Rantai Google Fonts (fonts.googleapis.com -> fonts.gstatic.com) sebelumnya
   render-blocking dan menambah 2 origin + 2 koneksi TLS pada load pertama. */
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/fraunces/800.css';
import '@fontsource/fraunces/900.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';

import './index.css';

/* Sonner merender lewat portal di luar shell aplikasi, jadi warna toastnya tidak
   ikut gaya halaman. Default sonner "system" akan mengikuti pengaturan operasi,
   jadi tema terang dipasang eksplisit. */
const AppToaster = () => (
  <Toaster
    position="top-center"
    expand
    visibleToasts={1}
    closeButton
    duration={8000}
    theme="light"
  />
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <App />
          <AppToaster />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

/* Service worker didaftarkan juga di mode pengembangan: Web Push butuh
   service worker aktif untuk bisa berlangganan, dan tanpa ini tombol
   "Aktifkan notifikasi" tidak akan pernah bisa diuji di localhost.
   Cache app-shell tetap hanya bermanfaat di produksi (aset ber-hash). */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  });
}
