/**
 * @file scripts/lib/portProbe.js
 * @description Uji apakah sebuah TCP port sedang terikat — dipakai ketiga runner
 * (`dev.js`, `start.js`, `clean-ports.js`). Dulu disalin tiga kali; kalau logika
 * timeoutnya berubah, ketiga runner harus berubah bersamaan.
 */

import net from 'net';

/** `true` bila ada yang menyimak di port tersebut (atau host tidak bisa dihubungi dalam `timeout`). */
export function probePort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      done = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once('error', () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(port, host);
  });
}
