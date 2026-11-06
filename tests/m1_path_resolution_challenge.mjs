import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

function runPathResolutionAudit() {
  console.log('--- CHALLENGER: JSCONFIG & BUNDLER PATH ALIAS AUDIT ---');

  const jsconfigPath = path.resolve('jsconfig.json');
  assert(fs.existsSync(jsconfigPath), 'jsconfig.json must exist');

  const jsconfig = JSON.parse(fs.readFileSync(jsconfigPath, 'utf8'));
  const paths = jsconfig.compilerOptions?.paths;
  assert(paths, 'compilerOptions.paths must be defined in jsconfig.json');

  const requiredAliases = ['@/*', '@features/*', '@ui/*', '@lib/*', '@shared/*'];
  for (const alias of requiredAliases) {
    assert(paths[alias], `jsconfig.json missing required alias pattern: ${alias}`);
    console.log(`- Confirmed alias in jsconfig.json: ${alias} -> ${JSON.stringify(paths[alias])}`);
  }

  // Check that every directory pointed to by paths exists or will exist
  const baseDir = process.cwd();
  for (const [alias, mappings] of Object.entries(paths)) {
    for (const mapping of mappings) {
      const cleanPath = mapping.replace(/\/\*$/, '');
      const absPath = path.resolve(baseDir, cleanPath);
      // If it exists, log success
      const exists = fs.existsSync(absPath);
      console.log(`  Path mapping '${alias}' -> '${cleanPath}': exists=${exists}`);
    }
  }

  // Test actual resolution against existing project files
  const testCases = [
    { importPath: '@shared/sanitizeHtml.js', expected: 'shared/sanitizeHtml.js' },
    { importPath: '@/App.jsx', expected: 'src/App.jsx' },
    { importPath: '@context/AppContext.jsx', expected: 'src/context/AppContext.jsx' },
    { importPath: '@theme/themeInjector.js', expected: 'src/theme/themeInjector.js' },
  ];

  // Resolver simulation following TS path mapping algorithm
  function resolveWithJsconfig(importSpecifier) {
    for (const [pattern, mappings] of Object.entries(paths)) {
      const prefix = pattern.replace(/\*$/, '');
      if (importSpecifier.startsWith(prefix)) {
        const subpath = importSpecifier.slice(prefix.length);
        for (const mapping of mappings) {
          const candidate = mapping.replace(/\*$/, subpath);
          const resolvedPath = path.resolve(baseDir, candidate);
          if (fs.existsSync(resolvedPath)) {
            return path.relative(baseDir, resolvedPath).replace(/\\/g, '/');
          }
        }
      }
    }
    return null;
  }

  for (const tc of testCases) {
    const resolved = resolveWithJsconfig(tc.importPath);
    console.log(`Resolution test: ${tc.importPath} -> ${resolved}`);
    assert.strictEqual(resolved, tc.expected, `Resolution failed for ${tc.importPath}`);
  }

  // Verify Vite configurations have matching aliases
  const viteConfigs = [
    { name: 'Root vite.config.js', file: 'vite.config.js', expectedRoot: './src' },
    {
      name: 'Landing vite.config.landing.js',
      file: 'vite.config.landing.js',
      expectedRoot: './landing-page/src',
    },
    {
      name: 'Admin vite.config.admin.js',
      file: 'vite.config.admin.js',
      expectedRoot: './admin-dashboard-web/src',
    },
  ];

  for (const cfg of viteConfigs) {
    const content = fs.readFileSync(path.resolve(cfg.file), 'utf8');
    assert(content.includes("'@':"), `${cfg.name} missing '@' alias`);
    assert(content.includes("'@features':"), `${cfg.name} missing '@features' alias`);
    assert(content.includes("'@ui':"), `${cfg.name} missing '@ui' alias`);
    assert(content.includes("'@lib':"), `${cfg.name} missing '@lib' alias`);
    assert(content.includes("'@shared':"), `${cfg.name} missing '@shared' alias`);
    console.log(
      `✔ ${cfg.name} contains all required bundler aliases: @, @features, @ui, @lib, @shared`,
    );
  }

  console.log('\n✔ Path resolution audit PASSED successfully!');
}

runPathResolutionAudit();
