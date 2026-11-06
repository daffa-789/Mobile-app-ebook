import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 4567;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const OUTPUT_DIR = 'C:\\Users\\Daffa\\.gemini\\antigravity\\brain\\cb555392-c06f-4880-8f8e-97d0c668e233\\screenshots';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(PORT, async () => {
  console.log(`Server preview aktif di http://localhost:${PORT}`);

  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 440,
      height: 956,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    // Helper untuk klik elemen berdasarkan teks dengan koordinat mouse nyata
    const clickText = async (text, exact = false) => {
      const handle = await page.evaluateHandle((targetText, isExact) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.reverse().find((el) => {
          if (!el.textContent) return false;
          const trimmed = el.textContent.trim();
          if (isExact) return trimmed === targetText;
          return trimmed.includes(targetText);
        });
      }, text, exact);

      const el = handle.asElement();
      if (el) {
        const box = await el.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await new Promise((r) => setTimeout(r, 800));
          return true;
        }
      }
      return false;
    };

    console.log('Membuka aplikasi mobile di viewport 440x956...');
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Beranda
    console.log('Mengambil Screenshot 1: Beranda...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '1_beranda.png') });

    // 2. Kalender
    console.log('Mengambil Screenshot 2: Kalender...');
    await clickText('Kalender', true);
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '2_kalender.png') });

    // 3. Pro
    console.log('Mengambil Screenshot 3: Pro...');
    await clickText('Pro', true);
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '3_pro.png') });

    // 4. Profil
    console.log('Mengambil Screenshot 4: Profil...');
    await clickText('Profil', true);
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '4_profil.png') });

    // 5. Riwayat Langganan
    console.log('Mengambil Screenshot 5: Riwayat Langganan...');
    await clickText('Riwayat Langganan');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '5_riwayat_langganan.png') });

    // 6. Reader Buku
    console.log('Mengambil Screenshot 6: Reader Buku...');
    // Klik tombol Beranda
    await clickText('Beranda', true);
    await new Promise((r) => setTimeout(r, 1000));
    // Klik buku Hadits Arba'in
    await clickText("Hadits Arba'in");
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '6_reader_buku.png') });

    // 7. Auth Modal (Login / Register)
    console.log('Mengambil Screenshot 7: Auth Modal...');
    await page.goto(`http://localhost:${PORT}?auth=1`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '7_auth_modal.png') });

    // Salin ke public/mobile_screenshots agar tersimpan permanen di proyek
    const publicDir = path.resolve(process.cwd(), 'public', 'mobile_screenshots');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    for (const file of fs.readdirSync(OUTPUT_DIR)) {
      fs.copyFileSync(path.join(OUTPUT_DIR, file), path.join(publicDir, file));
    }

    console.log('Seluruh screenshot berhasil diperbarui 100%!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Galat:', err);
    server.close();
    process.exit(1);
  }
});
