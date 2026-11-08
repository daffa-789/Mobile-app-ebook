/**
 * @file tests/m2_challenger_env_injection.test.mjs
 * @description Adversarial empirical stress test for configuration resilience and environment variable handling across:
 *  - src/config/constants.js (PWA reader)
 *  - landing-page/src/config/constants.js
 *  - admin-dashboard-web/src/config/constants.js
 *  - mobile-app/src/config/constants.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_APK =
  'https://expo.dev/artifacts/eas/Ed9NJ755J7BnDSR2zNqX6FjLFXevov8oC7G-JCxiSU0.apk';

// Helper to run code in an isolated subprocess with specific env variables
async function runInSubprocess(moduleRelativePath, envOverrides = {}) {
  const scriptCode = `
    import { register } from 'node:module';
    register('./tests/helpers/rn_loader.mjs', import.meta.url);
    const mod = await import('${moduleRelativePath}');
    console.log(JSON.stringify(mod));
  `;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', scriptCode], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        ...envOverrides,
      },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Subprocess exited with code ${code}: ${stderr}`));
      } else {
        try {
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          resolve(JSON.parse(lastLine));
        } catch (e) {
          reject(new Error(`Failed to parse JSON output: ${stdout}\nError: ${e.message}`));
        }
      }
    });
  });
}

test('Landing Page Configuration Resilience & Env Injection', async (t) => {
  await t.test('1. Default environment without custom env vars', async () => {
    const config = await runInSubprocess('./landing-page/src/config/constants.js', {
      VITE_APK_DOWNLOAD_URL: '',
      VITE_API_URL: '',
      VITE_API_FALLBACK_ORIGIN: '',
      VITE_API_TIMEOUT_MS: '',
    });

    assert.strictEqual(config.APK_DOWNLOAD_URL, DEFAULT_APK, 'Fallback to official EAS APK');
    assert.strictEqual(config.API_CONFIG.baseUrl, '', 'Default baseUrl is empty string');
    assert.strictEqual(config.API_CONFIG.fallbackOrigin, 'http://localhost:5000');
    assert.strictEqual(config.API_CONFIG.timeoutMs, 20000, 'Default timeout is 20000ms');
    assert.ok(config.STORAGE_KEYS.session, 'Storage key session exists');
  });

  await t.test('2. Custom valid environment variables injected', async () => {
    const customApk = 'https://custom-cdn.example.org/releases/wahidiyah-v2.apk';
    const customApi = 'https://api.wahidiyah.org';
    const customOrigin = 'https://portal.wahidiyah.org';
    const customTimeout = '35000';
    const customGoogleClientId = 'custom-client-id-12345.apps.googleusercontent.com';

    const config = await runInSubprocess('./landing-page/src/config/constants.js', {
      VITE_APK_DOWNLOAD_URL: customApk,
      VITE_API_URL: customApi,
      VITE_API_FALLBACK_ORIGIN: customOrigin,
      VITE_API_TIMEOUT_MS: customTimeout,
      VITE_GOOGLE_CLIENT_ID: customGoogleClientId,
    });

    assert.strictEqual(config.APK_DOWNLOAD_URL, customApk);
    assert.strictEqual(config.API_CONFIG.baseUrl, customApi);
    assert.strictEqual(config.API_CONFIG.fallbackOrigin, customOrigin);
    assert.strictEqual(config.API_CONFIG.timeoutMs, 35000);
    assert.strictEqual(config.OAUTH_CONFIG.googleClientId, customGoogleClientId);
  });

  await t.test('3. Edge cases: empty string and NaN timeout', async () => {
    const config = await runInSubprocess('./landing-page/src/config/constants.js', {
      VITE_APK_DOWNLOAD_URL: '',
      VITE_API_TIMEOUT_MS: 'not_a_number_abc',
    });

    assert.strictEqual(
      config.APK_DOWNLOAD_URL,
      DEFAULT_APK,
      'Empty string falls back to default APK',
    );
    assert.strictEqual(config.API_CONFIG.timeoutMs, 20000, 'NaN timeout falls back to 20000ms');
  });
});

test('Admin Dashboard Configuration Resilience & Env Injection', async (t) => {
  await t.test('1. Default environment without custom env vars', async () => {
    const config = await runInSubprocess('./admin-dashboard-web/src/config/constants.js', {
      VITE_API_URL: '',
      VITE_API_FALLBACK_ORIGIN: '',
      VITE_API_TIMEOUT_MS: '',
    });

    assert.strictEqual(config.API_CONFIG.baseUrl, '');
    assert.strictEqual(config.API_CONFIG.fallbackOrigin, 'http://localhost:5000');
    assert.strictEqual(config.API_CONFIG.timeoutMs, 20000);
    assert.deepStrictEqual(config.EVENT_CATEGORIES, [
      'Mujahadah',
      'Pengajian',
      'Kubro',
      'Peringatan',
    ]);
    assert.strictEqual(config.STORAGE_KEYS.session, 'buku-wahidiyah:auth-session');
    assert.ok(config.MAPS_CONFIG.searchBaseUrl.includes('google.com/maps/search'));
  });

  await t.test('2. Custom valid environment variables injected', async () => {
    const customApi = 'https://admin-api.wahidiyah.org';
    const customOrigin = 'https://admin-api.wahidiyah.org:8443';
    const customTimeout = '60000';

    const config = await runInSubprocess('./admin-dashboard-web/src/config/constants.js', {
      VITE_API_URL: customApi,
      VITE_API_FALLBACK_ORIGIN: customOrigin,
      VITE_API_TIMEOUT_MS: customTimeout,
    });

    assert.strictEqual(config.API_CONFIG.baseUrl, customApi);
    assert.strictEqual(config.API_CONFIG.fallbackOrigin, customOrigin);
    assert.strictEqual(config.API_CONFIG.timeoutMs, 60000);
  });

  await t.test('3. Edge case: zero timeoutMs falls back safely to 20000ms', async () => {
    const config = await runInSubprocess('./admin-dashboard-web/src/config/constants.js', {
      VITE_API_TIMEOUT_MS: '0',
    });

    assert.strictEqual(config.API_CONFIG.timeoutMs, 20000, '0 falls back to 20000ms');
  });
});

test('Root PWA Configuration Resilience & Env Injection', async (t) => {
  await t.test('1. Default environment without custom env vars', async () => {
    const config = await runInSubprocess('./src/config/constants.js', {
      VITE_API_URL: '',
      VITE_API_FALLBACK_ORIGIN: '',
      VITE_API_TIMEOUT_MS: '',
      VITE_GOOGLE_CLIENT_ID: '',
    });

    assert.strictEqual(config.API_CONFIG.baseUrl, '', 'Default baseUrl is empty string');
    assert.strictEqual(config.API_CONFIG.fallbackOrigin, 'http://localhost:5000');
    assert.strictEqual(config.API_CONFIG.timeoutMs, 20000);
    assert.strictEqual(config.STORAGE_KEYS.session, 'buku-wahidiyah:auth-session');
    assert.strictEqual(config.STORAGE_KEYS.intendedLocation, 'buku-wahidiyah:intended-location');
    assert.ok(config.MAPS_CONFIG.searchBaseUrl.includes('google.com/maps/search'));
    assert.ok(config.MAPS_CONFIG.dirBaseUrl.includes('google.com/maps/dir'));
    assert.strictEqual(config.OAUTH_CONFIG.callbackPath, '/api/auth/google/callback');
    assert.deepStrictEqual(config.DEV_HOSTNAMES, ['localhost', '127.0.0.1', '::1', '[::1]']);
  });

  await t.test('2. Custom valid environment variables injected', async () => {
    const customApi = 'https://api.wahidiyah.org';
    const customOrigin = 'https://backend.wahidiyah.org';
    const customTimeout = '45000';
    const customClientId = 'pwa-client-4433.apps.googleusercontent.com';

    const config = await runInSubprocess('./src/config/constants.js', {
      VITE_API_URL: customApi,
      VITE_API_FALLBACK_ORIGIN: customOrigin,
      VITE_API_TIMEOUT_MS: customTimeout,
      VITE_GOOGLE_CLIENT_ID: customClientId,
    });

    assert.strictEqual(config.API_CONFIG.baseUrl, customApi);
    assert.strictEqual(config.API_CONFIG.fallbackOrigin, customOrigin);
    assert.strictEqual(config.API_CONFIG.timeoutMs, 45000);
    assert.strictEqual(config.OAUTH_CONFIG.googleClientId, customClientId);
  });

  await t.test('3. Edge case: non-numeric timeout falls back safely', async () => {
    const config = await runInSubprocess('./src/config/constants.js', {
      VITE_API_TIMEOUT_MS: 'not_a_number',
    });

    assert.strictEqual(config.API_CONFIG.timeoutMs, 20000);
  });

  await t.test('4. Sumber PWA tidak menduplikasi literal konfigurasi', () => {
    const apiSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/api.js'), 'utf8');
    assert.ok(
      apiSrc.includes("from '@/config/constants'"),
      'src/lib/api.js must read config from @/config/constants',
    );
    assert.ok(!apiSrc.includes("'http://localhost:5000'"), 'API origin must not be hardcoded');
    assert.ok(!apiSrc.includes("'buku-wahidiyah:"), 'Storage keys must not be hardcoded');

    const mapsSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/maps.js'), 'utf8');
    assert.ok(mapsSrc.includes('MAPS_CONFIG.searchBaseUrl'));
    assert.ok(mapsSrc.includes('MAPS_CONFIG.dirBaseUrl'));
    assert.ok(
      !mapsSrc.includes('https://www.google.com/maps/search'),
      'Maps base URL must not be hardcoded',
    );
  });
});

test('Mobile App Configuration Resilience & Env Injection', async (t) => {
  await t.test(
    '1. Default environment without custom env vars (Android Platform mock)',
    async () => {
      const config = await runInSubprocess('./mobile-app/src/config/constants.js', {
        EXPO_PUBLIC_API_URL: '',
        EXPO_PUBLIC_API_TIMEOUT_MS: '',
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: '',
        EXPO_PUBLIC_GOOGLE_REDIRECT_URI: '',
        EXPO_PUBLIC_GOOGLE_LOCAL_REDIRECT_URI: '',
        EXPO_PUBLIC_SUPPORT_EMAIL: '',
      });

      assert.strictEqual(config.API_CONFIG.baseUrl, 'http://10.0.2.2:5000/api');
      assert.strictEqual(config.API_CONFIG.timeoutMs, 20000);
      assert.ok(config.OAUTH_CONFIG.googleClientId.includes('apps.googleusercontent.com'));
      assert.ok(config.OAUTH_CONFIG.redirectUri.includes('/api/auth/google/callback'));
      assert.strictEqual(config.OAUTH_CONFIG.callbackPath, '/api/auth/google/callback');
      assert.strictEqual(
        config.OAUTH_CONFIG.localWebRedirectUri,
        `http://localhost:3000${config.OAUTH_CONFIG.callbackPath}`,
      );
      assert.strictEqual(config.APP_CONFIG.supportEmail, 'info@wahidiyah.org');
    },
  );

  await t.test('2. Custom valid environment variables injected', async () => {
    const customApiUrl = 'https://prod-api.wahidiyah.org/api';
    const customTimeout = '15000';
    const customClientId = 'mobile-prod-9988.apps.googleusercontent.com';
    const customRedirect = 'wahidiyah-app://oauth-callback';
    const customLocalRedirect = 'http://127.0.0.1:8081/api/auth/google/callback';
    const customEmail = 'helpdesk@wahidiyah.org';

    const config = await runInSubprocess('./mobile-app/src/config/constants.js', {
      EXPO_PUBLIC_API_URL: customApiUrl,
      EXPO_PUBLIC_API_TIMEOUT_MS: customTimeout,
      EXPO_PUBLIC_GOOGLE_CLIENT_ID: customClientId,
      EXPO_PUBLIC_GOOGLE_REDIRECT_URI: customRedirect,
      EXPO_PUBLIC_GOOGLE_LOCAL_REDIRECT_URI: customLocalRedirect,
      EXPO_PUBLIC_SUPPORT_EMAIL: customEmail,
    });

    assert.strictEqual(config.API_CONFIG.baseUrl, customApiUrl);
    assert.strictEqual(config.API_CONFIG.timeoutMs, 15000);
    assert.strictEqual(config.OAUTH_CONFIG.googleClientId, customClientId);
    assert.strictEqual(config.OAUTH_CONFIG.redirectUri, customRedirect);
    assert.strictEqual(config.OAUTH_CONFIG.localWebRedirectUri, customLocalRedirect);
    assert.strictEqual(config.APP_CONFIG.supportEmail, customEmail);
  });

  await t.test('3. Edge cases: invalid timeout string falls back safely', async () => {
    const config = await runInSubprocess('./mobile-app/src/config/constants.js', {
      EXPO_PUBLIC_API_TIMEOUT_MS: 'invalid_xyz',
    });

    assert.strictEqual(
      config.API_CONFIG.timeoutMs,
      20000,
      'Non-numeric string safely yields 20000',
    );
  });
});
