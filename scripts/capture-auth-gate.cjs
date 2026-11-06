const puppeteer = require('puppeteer-core');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ executablePath: edgePath, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 2 });
  
  // Clear any existing localStorage to simulate a brand-new user session
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Auth Gate - Login View
  await page.screenshot({ path: 'public/mobile_screenshots/auth_login_gate.png' });
  console.log('Saved auth_login_gate.png');

  // 2. Click Register Tab
  const elements = await page.$$('div[role="button"]');
  for (const el of elements) {
    const text = await page.evaluate(e => e.innerText, el);
    if (text && text.includes('Daftar Akun')) {
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        break;
      }
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'public/mobile_screenshots/auth_register_gate.png' });
  console.log('Saved auth_register_gate.png');

  // 3. Login with Demo Google Button to test entry to Main App
  const allBtns = await page.$$('div[role="button"]');
  for (const el of allBtns) {
    const text = await page.evaluate(e => e.innerText, el);
    if (text && text.includes('Google')) {
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        break;
      }
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'public/mobile_screenshots/after_login_home.png' });
  console.log('Saved after_login_home.png');

  // 4. Go to Profil Tab
  const navBtns = await page.$$('div[role="button"]');
  for (const el of navBtns) {
    const text = await page.evaluate(e => e.innerText, el);
    if (text && text.includes('Profil')) {
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        break;
      }
    }
  }
  await new Promise(r => setTimeout(r, 800));

  // 5. Click "Keluar dari Sesi"
  const profileBtns = await page.$$('div[role="button"]');
  for (const el of profileBtns) {
    const text = await page.evaluate(e => e.innerText, el);
    if (text && text.includes('Keluar dari Sesi')) {
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        break;
      }
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'public/mobile_screenshots/logout_confirmation_modal.png' });
  console.log('Saved logout_confirmation_modal.png');

  // 6. Click "Ya, Log Out"
  const modalBtns = await page.$$('div[role="button"]');
  for (const el of modalBtns) {
    const text = await page.evaluate(e => e.innerText, el);
    if (text && text.includes('Ya, Log Out')) {
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        break;
      }
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'public/mobile_screenshots/after_logout_back_to_login.png' });
  console.log('Saved after_logout_back_to_login.png');

  await browser.close();
  console.log('All auth flow screenshots captured successfully!');
})();
