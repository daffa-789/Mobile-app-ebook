/**
 * @file scripts/start.js
 * @description Runner mode produksi terpadu (npm start) untuk Wahidiyah Book.
 * Memeriksa ketersediaan direktori dist/, mengompilasi aset Vite otomatis bila belum ada,
 * mendeteksi ketersediaan port, dan menjalankan server Express produksi dengan SERVE_STATIC=true.
 *
 * Mendukung opsi flag CLI:
 *  - `--rebuild` : Memaksa kompilasi ulang dist/ sebelum server menyala
 *  - `--no-build` : Melewatkan pemeriksaan kompilasi (wajib sudah ada dist/)
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { probePort } from './lib/portProbe.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env') });

const args = process.argv.slice(2);
const forceRebuild = args.includes('--rebuild');
const skipBuild = args.includes('--no-build');

const PORT = Number(process.env.PORT) || 5000;
const C = pc;
const log = (colorFn, msg) => console.log(typeof colorFn === 'function' ? colorFn(msg) : msg);

const env = { ...process.env };
if (process.platform === 'win32') {
  const system32 = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32');
  const currentPath = env.PATH || env.Path || '';
  if (!currentPath.toLowerCase().includes('system32')) env.PATH = `${system32};${currentPath}`;
}

const nodeExec = process.execPath;
const viteBin = path.resolve(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const serverScript = path.resolve(rootDir, 'server', 'server.js');
const distDir = path.resolve(rootDir, 'dist');
const distIndex = path.join(distDir, 'index.html');

async function freePort(port) {
  if (process.platform !== 'win32') return;
  if (!(await probePort(port))) return;
  log(C.yellow, `[START] Port ${port} sedang terikat. Memeriksa pemilik...`);
  try {
    const ps = spawn(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `$conns = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue; ` +
          `foreach ($c in $conns) { $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; ` +
          `if ($p -and $p.ProcessName -eq 'node') { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Write-Output ("KILL " + $p.Id) } ` +
          `elseif ($p) { Write-Output ("SKIP " + $p.Id + " " + $p.ProcessName) } }`,
      ],
      { stdio: 'pipe' },
    );
    let out = '';
    ps.stdout.on('data', (d) => {
      out += d.toString();
    });
    await new Promise((r) => ps.on('close', r));
    for (const line of out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)) {
      if (line.startsWith('KILL'))
        log(C.yellow, `[START]   → proses node dihentikan: PID ${line.slice(5)}`);
      else if (line.startsWith('SKIP')) {
        log(
          C.red,
          `[START]   → port ${port} dipakai proses lain (${line.slice(5)}) — hentikan manual lalu ulangi.`,
        );
      }
    }
    await new Promise((r) => setTimeout(r, 800));
  } catch {}
}

function runBuild() {
  return new Promise((resolve, reject) => {
    log(C.cyan, '[START] Membangun frontend (vite build)...');
    const proc = spawn(nodeExec, [viteBin, 'build'], { cwd: rootDir, env, stdio: 'inherit' });
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`vite build gagal (kode ${code})`)),
    );
    proc.on('error', reject);
  });
}

async function main() {
  const hasBuild = fs.existsSync(distIndex);
  if (skipBuild && !hasBuild) {
    log(C.red, '[START] --no-build diminta tapi folder dist/ belum ada. Jalankan tanpa flag itu.');
    process.exit(1);
  }
  if (!skipBuild && (!hasBuild || forceRebuild)) {
    try {
      await runBuild();
      log(C.green, '[START] Build selesai.');
    } catch (e) {
      log(C.red, `[START] ${e.message}`);
      process.exit(1);
    }
  }

  await freePort(PORT);

  log(C.cyan, `[START] Menjalankan server di http://localhost:${PORT} ...`);
  log(C.dim, '        Tekan CTRL+C untuk mematikan.');
  console.log();

  const proc = spawn(nodeExec, [serverScript], {
    cwd: rootDir,
    env: { ...env, NODE_ENV: 'production', SERVE_STATIC: 'true' },
    stdio: 'inherit',
  });

  const cleanup = () => {
    try {
      if (process.platform === 'win32')
        spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      else proc.kill('SIGTERM');
    } catch {}
    setTimeout(() => process.exit(0), 200);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  proc.on('close', () => {
    process.exit(0);
  });
}

main();
