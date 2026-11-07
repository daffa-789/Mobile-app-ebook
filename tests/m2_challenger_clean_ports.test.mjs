/**
 * @file tests/m2_challenger_clean_ports.test.mjs
 * @description Adversarial empirical stress test for scripts/clean-ports.js:
 *  - Verifies idle execution across 3000, 5000, 3001, 8081
 *  - Verifies process identification and forced kill of occupied Node.js listeners
 *  - Verifies subsequent recovery of ports back to clean state
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function stripAnsi(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

// Spawns a background Node.js process that listens on a port until killed
function spawnZombieNodeServer(port) {
  const code = `
    import http from 'node:http';
    const srv = http.createServer((q, r) => r.end('zombie'));
    srv.listen(${port}, '0.0.0.0', () => {
      console.log('READY');
    });
  `;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });

    let buffer = '';
    const onData = (data) => {
      buffer += data.toString();
      if (buffer.includes('READY')) {
        child.stdout.off('data', onData);
        resolve({
          pid: child.pid,
          process: child,
        });
      }
    };
    child.stdout.on('data', onData);

    child.on('error', reject);
    setTimeout(() => reject(new Error(`Timeout spawning zombie server on port ${port}`)), 5000);
  });
}

test('Port Automation Clean Suite (ports 3000, 5000, 3001, 8081)', async (t) => {
  await t.test('1. Idle state: clean-ports.js handles all 4 ports cleanly with exit code 0', () => {
    const out = execSync('node scripts/clean-ports.js', { cwd: ROOT_DIR, encoding: 'utf8' });
    const clean = stripAnsi(out);

    assert.ok(clean.includes('Port 3000 sudah bersih'), 'Port 3000 report');
    assert.ok(clean.includes('Port 5000 sudah bersih'), 'Port 5000 report');
    assert.ok(clean.includes('Port 3001 sudah bersih'), 'Port 3001 report');
    assert.ok(clean.includes('Port 8081 sudah bersih'), 'Port 8081 report');
    assert.ok(clean.includes('Port siap digunakan kembali!'), 'Final success confirmation');
  });

  await t.test(
    '2. Occupied state: clean-ports.js finds and terminates Node processes on ports 3001 & 8081',
    async () => {
      // Spawn two separate Node zombie processes holding ports 3001 (Admin) and 8081 (Metro)
      const zombie1 = await spawnZombieNodeServer(3001);
      const zombie2 = await spawnZombieNodeServer(8081);

      try {
        // 2a. Verify check-ports detects both ports as active
        const checkBefore = execSync('node scripts/check-ports.js', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });
        const cleanBefore = stripAnsi(checkBefore);
        assert.ok(
          cleanBefore.includes('Port 3001') && cleanBefore.includes('SEDANG DIGUNAKAN'),
          'Port 3001 must be detected busy',
        );
        assert.ok(
          cleanBefore.includes('Port 8081') && cleanBefore.includes('SEDANG DIGUNAKAN'),
          'Port 8081 must be detected busy',
        );

        // 2b. Execute clean-ports.js
        const cleanOut = execSync('node scripts/clean-ports.js', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });
        const cleanText = stripAnsi(cleanOut);
        console.log('CLEAN OUTPUT TEXT:\n', cleanText);

        // 2c. Verify output reports terminating or cleaning
        assert.ok(
          cleanText.includes('Port 3001 sedang digunakan') ||
            cleanText.includes('Proses Node pada Port 3001 berhasil dihentikan'),
        );
        assert.ok(
          cleanText.includes('Port 8081 sedang digunakan') ||
            cleanText.includes('Proses Node pada Port 8081 berhasil dihentikan'),
        );

        // 2d. Tabel soket Windows/CI bisa tertunda beberapa ratus milidetik.
        // Ulangi pembersihan lewat proses baru bila masih ada port yang belum
        // lepas, lalu verifikasi hasil akhirnya.
        let cleanAfter = '';
        for (let attempt = 0; attempt < 4; attempt += 1) {
          if (attempt > 0) {
            execSync('node scripts/clean-ports.js', { cwd: ROOT_DIR, encoding: 'utf8' });
          }
          await new Promise((r) => setTimeout(r, 500));
          cleanAfter = stripAnsi(
            execSync('node scripts/check-ports.js', { cwd: ROOT_DIR, encoding: 'utf8' }),
          );
          if (cleanAfter.includes('Semua port bersih dan siap digunakan')) break;
        }

        assert.match(
          cleanAfter,
          /Port 3001\s+.*TERSEDIA/,
          'Port 3001 must specifically be reported TERSEDIA',
        );
        assert.match(
          cleanAfter,
          /Port 8081\s+.*TERSEDIA/,
          'Port 8081 must specifically be reported TERSEDIA',
        );
        assert.ok(
          cleanAfter.includes('Semua port bersih dan siap digunakan'),
          'All ports confirmed clean and ready',
        );
      } finally {
        // Safety cleanup if still alive
        try {
          process.kill(zombie1.pid);
        } catch (_) {}
        try {
          process.kill(zombie2.pid);
        } catch (_) {}
      }
    },
  );
});
