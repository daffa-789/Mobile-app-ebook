import './env.js';

import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';

import {
  SERVE_STATIC,
  STATIC_DIR,
  STATIC_INDEX_FILE,
  CSP_REPORT_ONLY,
  FRONTEND_PORT,
  LISTEN_PORT,
  USE_VITE_MIDDLEWARE,
} from './config.js';
import { errorHandler } from './middleware/errors.js';
import { createApiApp } from './app.js';
import { NON_SPA_EXTENSIONS } from './lib/constants.js';
import { initOtpStore } from './otpStore.js';
import { canExposeDevOtp } from './lib/otp.js';
import { isMailerConfigured } from './mailer.js';
import { getWhatsAppProviderInfo, isWhatsAppConfigured } from './whatsapp.js';
import { startReminderScheduler } from './lib/eventReminder.js';
import { startMembershipSweeper } from './lib/membership.js';
import { logger, banner } from './logger.js';
import { testConnection } from './db.js';

const handleFatal = (label, error) => {
  logger.error('FATAL', `${label} — proses dihentikan`, {
    pesan: error?.message || String(error),
  });
  process.exit(1);
};

process.on('unhandledRejection', (reason) => handleFatal('Unhandled rejection', reason));
process.on('uncaughtException', (error) => handleFatal('Uncaught exception', error));

const app = createApiApp();

function mountStatic(app) {
  if (USE_VITE_MIDDLEWARE) {
    logger.info('STATIC', 'UI dilayani Vite (middleware) — penyajian dist/ dilewati.');
    return;
  }

  if (!SERVE_STATIC) {
    logger.info(
      'STATIC',
      'Penyajian app shell dimatikan (SERVE_STATIC=false) — server hanya melayani API.',
    );
    return;
  }

  if (!fs.existsSync(STATIC_INDEX_FILE)) {
    logger.info('STATIC', 'Mode API-only — UI dilayani Vite di http://localhost:3000.');
    return;
  }

  app.use(
    express.static(STATIC_DIR, {
      setHeaders(res, filePath) {
        if (filePath.endsWith(`${path.sep}index.html`)) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  app.get('*', (req, res, next) => {
    const requestPath = String(req.path || '');
    if (requestPath.startsWith('/api')) return next();
    if (NON_SPA_EXTENSIONS.has(path.extname(requestPath).toLowerCase())) return next();
    return res.sendFile(STATIC_INDEX_FILE, (error) => {
      if (error) next(error);
    });
  });
}

mountStatic(app);

let devHttpServer = null;

if (USE_VITE_MIDDLEWARE) {
  const { createServer: createViteServer } = await import('vite');

  devHttpServer = http.createServer(app);

  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server: devHttpServer } },

    appType: 'spa',
  });

  app.use(vite.middlewares);

  logger.info('VITE', 'Vite dipasang sebagai middleware — UI & API berbagi satu port.', {
    port: FRONTEND_PORT,
  });
}

app.use(errorHandler);

export { app };

if (process.env.NODE_ENV !== 'test') {
  const listenPort = LISTEN_PORT;

  const onReady = async () => {
    banner(
      USE_VITE_MIDDLEWARE ? 'Server Wahidiyah siap — satu alamat' : 'Server Backend Wahidiyah siap',
      [
        `URL            : http://localhost:${listenPort}`,
        'Database       : Supabase Cloud (Skripsi_Project)',
        `Node           : ${process.version} · ${process.platform}`,
        USE_VITE_MIDDLEWARE
          ? 'Mode           : pengembangan (UI Vite + API, satu port)'
          : 'Mode           : mandiri (penyimpanan cloud)',
      ],
    );
    logger.info('BOOT', 'Menginisialisasi koneksi database…');
    await testConnection();

    try {
      const storeMode = await initOtpStore();
      logger.info('BOOT', 'Penyimpanan kode OTP siap', {
        backend:
          storeMode === 'table'
            ? 'tabel email_verifications'
            : 'berkas sementara (.otp-dev-store.json)',
      });
    } catch (storeError) {
      logger.error('BOOT', 'Penyimpanan kode OTP gagal disiapkan — alur OTP tidak akan berfungsi', {
        pesan: storeError.message,
      });
    }

    const mailerOn = isMailerConfigured();
    const devOtpOn = canExposeDevOtp(process.env);

    /* VULN-09 — CORS_ORIGINS wajib eksplisit di produksi. Tanpa itu daftar
     * bawaan (localhost) yang dipakai, dan pengguna sungguhan diblokir
     * peramban tanpa pesan galat yang jelas di sisi server.
     */
    if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
      logger.warn(
        'BOOT',
        'CORS_ORIGINS belum diset di produksi — memakai daftar bawaan localhost',
        {
          akibat: 'peramban pengguna sungguhan akan memblokir permintaan lintas origin',
          perbaikan: 'set CORS_ORIGINS di .env, misalnya https://buku-wahidiyah.example.com',
        },
      );
    }

    if (CSP_REPORT_ONLY) {
      logger.info(
        'BOOT',
        'CSP berjalan mode report-only — pelanggaran hanya tercatat di konsol peramban',
        {
          menegakkan: 'set CSP_ENFORCE=1 setelah konsol peramban bersih',
        },
      );
    }

    if (mailerOn) {
      logger.ok('BOOT', 'Pengiriman email AKTIF — kode OTP dikirim lewat Gmail API');
    } else if (devOtpOn) {
      logger.warn(
        'BOOT',
        'Email BELUM dikonfigurasi — kode OTP ditampilkan di layar verifikasi untuk permintaan dari localhost (devOtp)',
        {
          cara_mengaktifkan:
            'jalankan `node scripts/get-gmail-token.js`, isi GMAIL_REFRESH_TOKEN + GMAIL_SENDER di .env, lalu restart',
        },
      );
    } else {
      logger.error(
        'BOOT',
        'JALAN BUNTU OTP: email belum dikonfigurasi DAN kode tidak boleh ditampilkan',
        {
          sebab:
            'GMAIL_REFRESH_TOKEN/GMAIL_SENDER kosong, sementara EXPOSE_DEV_OTP tidak diset "1" (atau NODE_ENV=production)',
          akibat:
            'tidak ada email terkirim dan tidak ada kode di layar — pendaftaran tidak mungkin diselesaikan',
          perbaikan_1:
            'set EXPOSE_DEV_OTP=1 di .env pada lingkungan non-produksi agar kode tampil di layar verifikasi dari localhost',
          perbaikan_2: 'atau isi kredensial Gmail di .env supaya email benar-benar terkirim',
        },
      );
    }

    const waConfigured = isWhatsAppConfigured();
    const waInfo = getWhatsAppProviderInfo();
    if (waConfigured) {
      logger.ok('BOOT', `WhatsApp Gateway AKTIF — provider: ${waInfo.activeProvider}`);
    } else {
      logger.info(
        'BOOT',
        `WhatsApp Gateway mode demo (cetak OTP di terminal) — provider: ${waInfo.activeProvider}`,
      );
    }

    startReminderScheduler();
    startMembershipSweeper();
  };

  if (devHttpServer) {
    devHttpServer.listen(listenPort, onReady);
  } else {
    app.listen(listenPort, onReady);
  }
}
