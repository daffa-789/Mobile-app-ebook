import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env
dotenv.config({ path: path.join(rootDir, '.env') });

const EXPECTED_PROJECT_REF = 'pfiowztxlbcclazpdsxe';
const EXPECTED_PROJECT_URL = `https://${EXPECTED_PROJECT_REF}.supabase.co`;

test('Milestone 3 — Admin Dashboard Web Configuration & Deployment Suite', async (t) => {
  await t.test(
    '1. Supabase Config in admin-dashboard-web is env-driven and points to pfiowztxlbcclazpdsxe',
    async () => {
      // Publishable key tidak lagi ditanam sebagai fallback literal: kunci kini
      // dibaca dari .env lewat shared/supabaseConfig.js agar rotasi efektif dan
      // tidak ada kredensial yang ikut ter-bundle ke aset statis.
      const configPath = path.join(rootDir, 'admin-dashboard-web/src/lib/supabaseConfig.js');
      assert.ok(
        fs.existsSync(configPath),
        'admin-dashboard-web/src/lib/supabaseConfig.js must exist',
      );

      const configContent = fs.readFileSync(configPath, 'utf8');
      assert.ok(
        /shared\/supabaseConfig\.js/.test(configContent),
        'supabaseConfig.js harus re-export modul konfigurasi bersama',
      );
      assert.ok(
        !/sb_(publishable|secret)_[A-Za-z0-9_-]{10,}/.test(configContent),
        'supabaseConfig.js must not embed a hardcoded publishable/secret key',
      );
      assert.ok(
        !configContent.includes('pdimjmbjutlzjdfjaqgt'),
        'supabaseConfig.js must not contain stale project ref pdimjmbjutlzjdfjaqgt',
      );

      // Dynamic import to test exported values
      const configModule = await import('../admin-dashboard-web/src/lib/supabaseConfig.js');
      assert.equal(configModule.SUPABASE_URL, EXPECTED_PROJECT_URL);
      assert.equal(configModule.SUPABASE_ANON_KEY, process.env.VITE_SUPABASE_ANON_KEY);
      assert.ok(configModule.SUPABASE_ANON_KEY.startsWith('sb_publishable_'));
      assert.equal(configModule.isSupabaseConfigured, true);
    },
  );

  await t.test('2. Seeded Admin user authentication capability', async (t) => {
    const { authenticateWithPassword } = await import('../server/services/auth/session_service.js');
    const password = process.env.ADMIN_TEST_PASSWORD;
    if (!password) {
      t.skip('ADMIN_TEST_PASSWORD tidak diset di .env');
      return;
    }

    // Test valid seeded admin login
    const adminAuth = await authenticateWithPassword({
      email: 'admin@wahidiyah.com',
      password,
    });

    assert.equal(adminAuth.ok, true, 'Seeded admin authentication must succeed');
    assert.ok(adminAuth.token, 'Seeded admin authentication must return a JWT token');
    assert.equal(adminAuth.user.role, 'admin', 'Authenticated user role must be admin');
    assert.equal(adminAuth.user.email, 'admin@wahidiyah.com');

    // Test rejection with invalid password
    const failedAuth = await authenticateWithPassword({
      email: 'admin@wahidiyah.com',
      password: 'WrongPassword2026!',
    });
    assert.equal(failedAuth.ok, false, 'Invalid password must be rejected');
    assert.equal(failedAuth.status, 401);
  });

  await t.test('3. Vite Admin config (vite.config.admin.js) structure', () => {
    const viteConfigPath = path.join(rootDir, 'vite.config.admin.js');
    assert.ok(fs.existsSync(viteConfigPath), 'vite.config.admin.js must exist at root');

    const content = fs.readFileSync(viteConfigPath, 'utf8');
    assert.ok(
      content.includes('./admin-dashboard-web'),
      'vite.config.admin.js must specify admin-dashboard-web as root',
    );
    assert.ok(
      content.includes('./dist/admin'),
      'vite.config.admin.js must specify dist/admin as outDir',
    );
    assert.ok(
      content.includes('manualChunks'),
      'vite.config.admin.js must configure rollup manualChunks',
    );
  });

  await t.test('4. Production build artifacts in dist/admin', () => {
    const distAdmin = path.join(rootDir, 'dist/admin');
    assert.ok(fs.existsSync(distAdmin), 'dist/admin directory must exist');

    const indexPath = path.join(distAdmin, 'index.html');
    assert.ok(fs.existsSync(indexPath), 'dist/admin/index.html must exist');

    const html = fs.readFileSync(indexPath, 'utf8');
    assert.ok(
      html.includes('Mobile-app-ebook — Admin Dashboard'),
      'index.html title must be Mobile-app-ebook — Admin Dashboard',
    );
    assert.ok(
      html.includes('/assets/index-') || html.includes('assets/'),
      'index.html must load compiled assets',
    );

    const assetsDir = path.join(distAdmin, 'assets');
    assert.ok(fs.existsSync(assetsDir), 'dist/admin/assets must exist');

    const assetFiles = fs.readdirSync(assetsDir);
    assert.ok(
      assetFiles.some((f) => f.startsWith('vendor-') && f.endsWith('.js')),
      'Vendor bundle chunk must exist',
    );
    assert.ok(
      assetFiles.some((f) => f.startsWith('charts-') && f.endsWith('.js')),
      'Charts bundle chunk must exist',
    );
    assert.ok(
      assetFiles.some((f) => f.startsWith('excel-') && f.endsWith('.js')),
      'Excel bundle chunk must exist',
    );
    assert.ok(
      assetFiles.some((f) => f.startsWith('supabase-sdk-') && f.endsWith('.js')),
      'Supabase SDK bundle chunk must exist',
    );
  });

  await t.test('5. Vercel deployment configuration vercel.admin.json', () => {
    const vercelConfigPath = path.join(rootDir, 'vercel.admin.json');
    assert.ok(fs.existsSync(vercelConfigPath), 'vercel.admin.json must exist at root');

    const raw = fs.readFileSync(vercelConfigPath, 'utf8');
    let config;
    assert.doesNotThrow(() => {
      config = JSON.parse(raw);
    }, 'vercel.admin.json must be valid JSON');

    assert.equal(config.name, 'mobile-app-ebook-admin');
    assert.equal(config.buildCommand, 'npm run build:admin');
    assert.equal(config.outputDirectory, 'dist/admin');
    assert.equal(config.framework, 'vite');
    assert.ok(Array.isArray(config.regions) && config.regions.includes('sin1'));
    assert.ok(Array.isArray(config.rewrites));

    const apiRewrite = config.rewrites.find((r) => r.source === '/api/(.*)');
    assert.ok(apiRewrite, 'Rewrites must include /api/(.*)');
    assert.equal(apiRewrite.destination, '/api/index.js');

    const spaRewrite = config.rewrites.find((r) => r.source === '/(.*)');
    assert.ok(spaRewrite, 'Rewrites must include SPA fallback /(.*)');
    assert.equal(spaRewrite.destination, '/index.html');
  });

  await t.test('6. Admin authentication guard and login UI', () => {
    const adminLoginPath = path.join(
      rootDir,
      'admin-dashboard-web/src/features/admin/AdminLogin.jsx',
    );
    assert.ok(fs.existsSync(adminLoginPath), 'AdminLogin.jsx component must exist');

    const loginContent = fs.readFileSync(adminLoginPath, 'utf8');
    assert.ok(
      loginContent.includes('/api/auth/login'),
      'AdminLogin must submit credentials to /api/auth/login',
    );
    assert.ok(
      loginContent.includes('admin@wahidiyah.com'),
      'AdminLogin must support admin credentials',
    );

    const appPath = path.join(rootDir, 'admin-dashboard-web/src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.ok(
      appContent.includes('AdminLogin'),
      'App.jsx must import and use AdminLogin component',
    );
    assert.ok(
      appContent.includes('AdminRoot'),
      'App.jsx must wrap dashboard with AdminRoot auth guard',
    );
    assert.ok(
      appContent.includes('Toaster'),
      'App.jsx must include Toaster for feedback notifications',
    );
    assert.ok(
      appContent.includes("import { apiJsonSend } from '@lib/api'") ||
        appContent.includes('apiJsonSend'),
      'App.jsx must import apiJsonSend for user update mutations',
    );
  });
});
