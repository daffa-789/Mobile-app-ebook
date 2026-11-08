import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

test('Challenger 2 Suite: Milestone 1 Monorepo Stress & Boundary Verification', async (t) => {
  await t.test('1. Expo & EAS Configuration Integrity', () => {
    const rawExpoConfig = execSync('npx expo config --json', { encoding: 'utf8' });
    const config = JSON.parse(rawExpoConfig);

    // 1.1 EAS Project ID check
    assert.strictEqual(
      config.extra?.eas?.projectId,
      'ef5df259-9b15-4288-80de-5fdff2510d5a',
      'extra.eas.projectId must match production EAS project ID',
    );

    // 1.2 Android package & CleartextTraffic
    assert.strictEqual(
      config.android?.package,
      'id.wahidiyah.book',
      'android.package must be id.wahidiyah.book',
    );
    assert.strictEqual(
      config.android?.usesCleartextTraffic,
      true,
      'android.usesCleartextTraffic must be true for local HTTP emulator testing',
    );

    // 1.3 Asset paths referenced in app.json must physically exist on disk
    const assets = [
      config.icon,
      config.android?.adaptiveIcon?.foregroundImage,
      config.android?.adaptiveIcon?.backgroundImage,
      config.android?.adaptiveIcon?.monochromeImage,
      config.web?.favicon,
    ].filter(Boolean);

    for (const assetPath of assets) {
      const fullPath = path.resolve(assetPath);
      assert.ok(fs.existsSync(fullPath), `Asset path ${assetPath} in app.json must exist on disk`);
    }
  });

  await t.test('2. Tailwind CSS v4 Class Compilation & Design Tokens', () => {
    const landingCssFile = fs.readdirSync('dist/landing/assets').find((f) => f.endsWith('.css'));
    const adminCssFile = fs.readdirSync('dist/admin/assets').find((f) => f.endsWith('.css'));

    assert.ok(landingCssFile, 'Landing CSS bundle must exist in dist/landing/assets');
    assert.ok(adminCssFile, 'Admin CSS bundle must exist in dist/admin/assets');

    const landingCss = fs.readFileSync(path.join('dist/landing/assets', landingCssFile), 'utf8');
    const adminCss = fs.readFileSync(path.join('dist/admin/assets', adminCssFile), 'utf8');

    function extractClasses(filePath) {
      const content = fs.readFileSync(path.resolve(filePath), 'utf8');
      const regex = /className=["']([^"']+)["']/g;
      const classes = new Set();
      let match;
      while ((match = regex.exec(content)) !== null) {
        match[1]
          .split(/\s+/)
          .filter(Boolean)
          .forEach((cls) => classes.add(cls));
      }
      return Array.from(classes);
    }

    const landingClasses = extractClasses('landing-page/src/App.jsx');
    const adminClasses = extractClasses('admin-dashboard-web/src/App.jsx');

    // M1 menghapus 80+ berkas legacy dan M3 memindahkan shell dashboard ke
    // komponen khusus. App.jsx kini sengaja ramping: yang diuji adalah keberadaan
    // kelas styling, bukan jumlah absolutnya.
    assert.ok(landingClasses.length >= 4, 'Landing page shell must use styling classes');
    assert.ok(adminClasses.length >= 4, 'Admin dashboard shell must use styling classes');
    for (const shell of [
      'admin-dashboard-web/src/features/admin/components/AdminSidebar.jsx',
      'admin-dashboard-web/src/features/admin/components/AdminHeader.jsx',
      'admin-dashboard-web/src/features/admin/components/StatCard.jsx',
    ]) {
      assert.ok(fs.existsSync(path.resolve(shell)), `${shell} must exist`);
    }

    for (const cls of landingClasses) {
      const escaped = cls.replace(/([:.[\]/])/g, '\\$1');
      const pattern = new RegExp(`\\.${escaped.replace(/\\/g, '\\\\')}(?=[^a-zA-Z0-9_-]|$)`);
      assert.ok(
        pattern.test(landingCss) || landingCss.includes(escaped),
        `Class '${cls}' from landing-page/src/App.jsx must be compiled into landing CSS bundle`,
      );
    }

    for (const cls of adminClasses) {
      const escaped = cls.replace(/([:.[\]/])/g, '\\$1');
      const pattern = new RegExp(`\\.${escaped.replace(/\\/g, '\\\\')}(?=[^a-zA-Z0-9_-]|$)`);
      assert.ok(
        pattern.test(adminCss) || adminCss.includes(escaped),
        `Class '${cls}' from admin-dashboard-web/src/App.jsx must be compiled into admin CSS bundle`,
      );
    }

    // Custom design tokens check
    const requiredTokens = [
      'bg-cream-50',
      'text-brand-900',
      'rounded-btn',
      'rounded-card',
      'bg-gold-500',
    ];
    for (const token of requiredTokens) {
      const escaped = token.replace(/([:.[\]/])/g, '\\$1');
      assert.ok(
        landingCss.includes(escaped) || adminCss.includes(escaped),
        `Design token class '${token}' must be present in compiled CSS`,
      );
    }
  });

  await t.test('3. jsconfig.json & Bundler Path Aliases Resolution', () => {
    const jsconfig = JSON.parse(fs.readFileSync('jsconfig.json', 'utf8'));
    const paths = jsconfig.compilerOptions.paths;

    const expectedAliases = ['@/*', '@features/*', '@ui/*', '@lib/*', '@shared/*'];
    for (const alias of expectedAliases) {
      assert.ok(paths[alias], `jsconfig.json must define ${alias}`);
    }

    // Verify existing files resolve through aliases
    const sharedFile = path.resolve('shared/sanitizeHtml.js');
    assert.ok(fs.existsSync(sharedFile), 'shared/sanitizeHtml.js must exist for @shared alias');

    const appFile = path.resolve('src/App.jsx');
    assert.ok(fs.existsSync(appFile), 'src/App.jsx must exist for @ alias');

    // Setiap config Vite hanya boleh membawa alias yang benar-benar dipakai
    // aplikasinya; alias mati menyembunyikan import yang sudah tidak ada.
    const expectedViteAliases = {
      'vite.config.js': ['@', '@features', '@ui', '@lib', '@data', '@context', '@theme', '@shared'],
      'vite.config.landing.js': ['@'],
      'vite.config.admin.js': ['@', '@ui', '@lib', '@data', '@context'],
    };

    for (const [viteFile, aliases] of Object.entries(expectedViteAliases)) {
      const content = fs.readFileSync(viteFile, 'utf8');
      for (const alias of aliases) {
        assert.ok(content.includes(`'${alias}':`), `${viteFile} missing ${alias} alias`);
      }
    }

    assert.ok(
      !fs.readFileSync('vite.config.landing.js', 'utf8').includes("'@features':"),
      'vite.config.landing.js must not keep the dead @features alias',
    );
    assert.ok(
      !fs.readFileSync('vite.config.admin.js', 'utf8').includes("'@shared':"),
      'vite.config.admin.js must not keep the dead @shared alias',
    );
  });

  await t.test('4. Build Pipeline Artifacts Validity', () => {
    const distHtml = fs.readFileSync('dist/index.html', 'utf8');
    const landingHtml = fs.readFileSync('dist/landing/index.html', 'utf8');
    const adminHtml = fs.readFileSync('dist/admin/index.html', 'utf8');

    assert.ok(/<!doctype html>/i.test(distHtml), 'dist/index.html must be valid HTML');
    assert.ok(/<!doctype html>/i.test(landingHtml), 'dist/landing/index.html must be valid HTML');
    assert.ok(/<!doctype html>/i.test(adminHtml), 'dist/admin/index.html must be valid HTML');

    // Verify HTML entry points link to assets
    assert.ok(
      landingHtml.includes('<script type="module"'),
      'dist/landing/index.html must link to module script',
    );
    assert.ok(
      adminHtml.includes('<script type="module"'),
      'dist/admin/index.html must link to module script',
    );
  });

  await t.test('5. Mobile API Client buildApiUrl Boundary & Adversarial Cases', () => {
    const clientSrc = fs.readFileSync('mobile-app/src/api/client.js', 'utf8');
    const fnMatch = clientSrc.match(/export function buildApiUrl\([\s\S]*?\n\}/);
    assert.ok(fnMatch, 'buildApiUrl function definition must be found');
    const buildApiUrl = new Function(
      `${fnMatch[0].replace('export function buildApiUrl', 'return function buildApiUrl')}`,
    )();

    // 5.1 Standard case
    assert.strictEqual(
      buildApiUrl('http://localhost:5000/api', '/books'),
      'http://localhost:5000/api/books',
    );

    // 5.2 Duplicate /api in endpoint
    assert.strictEqual(
      buildApiUrl('http://localhost:5000/api', '/api/books'),
      'http://localhost:5000/api/books',
    );

    // 5.3 Missing /api in base and endpoint
    assert.strictEqual(
      buildApiUrl('http://localhost:5000', '/books'),
      'http://localhost:5000/api/books',
    );

    // 5.4 Endpoint without leading slash
    assert.strictEqual(
      buildApiUrl('http://localhost:5000/api', 'books'),
      'http://localhost:5000/api/books',
    );

    // 5.5 Endpoint with query parameters
    assert.strictEqual(
      buildApiUrl('http://localhost:5000/api', '/books?limit=10&page=1'),
      'http://localhost:5000/api/books?limit=10&page=1',
    );
    assert.strictEqual(
      buildApiUrl('http://localhost:5000/api', '/api/books?limit=10&page=1'),
      'http://localhost:5000/api/books?limit=10&page=1',
    );

    // 5.6 BaseUrl with trailing slashes
    assert.strictEqual(
      buildApiUrl('http://localhost:5000/api///', '/books'),
      'http://localhost:5000/api/books',
    );

    // 5.7 Empty baseUrl fallback
    assert.strictEqual(buildApiUrl('', '/books'), '/api/books');
  });

  await t.test('6. Monorepo Single Root Invariant & Backend Purity', () => {
    // Check for any rogue package.json outside root
    const allPackageJsons = execSync(
      'pwsh -Command "Get-ChildItem -Recurse -Filter package.json | Where-Object { $_.FullName -notmatch \'node_modules\' } | ForEach-Object { $_.FullName }"',
      { encoding: 'utf8' },
    )
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

    assert.strictEqual(
      allPackageJsons.length,
      1,
      `Expected exactly 1 package.json at root, found: ${allPackageJsons.join(', ')}`,
    );

    // Check for any rogue node_modules outside root
    const allNodeModules = execSync(
      'pwsh -Command "Get-ChildItem -Recurse -Filter node_modules -Directory | Where-Object { $_.FullName -notmatch \'\\\\node_modules\\\\\' -and $_.FullName -ne \\"$PWD\\node_modules\\" } | ForEach-Object { $_.FullName }"',
      { encoding: 'utf8' },
    )
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

    assert.strictEqual(
      allNodeModules.length,
      0,
      `Expected zero nested node_modules directories, found: ${allNodeModules.join(', ')}`,
    );

    // Check git status of server/ directory - must be 100% pristine
    const serverGitStatus = execSync('git status --porcelain server/', {
      encoding: 'utf8',
    }).trim();
    assert.strictEqual(
      serverGitStatus,
      '',
      `server/ directory must remain 100% untouched, but git status reported: ${serverGitStatus}`,
    );
  });
});
