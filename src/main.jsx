import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import { AppProvider } from '@context/AppContext';
import { ErrorBoundary } from '@ui/ErrorBoundary';
import { Toaster } from 'sonner';
import './theme/themeInjector.js';
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
