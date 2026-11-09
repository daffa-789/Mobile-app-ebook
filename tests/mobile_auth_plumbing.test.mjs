import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import vm from 'node:vm';

// Register ESM loader for react-native mocks
register('./helpers/rn_loader.mjs', import.meta.url);

const ROOT_DIR = process.cwd();

test('Mobile Auth Plumbing & Invariants Suite', async (t) => {
  const clientPath = path.join(ROOT_DIR, 'mobile-app', 'src', 'api', 'client.js');
  const authContextPath = path.join(ROOT_DIR, 'mobile-app', 'src', 'context', 'AuthContext.js');
  const verificationScreenPath = path.join(
    ROOT_DIR,
    'mobile-app',
    'src',
    'screens',
    'VerificationScreen.js',
  );
  const appJsonPath = path.join(ROOT_DIR, 'app.json');
  const serverRoutesPath = path.join(ROOT_DIR, 'server', 'routes', 'auth_routes.js');

  await t.test('1. mobile-app/src/api/client.js exports SESSION_FREE_ENDPOINTS', async () => {
    const { SESSION_FREE_ENDPOINTS, isSessionFreeEndpoint } = await import(
      `../mobile-app/src/api/client.js?t=${Date.now()}`
    );

    assert.ok(Array.isArray(SESSION_FREE_ENDPOINTS), 'SESSION_FREE_ENDPOINTS must be an array');
    assert.ok(SESSION_FREE_ENDPOINTS.includes('/api/auth/login'), 'Must include /api/auth/login');
    assert.ok(
      SESSION_FREE_ENDPOINTS.includes('/api/auth/verify-registration'),
      'Must include verify-registration',
    );
    assert.ok(
      SESSION_FREE_ENDPOINTS.includes('/api/auth/google/mobile-start'),
      'Must include google/mobile-start',
    );
    assert.ok(SESSION_FREE_ENDPOINTS.includes('/api/auth/exchange'), 'Must include exchange');

    assert.strictEqual(isSessionFreeEndpoint('/api/auth/login'), true);
    assert.strictEqual(isSessionFreeEndpoint('/api/auth/verify-registration'), true);
    assert.strictEqual(isSessionFreeEndpoint('/api/auth/me'), false);
    assert.strictEqual(isSessionFreeEndpoint('/api/subscriptions/my'), false);
  });

  await t.test('2. mobile-app/src/api/client.js getAuthHeaders', async () => {
    const { getAuthHeaders } = await import(`../mobile-app/src/api/client.js?t=${Date.now()}`);

    const headersWithToken = await getAuthHeaders('test-jwt-token');
    assert.strictEqual(headersWithToken.Authorization, 'Bearer test-jwt-token');
    assert.strictEqual(headersWithToken['Content-Type'], 'application/json');

    const headersWithout = await getAuthHeaders(null);
    assert.strictEqual(headersWithout.Authorization, undefined);
  });

  await t.test('3. app.json defines scheme "mobileappebook"', () => {
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    assert.strictEqual(
      appConfig.expo?.scheme,
      'mobileappebook',
      'app.json expo.scheme must be mobileappebook',
    );
  });

  await t.test('4. server/routes/auth_routes.js defines /google/mobile-start', () => {
    const routesContent = fs.readFileSync(serverRoutesPath, 'utf8');
    assert.ok(
      routesContent.includes('/google/mobile-start'),
      'server auth_routes must register /google/mobile-start',
    );
  });

  await t.test('5. VerificationScreen.js exists and exports VerificationScreen', () => {
    assert.ok(fs.existsSync(verificationScreenPath), 'VerificationScreen.js must exist on disk');
    const content = fs.readFileSync(verificationScreenPath, 'utf8');
    assert.ok(
      content.includes('export const VerificationScreen'),
      'Must export VerificationScreen',
    );
  });

  await t.test('Google membuka sesi browser dengan callback skema aplikasi', async () => {
    const source = fs.readFileSync(authContextPath, 'utf8');
    const start = source.indexOf('const startGoogleMobile =');
    const end = source.indexOf('const exchangeGoogleCode =', start);
    assert.ok(start >= 0 && end > start);
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const redirectUrl = `${appConfig.expo.scheme}://auth/`;
    const googleUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const scenarios = [
      [{ type: 'success', url: `${redirectUrl}success?code=test-code` }, true, undefined],
      [{ type: 'cancel' }, false, 'Login Google dibatalkan.'],
      [
        { type: 'success', url: `${redirectUrl}failure?message=Akses%20ditolak` },
        false,
        'Akses ditolak',
      ],
    ];

    for (const [browserResult, success, error] of scenarios) {
      const calls = [];
      const context = {
        Linking: {},
        apiRequest: async (url, options) => {
          assert.equal(url, '/api/auth/google/mobile-start');
          assert.equal(options.method, 'POST');
          return { url: googleUrl };
        },
        WebBrowser: {
          openAuthSessionAsync: async (...args) => {
            calls.push(args);
            return browserResult;
          },
        },
      };
      const result = await vm.runInNewContext(
        `${source.slice(start, end)} startGoogleMobile()`,
        context,
      );
      assert.deepEqual(calls, [[googleUrl, redirectUrl]]);
      assert.equal(result.success, success);
      assert.equal(result.error, error);
    }
  });

  await t.test('Versi yang ditampilkan sama dengan versi APK', async () => {
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const { APP_VERSION } = await import('../mobile-app/src/config/constants.js');
    assert.equal(APP_VERSION, appConfig.expo.version);
  });

  await t.test('6. AuthContext.js implements OTP and Google session methods', () => {
    const authContent = fs.readFileSync(authContextPath, 'utf8');
    assert.ok(
      authContent.includes('verifyRegistration'),
      'AuthContext must implement verifyRegistration',
    );
    assert.ok(
      authContent.includes('resendVerification'),
      'AuthContext must implement resendVerification',
    );
    assert.ok(
      authContent.includes('requestPasswordReset'),
      'AuthContext must implement requestPasswordReset',
    );
    assert.ok(authContent.includes('resetPassword'), 'AuthContext must implement resetPassword');
    assert.ok(
      authContent.includes('startGoogleMobile'),
      'AuthContext must implement startGoogleMobile',
    );
    assert.ok(
      authContent.includes('exchangeGoogleCode'),
      'AuthContext must implement exchangeGoogleCode',
    );
    assert.ok(authContent.includes('refreshSession'), 'AuthContext must implement refreshSession');
    assert.ok(
      authContent.includes('setUnauthorizedHandler'),
      'AuthContext must register setUnauthorizedHandler',
    );
  });
});
