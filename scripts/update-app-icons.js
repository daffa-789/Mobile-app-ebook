import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC_ICON =
  'C:\\Users\\Daffa\\.gemini\\antigravity\\brain\\cb555392-c06f-4880-8f8e-97d0c668e233\\.user_uploaded\\media_1793981391003_eaa13715.png';
const ASSETS_DIR = path.resolve('mobile-app', 'assets');
const PUBLIC_DIR = path.resolve('public');

async function generateIcons() {
  console.log('Memproses ikon baru dari:', SRC_ICON);

  // 1. icon.png (1024x1024)
  await sharp(SRC_ICON)
    .resize(1024, 1024, { fit: 'contain', background: { r: 6, g: 117, b: 84, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✔ icon.png dibuat (1024x1024)');

  // 2. android-icon-background.png (1024x1024 solid #067554)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 6, g: 117, b: 84, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
  console.log('✔ android-icon-background.png dibuat (Solid #067554)');

  // 3. android-icon-foreground.png (1024x1024 dengan artwork di safe-zone ~72%)
  const resizedInner = await sharp(SRC_ICON)
    .resize(768, 768, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedInner, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
  console.log('✔ android-icon-foreground.png dibuat (Adaptive Foreground)');

  // 4. splash-icon.png (512x512)
  await sharp(SRC_ICON)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('✔ splash-icon.png dibuat');

  // 5. favicon.png (64x64)
  await sharp(SRC_ICON)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('✔ favicon.png dibuat');

  // 6. Sinkronkan juga ke public/ web PWA
  await sharp(SRC_ICON).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  await sharp(SRC_ICON).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  console.log('✔ public/icon-192.png & public/icon-512.png diperbarui');
}

generateIcons().catch(console.error);
