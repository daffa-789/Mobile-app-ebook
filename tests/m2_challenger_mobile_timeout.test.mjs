/**
 * @file tests/m2_challenger_mobile_timeout.test.mjs
 * @description Adversarial empirical stress test for mobile-app/src/api/client.js:
 *  - AbortController timeout on delayed server response
 *  - EXPO_PUBLIC_API_TIMEOUT_MS env variable propagation
 *  - Fast request success and timer cleanup
 *  - Non-JSON / 500 error envelope resilience
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { register } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Register our ESM loader to intercept react-native & storage imports
register('./helpers/rn_loader.mjs', import.meta.url);

// Helper to create an adversarial mock HTTP server
function createAdversarialServer() {
  let server;
  let port;

  const app = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    if (url.pathname === '/api/fast') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          message: 'Fast OK',
          data: { id: 101, title: 'Kitab Terjemah' },
        }),
      );
      return;
    }

    if (url.pathname === '/api/slow') {
      // Intentionally hold connection open for 1500ms
      const timer = setTimeout(() => {
        if (!res.writableEnded) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Slow OK' }));
        }
      }, 1500);
      req.on('close', () => clearTimeout(timer));
      return;
    }

    if (url.pathname === '/api/hang') {
      // Hang indefinitely until client aborts
      return;
    }

    if (url.pathname === '/api/error-400') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Parameter tidak valid' }));
      return;
    }

    if (url.pathname === '/api/error-500-html') {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<html><body>Internal Server Error Crash</body></html>');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Endpoint not found' }));
  });

  return new Promise((resolve) => {
    app.listen(0, '127.0.0.1', () => {
      port = app.address().port;
      resolve({
        port,
        baseUrl: `http://127.0.0.1:${port}/api`,
        close: () => new Promise((r) => app.close(r)),
      });
    });
  });
}

// Start adversarial server before loading client.js so EXPO_PUBLIC_API_URL can be set
const srv = await createAdversarialServer();
process.env.EXPO_PUBLIC_API_URL = srv.baseUrl;
const client = await import('../mobile-app/src/api/client.js');

test('Mobile API Client Timeout & Resilience Suite', async (t) => {
  t.after(async () => {
    await srv.close();
  });

  await t.test('1. Normal fast request succeeds and parses envelope cleanly', async () => {
    const startTime = Date.now();
    const result = await client.apiRequest('/fast', {
      timeoutMs: 1000,
    });
    const duration = Date.now() - startTime;

    assert.ok(result, 'Must return response payload');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.id, 101);
    assert.ok(duration < 500, `Fast request took ${duration}ms, expected < 500ms`);
  });

  await t.test(
    '2. Server delay beyond timeoutMs cleanly triggers AbortController and throws timeout error',
    async () => {
      const timeoutMs = 80;
      const startTime = Date.now();
      let caughtErr = null;

      try {
        await client.apiRequest('/slow', {
          timeoutMs,
        });
      } catch (err) {
        caughtErr = err;
      }
      const duration = Date.now() - startTime;

      assert.ok(caughtErr, 'Must throw error when request exceeds timeoutMs');
      assert.strictEqual(caughtErr.timeout, true, 'Error must set .timeout = true');
      assert.strictEqual(caughtErr.network, true, 'Error must set .network = true');
      assert.ok(
        caughtErr.message.includes(`Request timeout setelah ${timeoutMs}ms`),
        `Error message must indicate timeout duration, got: "${caughtErr.message}"`,
      );
      // Should abort close to timeoutMs
      assert.ok(
        duration >= 70 && duration <= 500,
        `Duration was ${duration}ms, expected between 70ms and 500ms`,
      );
    },
  );

  await t.test(
    '3. Hanging server connection terminates quickly via timeout instead of blocking',
    async () => {
      const timeoutMs = 100;
      const startTime = Date.now();
      let caughtErr = null;

      try {
        await client.apiRequest('/hang', {
          timeoutMs,
        });
      } catch (err) {
        caughtErr = err;
      }
      const duration = Date.now() - startTime;

      assert.ok(caughtErr, 'Hanging request must be terminated');
      assert.strictEqual(caughtErr.timeout, true);
      assert.strictEqual(caughtErr.network, true);
      assert.ok(
        duration >= 90 && duration <= 600,
        `Hanging request terminated in ${duration}ms, expected ~100ms`,
      );
    },
  );

  await t.test(
    '4. Non-JSON 500 error response handled safely without JSON parse crash',
    async () => {
      let caughtErr = null;
      try {
        await client.apiRequest('/error-500-html', {
          timeoutMs: 1000,
        });
      } catch (err) {
        caughtErr = err;
      }

      assert.ok(caughtErr, 'Must throw error on 500 HTTP status');
      assert.strictEqual(caughtErr.status, 500);
      assert.strictEqual(caughtErr.message, 'Request gagal (500)');
      assert.deepStrictEqual(caughtErr.data, {}, 'Non-JSON body safely caught to empty object');
    },
  );

  await t.test('5. Standard 400 error message parsed from JSON payload', async () => {
    let caughtErr = null;
    try {
      await client.apiRequest('/error-400', {
        timeoutMs: 1000,
      });
    } catch (err) {
      caughtErr = err;
    }

    assert.ok(caughtErr, 'Must throw error on 400 HTTP status');
    assert.strictEqual(caughtErr.status, 400);
    assert.strictEqual(caughtErr.message, 'Parameter tidak valid');
  });
});

test('Mobile API Client Environment Variable Threshold Test in Subprocess', async (t) => {
  const subSrv = await createAdversarialServer();

  t.after(async () => {
    await subSrv.close();
  });

  await t.test(
    'EXPO_PUBLIC_API_TIMEOUT_MS env variable properly sets default timeout threshold',
    async () => {
      // Run an isolated node process with EXPO_PUBLIC_API_TIMEOUT_MS=120
      const scriptCode = `
      import { register } from 'node:module';
      register('./tests/helpers/rn_loader.mjs', import.meta.url);
      const client = await import('./mobile-app/src/api/client.js');

      const start = Date.now();
      try {
        // Do not pass timeoutMs in options — rely on environment threshold
        await client.apiRequest('/slow');
        console.log(JSON.stringify({ success: true }));
      } catch (err) {
        const elapsed = Date.now() - start;
        console.log(JSON.stringify({
          success: false,
          timeout: err.timeout,
          network: err.network,
          message: err.message,
          elapsed,
          configuredTimeout: client.API_TIMEOUT_MS,
        }));
      }
    `;

      const child = spawn(process.execPath, ['--input-type=module', '-e', scriptCode], {
        cwd: ROOT_DIR,
        env: {
          ...process.env,
          EXPO_PUBLIC_API_TIMEOUT_MS: '120',
          EXPO_PUBLIC_API_URL: subSrv.baseUrl,
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

      const exitCode = await new Promise((r) => child.on('close', r));
      assert.strictEqual(exitCode, 0, `Subprocess failed with stderr: ${stderr}`);

      const result = JSON.parse(stdout.trim().split('\n').pop());
      assert.strictEqual(result.success, false, 'Should fail due to timeout');
      assert.strictEqual(result.timeout, true, 'Error must have timeout=true');
      assert.strictEqual(result.network, true, 'Error must have network=true');
      assert.strictEqual(result.configuredTimeout, 120, 'Configured API_TIMEOUT_MS must equal 120');
      assert.ok(
        result.message.includes('120ms'),
        `Error message should state 120ms, got: "${result.message}"`,
      );
      assert.ok(
        result.elapsed >= 100 && result.elapsed <= 800,
        `Request elapsed in ${result.elapsed}ms, expected ~120ms`,
      );
    },
  );
});
