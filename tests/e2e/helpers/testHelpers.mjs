/**
 * @file tests/e2e/helpers/testHelpers.mjs
 * @description Assertion, mock, and test reporting utilities for the Wahidiyah Book E2E test suite.
 */

import fs from 'fs';
import path from 'path';
import assert from 'node:assert';

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

export function createMinimalPdfBuffer() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

export function createCorruptedPdfBuffer() {
  return Buffer.from('NOT_A_VALID_PDF_HEADER_DATA_CORRUPT', 'utf-8');
}

export function createLargeBuffer(sizeInBytes) {
  const buf = Buffer.alloc(sizeInBytes);
  buf.write('%PDF-1.4 header for large buffer testing', 0);
  return buf;
}

/**
 * Validates that no nested package.json or node_modules exist inside workspace dirs.
 * @param {string} rootDir
 */
export function checkMonorepoIntegrity(rootDir) {
  const violations = [];
  const workspaces = ['landing-page', 'admin-dashboard-web', 'mobile-app'];

  for (const ws of workspaces) {
    const wsPath = path.resolve(rootDir, ws);
    if (!fs.existsSync(wsPath)) continue;

    const nestedPkg = path.join(wsPath, 'package.json');
    if (fs.existsSync(nestedPkg)) {
      violations.push(`Found forbidden nested package.json in ${ws}`);
    }

    const nestedModules = path.join(wsPath, 'node_modules');
    if (fs.existsSync(nestedModules)) {
      violations.push(`Found forbidden nested node_modules in ${ws}`);
    }
  }

  const rootPkg = path.resolve(rootDir, 'package.json');
  if (!fs.existsSync(rootPkg)) {
    violations.push('Missing required root package.json');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Test Suite Runner abstraction.
 * @param {string} suiteName
 */
export function createTestSuite(suiteName) {
  const tests = [];

  function test(name, fn) {
    tests.push({ name, fn });
  }

  async function run() {
    console.log(`\n${colors.bold}${colors.cyan}▶ RUNNING SUITE: ${suiteName}${colors.reset}`);
    let passed = 0;
    let failed = 0;
    const failures = [];
    const startTime = Date.now();

    for (const t of tests) {
      const tStart = Date.now();
      try {
        await t.fn();
        const duration = Date.now() - tStart;
        passed++;
        console.log(
          `  ${colors.green}✔${colors.reset} ${t.name} ${colors.dim}(${duration}ms)${colors.reset}`,
        );
      } catch (err) {
        const duration = Date.now() - tStart;
        failed++;
        failures.push({ name: t.name, error: err });
        console.log(
          `  ${colors.red}✖${colors.reset} ${colors.bold}${t.name}${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`,
        );
        console.log(`    ${colors.red}${err.message}${colors.reset}`);
        if (err.stack && !err.message.includes('AssertionError')) {
          console.log(
            `    ${colors.dim}${err.stack.split('\n').slice(1, 4).join('\n    ')}${colors.reset}`,
          );
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(
      `${colors.bold}${failed === 0 ? colors.green : colors.red}` +
        `\n--- Result for ${suiteName}: ${passed}/${tests.length} Passed (${totalDuration}ms) ---${colors.reset}\n`,
    );

    return {
      suiteName,
      total: tests.length,
      passed,
      failed,
      duration: totalDuration,
      failures,
    };
  }

  return { test, run };
}

export { assert };
