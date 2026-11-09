import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appJson = require(path.join(root, 'app.json'));
const plugin = require(path.join(root, 'mobile-app', 'plugins', 'withJscEngine.cjs'));

test('app.json memasang plugin JSC agar perangkat 32-bit tidak crash Hermes', () => {
  const plugins = appJson.expo.plugins.map((entry) => (Array.isArray(entry) ? entry[0] : entry));
  assert.ok(
    plugins.includes('./mobile-app/plugins/withJscEngine.cjs'),
    'plugin withJscEngine harus terdaftar di expo.plugins',
  );
});

test('plugin menyetel hermesEnabled=false pada gradle properties kosong', () => {
  const hasil = plugin.setJscEngine([]);
  assert.deepEqual(hasil, [{ type: 'property', key: 'hermesEnabled', value: 'false' }]);
});

test('plugin menimpa nilai hermesEnabled bawaan template', () => {
  const hasil = plugin.setJscEngine([
    { type: 'property', key: 'newArchEnabled', value: 'true' },
    { type: 'property', key: 'hermesEnabled', value: 'true' },
  ]);
  assert.equal(hasil.find((item) => item.key === 'hermesEnabled').value, 'false');
  assert.equal(hasil.find((item) => item.key === 'newArchEnabled').value, 'true');
});
