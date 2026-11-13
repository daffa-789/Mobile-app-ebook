import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Milestone 1: Monorepo Architecture & Workspace Setup', () => {
  test('Invariant: Exactly 1 package.json exists at root, zero nested package.json', () => {
    function findPackageJsons(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(findPackageJsons(fullPath));
        } else if (file === 'package.json') {
          results.push(fullPath);
        }
      }
      return results;
    }

    const packageJsons = findPackageJsons(rootDir);
    assert.equal(packageJsons.length, 1);
    assert.equal(packageJsons[0], path.join(rootDir, 'package.json'));
  });

  test('Invariant: Zero nested node_modules exist outside root', () => {
    function findNestedNodeModules(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          if (file === 'node_modules') {
            results.push(fullPath);
          } else {
            results = results.concat(findNestedNodeModules(fullPath));
          }
        }
      }
      return results;
    }

    const nested = findNestedNodeModules(rootDir);
    assert.equal(nested.length, 0);
  });

  test('package.json contains all required workspace scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    assert.ok(pkg.scripts['dev:landing'], 'Missing dev:landing');
    assert.ok(pkg.scripts['build:landing'], 'Missing build:landing');
    assert.ok(pkg.scripts['dev:admin'], 'Missing dev:admin');
    assert.ok(pkg.scripts['build:admin'], 'Missing build:admin');
    assert.ok(pkg.scripts['check:ports'], 'Missing check:ports');
  });

  test('scripts/check-ports.js exists and is non-destructive', () => {
    const scriptPath = path.join(rootDir, 'scripts/check-ports.js');
    assert.ok(fs.existsSync(scriptPath), 'scripts/check-ports.js must exist');
    const content = fs.readFileSync(scriptPath, 'utf8');
    assert.ok(content.includes('portProbe'), 'Must use portProbe');
    assert.ok(content.includes('3000'), 'Must check port 3000');
    assert.ok(content.includes('5000'), 'Must check port 5000');
    assert.ok(content.includes('3001'), 'Must check port 3001');
    assert.ok(content.includes('8081'), 'Must check port 8081');
    assert.ok(
      !content.includes('Stop-Process') && !content.includes('fuser -k'),
      'Must be non-destructive',
    );
  });

  test('vite.config.js contains @shared alias', () => {
    const config = fs.readFileSync(path.join(rootDir, 'vite.config.js'), 'utf8');
    assert.ok(config.includes("'@shared'"), 'Must include @shared alias');
  });

  test('tailwind.config.js content paths include all workspaces', () => {
    const config = fs.readFileSync(path.join(rootDir, 'tailwind.config.js'), 'utf8');
    assert.ok(config.includes('./landing-page/**/*.{js,ts,jsx,tsx,html}'));
    assert.ok(config.includes('./admin-dashboard-web/**/*.{js,ts,jsx,tsx,html}'));
    assert.ok(config.includes('./shared/**/*.{js,ts,jsx,tsx}'));
  });

  test('jsconfig.json includes all workspaces and alias mappings', () => {
    const jsconfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'jsconfig.json'), 'utf8'));
    assert.ok(jsconfig.compilerOptions.paths['@/*']);
    assert.ok(jsconfig.compilerOptions.paths['@shared/*']);
    assert.ok(jsconfig.include.includes('landing-page/**/*'));
    assert.ok(jsconfig.include.includes('admin-dashboard-web/**/*'));
    assert.ok(jsconfig.include.includes('mobile-app/**/*'));
  });

  test('Dependensi native mengikuti versi SDK Expo', () => {
    const { dependencies } = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
    );
    const sdkVersions = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'node_modules/expo/bundledNativeModules.json'), 'utf8'),
    );
    for (const name of ['react', 'react-dom', 'expo-font']) {
      assert.equal(dependencies[name], sdkVersions[name], `${name} harus mengikuti versi SDK`);
    }
  });

  test('Konfigurasi Android memakai plugin resmi dan mempertahankan ABI 32-bit', () => {
    const appJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'app.json'), 'utf8'));
    const buildProperties = appJson.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
    );
    assert.equal(appJson.expo.android.package, 'id.wahidiyah.book');
    assert.equal(appJson.expo.android.usesCleartextTraffic, undefined);
    assert.equal(appJson.expo.jsEngine, undefined);
    assert.equal(buildProperties?.[1].android.usesCleartextTraffic, true);
    assert.deepEqual(buildProperties?.[1].android.buildArchs, ['armeabi-v7a', 'arm64-v8a']);
    assert.ok(
      ['ef5df259-9b15-4288-80de-5fdff2510d5a', '504e9a89-a47e-4146-8731-8e31eb35c744'].includes(
        appJson.expo.extra?.eas?.projectId,
      ),
      `Unexpected EAS project ID: ${appJson.expo.extra?.eas?.projectId}`,
    );
  });

  test('Workspace scaffolding files exist', () => {
    assert.ok(fs.existsSync(path.join(rootDir, 'landing-page/index.html')));
    assert.ok(fs.existsSync(path.join(rootDir, 'landing-page/src/main.jsx')));
    assert.ok(fs.existsSync(path.join(rootDir, 'landing-page/src/App.jsx')));

    assert.ok(fs.existsSync(path.join(rootDir, 'admin-dashboard-web/index.html')));
    assert.ok(fs.existsSync(path.join(rootDir, 'admin-dashboard-web/src/main.jsx')));
    assert.ok(fs.existsSync(path.join(rootDir, 'admin-dashboard-web/src/App.jsx')));
  });

  describe('mobile-app/src/api/client.js: buildApiUrl behavior', () => {
    const clientSrc = fs.readFileSync(path.join(rootDir, 'mobile-app/src/api/client.js'), 'utf8');
    const fnMatch = clientSrc.match(/export function buildApiUrl\([\s\S]*?\n\}/);
    assert.ok(fnMatch, 'buildApiUrl function definition must be found');
    const buildApiUrl = new Function(
      `${fnMatch[0].replace('export function buildApiUrl', 'return function buildApiUrl')}`,
    )();

    test('Prevents duplicate /api/api when baseUrl ends with /api and endpoint starts with /api/', () => {
      const url = buildApiUrl('http://10.0.2.2:5000/api', '/api/books');
      assert.equal(url, 'http://10.0.2.2:5000/api/books');
    });

    test('Adds /api when baseUrl does not end with /api and endpoint does not start with /api/', () => {
      const url = buildApiUrl('http://localhost:5000', '/books');
      assert.equal(url, 'http://localhost:5000/api/books');
    });

    test('Handles endpoint without leading slash', () => {
      const url = buildApiUrl('http://10.0.2.2:5000/api', 'books');
      assert.equal(url, 'http://10.0.2.2:5000/api/books');
    });

    test('Handles baseUrl with trailing slash', () => {
      const url = buildApiUrl('http://10.0.2.2:5000/api/', '/books');
      assert.equal(url, 'http://10.0.2.2:5000/api/books');
    });

    test('Client default port is 5000 and not 3001', () => {
      const constantsSrc = fs.readFileSync(
        path.join(rootDir, 'mobile-app/src/config/constants.js'),
        'utf8',
      );
      assert.ok(constantsSrc.includes(':5000/api'), 'Default API URL must use port 5000');
      assert.ok(!constantsSrc.includes(':3001'), 'Must not reference port 3001');
      assert.ok(
        !clientSrc.includes('Platform.select'),
        'client.js must read the default origin from API_CONFIG instead of redefining it',
      );
      assert.ok(!clientSrc.includes(':3001'), 'Must not reference port 3001');
    });

    test('Client supports expo-secure-store with fallback to AsyncStorage', () => {
      assert.ok(clientSrc.includes('expo-secure-store'), 'Must attempt expo-secure-store import');
      assert.ok(clientSrc.includes('AsyncStorage.getItem'), 'Must fallback to AsyncStorage');
    });
  });
});
