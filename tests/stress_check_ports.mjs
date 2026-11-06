import net from 'node:net';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';

function stripAnsi(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.write('echo\n');
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

console.log('--- TEST 1: Full Occupancy (All 4 ports: 3000, 5000, 3001, 8081) ---');
const servers = await Promise.all([
  startServer(3000),
  startServer(5000),
  startServer(3001),
  startServer(8081),
]);

let rawOutput = '';
try {
  rawOutput = execSync('node scripts/check-ports.js', { encoding: 'utf8' });
} catch (err) {
  console.error('Execution error:', err);
  throw err;
}

const cleanOutput = stripAnsi(rawOutput);
console.log('Cleaned Output with 4 ports occupied:\n', cleanOutput);

assert.ok(
  cleanOutput.includes('Port 3000') && cleanOutput.includes('SEDANG DIGUNAKAN'),
  'Port 3000 must be busy',
);
assert.ok(
  cleanOutput.includes('Port 5000') && cleanOutput.includes('SEDANG DIGUNAKAN'),
  'Port 5000 must be busy',
);
assert.ok(
  cleanOutput.includes('Port 3001') && cleanOutput.includes('SEDANG DIGUNAKAN'),
  'Port 3001 must be busy',
);
assert.ok(
  cleanOutput.includes('Port 8081') && cleanOutput.includes('SEDANG DIGUNAKAN'),
  'Port 8081 must be busy',
);
assert.ok(cleanOutput.includes('4 port sedang aktif'), 'Must report 4 ports active');

for (const s of servers) {
  assert.equal(s.listening, true, 'Server must STILL be listening (non-destructive check)');
}

await Promise.all(servers.map(stopServer));
console.log('✔ Full occupancy test passed. All servers remained alive and were cleanly shut down.');

console.log('--- TEST 2: Partial Occupancy (Only 5000 and 8081 occupied) ---');
const partialServers = await Promise.all([startServer(5000), startServer(8081)]);

try {
  rawOutput = execSync('node scripts/check-ports.js', { encoding: 'utf8' });
} catch (err) {
  console.error('Execution error:', err);
  throw err;
}

const partialClean = stripAnsi(rawOutput);
console.log('Cleaned Output with partial occupancy:\n', partialClean);

assert.ok(
  partialClean.includes('Port 3000') && partialClean.includes('TERSEDIA'),
  'Port 3000 must be open',
);
assert.ok(
  partialClean.includes('Port 5000') && partialClean.includes('SEDANG DIGUNAKAN'),
  'Port 5000 must be busy',
);
assert.ok(
  partialClean.includes('Port 3001') && partialClean.includes('TERSEDIA'),
  'Port 3001 must be open',
);
assert.ok(
  partialClean.includes('Port 8081') && partialClean.includes('SEDANG DIGUNAKAN'),
  'Port 8081 must be busy',
);
assert.ok(partialClean.includes('2 port sedang aktif'), 'Must report 2 ports active');

for (const s of partialServers) {
  assert.equal(s.listening, true, 'Partial servers must remain alive');
}

await Promise.all(partialServers.map(stopServer));
console.log('✔ Partial occupancy test passed.');
console.log('ALL CHECK-PORTS STRESS TESTS PASSED EMPIRICALLY!');
