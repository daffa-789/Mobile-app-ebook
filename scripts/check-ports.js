/**
 * @file scripts/check-ports.js
 * @description Diagnostik status port TCP non-destruktif untuk monorepo Wahidiyah Book.
 * Memeriksa ketersediaan port 3000, 5000, 3001, dan 8081 tanpa mematikan proses yang sedang berjalan.
 */

import { probePort } from './lib/portProbe.js';
import pc from 'picocolors';

const PORTS_TO_CHECK = [
  { port: 3000, service: 'Landing Page / Unified Dev Server' },
  { port: 5000, service: 'Express Backend API' },
  { port: 3001, service: 'Admin Dashboard Web' },
  { port: 8081, service: 'Expo Metro Bundler' },
];

console.log(pc.bold(pc.cyan('\n🔍 DIAGNOSTIK STATUS PORT MONOREPO WAHIDIYAH BOOK...\n')));

let busyCount = 0;

for (const { port, service } of PORTS_TO_CHECK) {
  const isBusy = await probePort(port);
  if (isBusy) {
    busyCount++;
    console.log(
      `  ${pc.yellow('●')} Port ${pc.bold(String(port).padEnd(5))} (${service}): ${pc.yellow(
        'SEDANG DIGUNAKAN / LISTENING',
      )}`,
    );
  } else {
    console.log(
      `  ${pc.green('○')} Port ${pc.bold(String(port).padEnd(5))} (${service}): ${pc.green(
        'TERSEDIA (OPEN)',
      )}`,
    );
  }
}

if (busyCount > 0) {
  console.log(
    pc.yellow(
      `\nℹ ${busyCount} port sedang aktif. Jalankan 'npm run clean:ports' jika ingin menghentikan proses Node yang memblokir.\n`,
    ),
  );
} else {
  console.log(pc.green('\n✔ Semua port bersih dan siap digunakan.\n'));
}
