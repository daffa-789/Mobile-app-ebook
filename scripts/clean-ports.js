import { spawn } from 'child_process';
import { probePort } from './lib/portProbe.js';
import pc from 'picocolors';

async function cleanPort(port) {
  const isBusy = await probePort(port);
  if (!isBusy) {
    console.log(`  ${pc.green('✔')} Port ${port} sudah bersih (tidak ada proses aktif).`);
    return;
  }

  console.log(`  ${pc.yellow('⚠')} Port ${port} sedang digunakan. Menghentikan proses...`);
  if (process.platform === 'win32') {
    try {
      const ps = spawn(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `$conns = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue; ` +
            `foreach ($c in $conns) { ` +
            `$p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; ` +
            `if ($p -and $p.ProcessName -eq 'node') { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Write-Output ("KILL " + $p.Id) } }`,
        ],
        { stdio: 'pipe' },
      );
      let out = '';
      ps.stdout.on('data', (d) => {
        out += d.toString();
      });
      await new Promise((r) => ps.on('close', r));
      if (out.includes('KILL')) {
        console.log(`  ${pc.green('✔')} Proses Node pada Port ${port} berhasil dihentikan.`);
      } else {
        console.log(`  ${pc.cyan('ℹ')} Selesai memeriksa Port ${port}.`);
      }
    } catch (e) {
      console.log(`  ${pc.red('✖')} Gagal membebaskan Port ${port}: ${e.message}`);
    }
  } else {
    try {
      const p = spawn('sh', ['-c', `fuser -k ${port}/tcp 2>/dev/null || true`]);
      await new Promise((r) => p.on('close', r));
      console.log(`  ${pc.green('✔')} Selesai memeriksa Port ${port} (POSIX).`);
    } catch (e) {
      console.log(`  ${pc.red('✖')} Gagal membebaskan Port ${port}: ${e.message}`);
    }
  }
}

console.log(pc.bold(pc.cyan('\n🧹 MEMBERSIHKAN PORT SISTEM (3000 & 5000)...\n')));
await cleanPort(3000);
await cleanPort(5000);
console.log(pc.green('\n🎉 Port siap digunakan kembali!\n'));
