import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

function runTailwindCompilationCheck() {
  console.log('--- CHALLENGER: TAILWIND V4 CLASS COMPILATION AUDIT ---');

  const landingAssetsDir = path.resolve('dist/landing/assets');
  const adminAssetsDir = path.resolve('dist/admin/assets');

  assert(
    fs.existsSync(landingAssetsDir),
    'dist/landing/assets must exist. Run npm run build:landing first.',
  );
  assert(
    fs.existsSync(adminAssetsDir),
    'dist/admin/assets must exist. Run npm run build:admin first.',
  );

  const landingCssFile = fs.readdirSync(landingAssetsDir).find((f) => f.endsWith('.css'));
  const adminCssFile = fs.readdirSync(adminAssetsDir).find((f) => f.endsWith('.css'));

  assert(landingCssFile, 'No CSS bundle found in dist/landing/assets');
  assert(adminCssFile, 'No CSS bundle found in dist/admin/assets');

  const landingCss = fs.readFileSync(path.join(landingAssetsDir, landingCssFile), 'utf8');
  const adminCss = fs.readFileSync(path.join(adminAssetsDir, adminCssFile), 'utf8');

  console.log(`Landing CSS bundle: ${landingCssFile} (${landingCss.length} bytes)`);
  console.log(`Admin CSS bundle: ${adminCssFile} (${adminCss.length} bytes)`);

  function extractClassesFromJsx(filePath) {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    const regex = /className=["']([^"']+)["']/g;
    const classes = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
      const parts = match[1].split(/\s+/).filter(Boolean);
      for (const p of parts) {
        classes.add(p);
      }
    }
    return Array.from(classes);
  }

  function verifyClassesInCss(appName, classes, cssContent) {
    console.log(`\nVerifying ${appName} (${classes.length} unique classes)...`);
    const missing = [];
    const matched = [];

    for (const cls of classes) {
      // In CSS, characters like ':', '[', ']', '.', '/' are escaped with a backslash
      // e.g. 'sm:px-6' -> '\.sm\\:px-6' or '.sm\:px-6'
      // 'text-[10px]' -> '\.text-\\[10px\\]'
      // 'py-0.5' -> '\.py-0\\.5'
      // 'bg-cream-50' -> '\.bg-cream-50'
      const escaped = cls.replace(/([:.[\]/])/g, '\\$1');
      const selectorPattern = new RegExp(
        `\\.${escaped.replace(/\\/g, '\\\\')}(?=[^a-zA-Z0-9_-]|$)`,
      );

      if (selectorPattern.test(cssContent) || cssContent.includes(escaped)) {
        matched.push(cls);
      } else {
        missing.push(cls);
      }
    }

    console.log(`- Matched: ${matched.length}/${classes.length}`);
    if (missing.length > 0) {
      console.error(`- MISSING CLASSES in ${appName}:`, missing);
      return false;
    }
    console.log(`- All classes present in compiled bundle!`);
    return true;
  }

  const landingClasses = extractClassesFromJsx('landing-page/src/App.jsx');
  const adminClasses = extractClassesFromJsx('admin-dashboard-web/src/App.jsx');

  const landingOk = verifyClassesInCss('landing-page/src/App.jsx', landingClasses, landingCss);
  const adminOk = verifyClassesInCss('admin-dashboard-web/src/App.jsx', adminClasses, adminCss);

  assert(landingOk, 'Landing page has missing Tailwind CSS classes');
  assert(adminOk, 'Admin dashboard has missing Tailwind CSS classes');

  // Verify custom theme tokens are compiled correctly
  // e.g., bg-cream-50, text-brand-900, rounded-btn, rounded-card, bg-gold-500
  const customTokens = [
    'bg-cream-50',
    'text-brand-900',
    'rounded-btn',
    'rounded-card',
    'bg-gold-500',
    'text-ink-900',
  ];

  console.log('\nChecking custom token compilation...');
  for (const token of customTokens) {
    const escaped = token.replace(/([:.[\]/])/g, '\\$1');
    const inLanding = landingCss.includes(escaped);
    const inAdmin = adminCss.includes(escaped);
    console.log(`- Token ${token}: landing=${inLanding}, admin=${inAdmin}`);
    assert(inLanding || inAdmin, `Token ${token} should be present in bundles`);
  }

  console.log('\n✔ Tailwind CSS v4 class compilation audit PASSED perfectly!');
}

runTailwindCompilationCheck();
