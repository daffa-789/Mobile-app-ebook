import { spawn } from 'node:child_process';
import { probePort } from './lib/portProbe.js';
import pc from 'picocolors';

const DEBUG = process.env.CLEAN_PORTS_DEBUG === '1';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ambil daftar PID yang sedang LISTEN pada `port` via `netstat -ano`.
 * Menghindari Get-NetTCPConnection (sering diblokir kebijakan PowerShell atau
 * membutuhkan elevasi) sehingga perilaku sama di Windows biasa maupun CI.
 */
function findListeningPids(port) {
  return new Promise((resolve) => {
    // `-p TCP` justru menyaring soket pada sebagian build Windows; `-ano` polos
    // selalu lengkap. State tidak dijadikan filter karena beberapa lingkungan
    // (WSL/CI/sandbox) melaporkan soket LISTEN dengan state yang tidak lazim.
    const child = spawn('netstat', ['-ano'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let output = '';
    const pids = new Set();

    child.stdout?.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', () => resolve([]));
    child.on('close', () => {
      for (const line of output.split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5 || parts[0].toUpperCase() !== 'TCP') continue;
        const [, localAddress, , , pid] = parts;
        const localPort = Number(localAddress?.split(':').pop());
        const owner = Number(pid);
        if (localPort === port && owner > 0 && owner !== process.pid) pids.add(owner);
      }
      resolve([...pids]);
    });
  });
}

/** Pastikan PID tersebut benar-benar proses Node.js sebelum dihentikan. */
function isNodeProcess(pid) {
  return new Promise((resolve) => {
    const child = spawn('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let output = '';
    child.stdout?.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', () => resolve(false));
    child.on('close', () => resolve(/node\.exe/i.test(output)));
  });
}

function terminate(pid) {
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

async function cleanPort(port) {
  const isBusy = await probePort(port);
  if (!isBusy) {
    console.log(`  ${pc.green('✔')} Port ${port} sudah bersih (tidak ada proses aktif).`);
    return;
  }

  console.log(`  ${pc.yellow('⚠')} Port ${port} sedang digunakan. Menghentikan proses...`);

  if (process.platform === 'win32') {
    let killed = 0;
    // Tabel soket Windows bisa tertunda beberapa ratus milidetik (terutama di
    // CI / lingkungan virtual). Ulangi sampai PID pemilik port benar-benar
    // terlihat dan portnya lepas, maksimal ~2,5 detik.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const pids = await findListeningPids(port);
      for (const pid of pids) {
        const isNode = await isNodeProcess(pid);
        const terminated = isNode && terminate(pid);
        if (DEBUG) {
          console.log(
            `  ${pc.magenta('[debug]')} attempt=${attempt} port=${port} pid=${pid} isNode=${isNode} terminated=${terminated}`,
          );
        }
        if (terminated) killed += 1;
      }
      if (killed > 0) {
        await sleep(200);
        if (!(await probePort(port))) break;
      }
      await sleep(250);
    }
    if (killed > 0) {
      console.log(`  ${pc.green('✔')} Proses Node pada Port ${port} berhasil dihentikan.`);
    } else {
      console.log(`  ${pc.cyan('ℹ')} Selesai memeriksa Port ${port}.`);
    }
    return;
  }

  try {
    const child = spawn('sh', ['-c', `fuser -k ${port}/tcp 2>/dev/null || true`]);
    await new Promise((resolve) => child.on('close', resolve));
    console.log(`  ${pc.green('✔')} Selesai memeriksa Port ${port} (POSIX).`);
  } catch (error) {
    console.log(`  ${pc.red('✖')} Gagal membebaskan Port ${port}: ${error.message}`);
  }
}

const PORTS_TO_CLEAN = [3000, 5000, 3001, 8081];

console.log(pc.bold(pc.cyan('\n🧹 MEMBERSIHKAN PORT SISTEM (3000, 5000, 3001, & 8081)...\n')));
for (const port of PORTS_TO_CLEAN) {
  await cleanPort(port);
}
console.log(pc.green('\n🎉 Port siap digunakan kembali!\n'));
