/**
 * Bukti CSP enforced di peramban nyata (Chrome/Edge headless).
 *
 *   node scripts/csp-browser-check.mjs [direktori-build] [--control]
 *
 * Tanpa argumen memeriksa `dist/landing` (halaman yang live di `/`).
 * `--control` menyisipkan pelanggaran CSP yang disengaja: gunakan ini untuk
 * membuktikan probe-nya benar-benar mendeteksi, bukan sekadar mencetak CSP_OK.
 *
 * Kenapa begini: policy yang ditegakkan bisa mematikan UI (skrip inline,
 * style React, eval). Probe disuntikkan sebagai anak PERTAMA <head> supaya
 * listener `securitypolicyviolation` aktif sebelum skrip lain berjalan, dan
 * penanda PROBE_ALIVE membedakan "probe jalan" dari "kebetulan tidak ada
 * pelanggaran". Policy dibaca dari vercel.json agar uji tidak menyimpang.
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const control = args.includes('--control');
const buildDir = path.resolve(ROOT, args.find((arg) => !arg.startsWith('--')) || 'dist/landing');

const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const cspRule = vercel.headers.find((rule) =>
  rule.headers.some((header) => header.key === 'Content-Security-Policy'),
);
if (!cspRule) throw new Error('vercel.json tidak memuat header CSP enforced.');
const CSP = cspRule.headers.find((header) => header.key === 'Content-Security-Policy').value;

const PROBE = `
(function () {
  var violations = [];
  var alive = document.getElementById('__csp_probe_alive');
  if (alive) alive.textContent = 'PROBE_ALIVE';
  document.addEventListener('securitypolicyviolation', function (event) {
    violations.push(event.violatedDirective + ' :: ' + event.blockedURI);
    render();
  }, true);
  function render() {
    var out = document.getElementById('__csp_probe_out');
    if (out) out.textContent = violations.length
      ? 'CSP_VIOLATIONS=' + JSON.stringify(violations)
      : 'CSP_OK';
  }
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(render, 1500);
  });
})();
`;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = '/';
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  } catch {
    /* pakai root */
  }
  const headers = {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  };

  if (urlPath === '/__csp_probe.js') {
    res.writeHead(200, { ...headers, 'Content-Type': TYPES['.js'] });
    return res.end(PROBE);
  }
  if (urlPath === '/') urlPath = '/index.html';

  const file = path.resolve(buildDir, '.' + urlPath);
  if (!file.startsWith(buildDir)) {
    res.writeHead(403);
    return res.end('forbidden');
  }
  let body;
  try {
    body = fs.readFileSync(file);
  } catch {
    res.writeHead(404, { ...headers, 'Content-Type': 'text/plain' });
    return res.end('not found');
  }

  const ext = path.extname(file).toLowerCase();
  const contentType = TYPES[ext] || 'application/octet-stream';
  if (ext === '.html') {
    const injected =
      '<pre id="__csp_probe_alive">PROBE_NOT_RUN</pre>' +
      '<pre id="__csp_probe_out">PROBE_PENDING</pre>' +
      '<script src="/__csp_probe.js"></script>' +
      (control ? '<script>window.__csp_positive_control = 1;</script>' : '');
    const html = body.toString('utf8').replace(/<head([^>]*)>/i, (match) => match + injected);
    res.writeHead(200, { ...headers, 'Content-Type': contentType });
    return res.end(html);
  }
  res.writeHead(200, { ...headers, 'Content-Type': contentType });
  return res.end(body);
});

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome/Edge tidak ditemukan. Set CHROME_PATH ke berkas eksekusinya.');

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wahidiyah-csp-'));

/* Dua jebakan Windows yang sengaja dihindari:
 *  1. Server probe ada di proses yang SAMA. `spawnSync` akan memblokir event
 *     loop, sehingga permintaan Chrome tidak pernah dijawab dan uji selalu
 *     timeout. Pakai `spawn` async supaya server tetap melayani.
 *  2. Chrome meneruskan handle stdout ke proses anaknya. Lewat pipe, proses
 *     induk menunggu EOF yang tak pernah datang — jadi stdout ditulis ke
 *     berkas, bukan pipe. */
const domFile = path.join(profile, 'dom.html');
const errFile = path.join(profile, 'chrome.err');
const outFd = fs.openSync(domFile, 'w');
const errFd = fs.openSync(errFile, 'w');
let spawnError = null;
let timedOut = false;
await new Promise((resolve) => {
  const child = spawn(
    chrome,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profile}`,
      '--virtual-time-budget=8000',
      '--dump-dom',
      `http://127.0.0.1:${port}/`,
    ],
    { stdio: ['ignore', outFd, errFd], windowsHide: true },
  );
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGKILL');
  }, 90000);
  child.on('error', (error) => {
    spawnError = error;
    clearTimeout(timer);
    resolve();
  });
  child.on('exit', () => {
    clearTimeout(timer);
    resolve();
  });
});
fs.closeSync(outFd);
fs.closeSync(errFd);
server.close();

const dom = fs.existsSync(domFile) ? fs.readFileSync(domFile, 'utf8') : '';
fs.rmSync(profile, { recursive: true, force: true });
const alive = dom.includes('PROBE_ALIVE');
const violations = dom.match(/CSP_VIOLATIONS=([^<]*)/)?.[1];
const clean = dom.includes('CSP_OK');

console.log(`Build   : ${buildDir}`);
console.log(`Mode    : ${control ? 'kontrol positif' : 'normal'}`);
console.log(`Probe   : ${alive ? 'jalan' : 'TIDAK JALAN (hasil tidak sah)'}`);
if (spawnError) console.log(`Chrome  : ${spawnError.message}`);
if (timedOut) console.log('Chrome  : timeout 90 detik');

if (!alive) {
  console.error('GAGAL: probe tidak dieksekusi; jangan percaya hasil CSP_OK.');
  process.exit(1);
}
if (control) {
  if (!violations) {
    console.error('GAGAL: kontrol positif tidak terdeteksi — harness CSP rusak.');
    process.exit(1);
  }
  console.log(`Terdeteksi: ${violations}`);
  console.log('LOLOS: harness terbukti mendeteksi pelanggaran CSP.');
  process.exit(0);
}
if (violations || !clean) {
  console.error(
    `GAGAL: CSP enforced memblokir sumber daya: ${violations || 'hasil tidak lengkap'}`,
  );
  process.exit(1);
}
console.log('LOLOS: tidak ada pelanggaran CSP pada halaman ini.');
