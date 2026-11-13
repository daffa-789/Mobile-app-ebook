import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load actual .env if present
const envPath = path.join(ROOT_DIR, '.env');
const actualEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath, 'utf8')) : {};

// Helper: recursively find files in a directory
function getFilesRecursively(dir, filterFn) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, filterFn));
    } else if (!filterFn || filterFn(item.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// =========================================================================
// SUITE 1: Git Tracking, .gitignore Security & Single Root .env Architecture
// =========================================================================
test('Challenger Suite 1: Single Root .env Architecture & .gitignore Protection', async (t) => {
  await t.test('1.1 Zero .env.example files exist in the entire repository', () => {
    const allExampleFiles = getFilesRecursively(ROOT_DIR, (name) => {
      return name.includes('.env.example') || (name.includes('.env.') && name.endsWith('.example'));
    });
    assert.deepEqual(
      allExampleFiles,
      [],
      `Expected zero .env.example files under single root .env architecture, found: ${allExampleFiles.join(', ')}`,
    );
  });

  await t.test('1.2 Exactly one .env file exists at root, no duplicates in subfolders', () => {
    assert.ok(
      fs.existsSync(envPath),
      'Root .env must exist for local and production environment configuration',
    );
    const subfolderEnvs = [
      path.join(ROOT_DIR, 'landing-page', '.env'),
      path.join(ROOT_DIR, 'admin-dashboard-web', '.env'),
      path.join(ROOT_DIR, 'mobile-app', '.env'),
      path.join(ROOT_DIR, 'server', '.env'),
    ];
    for (const subEnv of subfolderEnvs) {
      assert.ok(
        !fs.existsSync(subEnv),
        `Subfolder env should not exist under One .env architecture: ${subEnv}`,
      );
    }
  });

  await t.test('1.3 Git check-ignore confirms actual .env files ARE strictly ignored', () => {
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.staging',
      'landing-page/.env',
      'landing-page/.env.production',
      'admin-dashboard-web/.env',
      'admin-dashboard-web/.env.local',
      'mobile-app/.env',
      'server/.env',
      'server/.env.production',
      'deep/nested/subfolder/.env',
    ];

    const cmd = `git check-ignore ${sensitiveFiles.join(' ')}`;
    const output = execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean);

    for (const file of sensitiveFiles) {
      assert.ok(
        output.includes(file),
        `Git must ignore sensitive env file: ${file}. Ignored list was: ${JSON.stringify(output)}`,
      );
    }
  });

  await t.test('1.4 Zero real .env files are tracked in git index', () => {
    const trackedFiles = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean);

    const leakedEnvFiles = trackedFiles.filter((f) => {
      const base = path.basename(f);
      return base.startsWith('.env');
    });

    assert.deepEqual(
      leakedEnvFiles,
      [],
      `No actual .env files should be tracked by git! Leaked: ${leakedEnvFiles.join(', ')}`,
    );
  });
});

// =========================================================================
// SUITE 2: Real Secret Isolation & Single Root .env Integrity
// =========================================================================
test('Challenger Suite 2: Secret Isolation and Single Root .env Configuration', async (t) => {
  // Specific real secrets from local .env that must NEVER appear in tracked files
  const knownSecrets = [
    actualEnv.JWT_SECRET,
    actualEnv.SUPABASE_SECRET_KEY,
    actualEnv.SUPABASE_SERVICE_ROLE_KEY,
    actualEnv.MIDTRANS_SERVER_KEY,
    actualEnv.GMAIL_REFRESH_TOKEN,
    actualEnv.GOOGLE_CLIENT_SECRET,
    actualEnv.FONNTE_TOKEN,
    actualEnv.VAPID_PRIVATE_KEY,
  ].filter((s) => typeof s === 'string' && s.length >= 8);

  await t.test(
    '2.1 None of the known real secret values appear in git-tracked source files',
    () => {
      const trackedFiles = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf8' })
        .split(/\r?\n/)
        .filter(Boolean)
        .filter((f) => /\.(js|jsx|mjs|cjs|ts|tsx|json|html|css|md)$/i.test(f))
        .filter((f) => !f.includes('package-lock.json'));

      for (const relPath of trackedFiles) {
        const fullPath = path.join(ROOT_DIR, relPath);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const secret of knownSecrets) {
          assert.ok(
            !content.includes(secret),
            `Real secret "${secret.substring(0, 6)}..." detected in tracked file ${relPath}!`,
          );
        }
      }
    },
  );

  await t.test(
    '2.2 Root .env contains all essential environment keys required for production',
    () => {
      const essentialKeys = [
        'PORT',
        'JWT_SECRET',
        'SUPABASE_URL',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SECRET_KEY',
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'MIDTRANS_SERVER_KEY',
        'MIDTRANS_CLIENT_KEY',
        'WHATSAPP_PROVIDER',
        'FONNTE_TOKEN',
        'VAPID_PUBLIC_KEY',
        'VAPID_PRIVATE_KEY',
      ];

      for (const key of essentialKeys) {
        assert.ok(
          actualEnv[key] && String(actualEnv[key]).trim().length > 0,
          `Root .env must define essential key: ${key}`,
        );
      }
    },
  );

  await t.test('2.3 Vite configurations direct env loading to root directory', () => {
    const adminVite = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.admin.js'), 'utf8');
    const landingVite = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.landing.js'), 'utf8');
    assert.ok(
      adminVite.includes('envDir:'),
      'vite.config.admin.js must specify envDir pointing to root',
    );
    assert.ok(
      landingVite.includes('envDir:'),
      'vite.config.landing.js must specify envDir pointing to root',
    );
  });
});

// =========================================================================
// SUITE 3: Deep Scan of Production Bundles (dist/) for Secret Leakage
// =========================================================================
test('Challenger Suite 3: Deep Secret Leakage Scan in Client Bundles (dist/)', async (t) => {
  const distDir = path.join(ROOT_DIR, 'dist');
  assert.ok(fs.existsSync(distDir), 'dist/ directory must exist (run builds first)');

  // Collect all built files (HTML, JS, CSS, JSON, TXT)
  const bundleFiles = getFilesRecursively(distDir, (name) => {
    return /\.(js|mjs|cjs|html|css|json|txt|map)$/i.test(name);
  });

  assert.ok(
    bundleFiles.length >= 5,
    `Expected at least 5 bundle files in dist, found ${bundleFiles.length}`,
  );

  // Known secret strings from local .env
  const dangerousLiteralValues = [
    actualEnv.JWT_SECRET,
    actualEnv.SUPABASE_SECRET_KEY,
    actualEnv.SUPABASE_SERVICE_ROLE_KEY,
    actualEnv.MIDTRANS_SERVER_KEY,
    actualEnv.GMAIL_REFRESH_TOKEN,
    actualEnv.GOOGLE_CLIENT_SECRET,
    actualEnv.FONNTE_TOKEN,
    actualEnv.VAPID_PRIVATE_KEY,
  ].filter((s) => typeof s === 'string' && s.length >= 8);

  // Dangerous variable names that should never be bundled into frontend client code
  const dangerousVarNames = [
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'MIDTRANS_SERVER_KEY',
    'GMAIL_REFRESH_TOKEN',
    'GOOGLE_CLIENT_SECRET',
    'FONNTE_TOKEN',
    'VAPID_PRIVATE_KEY',
    'CRON_SECRET',
  ];

  await t.test('3.1 No actual backend secret literal values leaked into any dist/ bundle', () => {
    const leaks = [];

    for (const file of bundleFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const secret of dangerousLiteralValues) {
        if (content.includes(secret)) {
          leaks.push({
            file: path.relative(ROOT_DIR, file),
            secretPrefix: secret.substring(0, 8) + '...',
          });
        }
      }
    }

    assert.deepEqual(leaks, [], `Leaked real secrets in client bundles: ${JSON.stringify(leaks)}`);
  });

  await t.test('3.2 No backend secret variable names appear in client bundles', () => {
    const nameLeaks = [];

    for (const file of bundleFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const varName of dangerousVarNames) {
        if (content.includes(varName)) {
          nameLeaks.push({
            file: path.relative(ROOT_DIR, file),
            variable: varName,
          });
        }
      }
    }

    assert.deepEqual(
      nameLeaks,
      [],
      `Backend secret variable names found in dist: ${JSON.stringify(nameLeaks)}`,
    );
  });

  await t.test('3.3 No PEM or RSA private keys embedded in dist/', () => {
    const keyMarkers = [
      '-----BEGIN RSA PRIVATE KEY-----',
      '-----BEGIN PRIVATE KEY-----',
      '-----BEGIN EC PRIVATE KEY-----',
      '-----BEGIN OPENSSH PRIVATE KEY-----',
    ];

    const keyLeaks = [];
    for (const file of bundleFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const marker of keyMarkers) {
        if (content.includes(marker)) {
          keyLeaks.push({ file: path.relative(ROOT_DIR, file), marker });
        }
      }
    }

    assert.deepEqual(
      keyLeaks,
      [],
      `Private key markers found in dist: ${JSON.stringify(keyLeaks)}`,
    );
  });
});

// =========================================================================
// SUITE 4: Dynamic APK Download URL Propagation & Remnant Elimination
// =========================================================================
test('Challenger Suite 4: Dynamic APK Download URL Propagation Across Landing UI', async (t) => {
  const landingComponentsDir = path.join(ROOT_DIR, 'landing-page', 'src', 'components');
  const targetUiFiles = [
    path.join(landingComponentsDir, 'layout', 'LandingNavbar.jsx'),
    path.join(landingComponentsDir, 'sections', 'HeroSection.jsx'),
    path.join(landingComponentsDir, 'sections', 'PreviewSection.jsx'),
  ];

  await t.test('4.1 All 3 target UI components import APK_DOWNLOAD_URL from constants', () => {
    for (const filePath of targetUiFiles) {
      assert.ok(fs.existsSync(filePath), `File must exist: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(
        content.includes('import { APK_DOWNLOAD_URL }') || content.includes('APK_DOWNLOAD_URL'),
        `${path.basename(filePath)} must import APK_DOWNLOAD_URL`,
      );
    }
  });

  await t.test(
    '4.2 Zero hardcoded https://expo.dev/ artifacts links remain in landing-page components',
    () => {
      const allLandingComponents = getFilesRecursively(landingComponentsDir, (name) =>
        name.endsWith('.jsx'),
      );
      const hardcodedLinks = [];

      for (const file of allLandingComponents) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('https://expo.dev/artifacts/eas/')) {
          hardcodedLinks.push(path.relative(ROOT_DIR, file));
        }
      }

      assert.deepEqual(
        hardcodedLinks,
        [],
        `Hardcoded APK URL still found in component files: ${hardcodedLinks.join(', ')}`,
      );
    },
  );

  await t.test(
    '4.3 Dynamic APK URL compilation test: custom VITE_APK_DOWNLOAD_URL overrides bundle output',
    () => {
      const TEST_OVERRIDE_URL =
        'https://custom-storage.wahidiyah.org/releases/wahidiyah-test-override-v999.apk';
      const tempOutDir = path.join(ROOT_DIR, 'dist', 'test-dynamic-apk');

      // Run custom landing build with overridden VITE_APK_DOWNLOAD_URL
      const buildCmd = `npx vite build --config vite.config.landing.js --outDir "${tempOutDir}"`;
      execSync(buildCmd, {
        cwd: ROOT_DIR,
        env: {
          ...process.env,
          VITE_APK_DOWNLOAD_URL: TEST_OVERRIDE_URL,
        },
        encoding: 'utf8',
      });

      assert.ok(fs.existsSync(tempOutDir), 'Temporary test build output directory must exist');

      const testAssets = getFilesRecursively(path.join(tempOutDir, 'assets'), (name) =>
        name.endsWith('.js'),
      );
      let foundOverrideCount = 0;
      let compiledWithFallback = false;
      const DEFAULT_APK_URL = '/unduh/wahidiyah-v0.1.8-hermes-32bit.apk';

      for (const jsFile of testAssets) {
        const content = fs.readFileSync(jsFile, 'utf8');
        if (content.includes(TEST_OVERRIDE_URL)) {
          foundOverrideCount++;
        }
        if (content.includes(DEFAULT_APK_URL)) {
          compiledWithFallback = true;
        }
      }

      // Cleanup tempOutDir
      try {
        fs.rmSync(tempOutDir, { recursive: true, force: true });
      } catch (_) {}

      assert.ok(
        foundOverrideCount > 0,
        `Custom APK download URL "${TEST_OVERRIDE_URL}" was NOT compiled into landing bundle!`,
      );
      assert.ok(
        compiledWithFallback,
        'Bundle must maintain the safety fallback default URL when environment variables are unset',
      );
    },
  );
});

// =========================================================================
// SUITE 5: Mobile App Network Timeout & AbortController Robustness
// =========================================================================
test('Challenger Suite 5: Mobile Client Timeout & Port Automation Resilience', async (t) => {
  await t.test('5.1 Mobile client.js handles request timeouts via AbortController', () => {
    const clientPath = path.join(ROOT_DIR, 'mobile-app', 'src', 'api', 'client.js');
    assert.ok(fs.existsSync(clientPath), 'mobile-app/src/api/client.js must exist');
    const content = fs.readFileSync(clientPath, 'utf8');

    assert.ok(content.includes('AbortController'), 'client.js must use AbortController');
    assert.ok(content.includes('setTimeout'), 'client.js must configure a timeout mechanism');
    assert.ok(
      content.includes('clearTimeout'),
      'client.js must cleanup timeout timer in finally block',
    );
    assert.ok(content.includes('API_TIMEOUT_MS'), 'client.js must utilize API_TIMEOUT_MS constant');
    assert.ok(content.includes('AbortError'), 'client.js must catch AbortError');
  });

  await t.test('5.2 Port cleanup script targets all 4 core development ports', () => {
    const cleanPortsPath = path.join(ROOT_DIR, 'scripts', 'clean-ports.js');
    assert.ok(fs.existsSync(cleanPortsPath), 'scripts/clean-ports.js must exist');
    const content = fs.readFileSync(cleanPortsPath, 'utf8');

    // Must target 3000 (Landing/PWA), 5000 (Server), 3001 (Admin Dashboard), 8081 (Metro Bundler)
    assert.ok(content.includes('3000'), 'Must target port 3000');
    assert.ok(content.includes('5000'), 'Must target port 5000');
    assert.ok(content.includes('3001'), 'Must target port 3001');
    assert.ok(content.includes('8081'), 'Must target port 8081');
  });
});
