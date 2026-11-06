/**
 * @file tests/e2e/run_all.mjs
 * @description Master E2E Test Suite Runner for the Wahidiyah Book monorepo project.
 * Discovers and executes all 4 test tiers, aggregates metrics, and enforces 100% pass threshold.
 */

import { runTier1 } from './tier1_feature_coverage.test.mjs';
import { runTier2 } from './tier2_boundary_corner.test.mjs';
import { runTier3 } from './tier3_cross_feature.test.mjs';
import { runTier4 } from './tier4_real_world_scenarios.test.mjs';
import { colors } from './helpers/testHelpers.mjs';

async function main() {
  const globalStart = Date.now();

  console.log(
    `\n${colors.bold}${colors.magenta}================================================================${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.magenta}   WAHIDIYAH BOOK MONOREPO — END-TO-END AUTOMATED TEST SUITE   ${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.magenta}================================================================${colors.reset}\n`,
  );

  const results = [];

  // Execute Tier 1
  results.push(await runTier1());

  // Execute Tier 2
  results.push(await runTier2());

  // Execute Tier 3
  results.push(await runTier3());

  // Execute Tier 4
  results.push(await runTier4());

  const globalDuration = Date.now() - globalStart;

  console.log(
    `${colors.bold}${colors.cyan}================================================================${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}                      FINAL TEST REPORT                         ${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}================================================================${colors.reset}\n`,
  );

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const r of results) {
    totalTests += r.total;
    totalPassed += r.passed;
    totalFailed += r.failed;
    const statusIcon =
      r.failed === 0 ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(
      `  [${statusIcon}] ${colors.bold}${r.suiteName}${colors.reset}: ${colors.green}${r.passed}/${r.total} passed${colors.reset} ${colors.dim}(${r.duration}ms)${colors.reset}`,
    );
  }

  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`  Total Test Cases : ${colors.bold}${totalTests}${colors.reset}`);
  console.log(`  Passed           : ${colors.green}${colors.bold}${totalPassed}${colors.reset}`);
  console.log(
    `  Failed           : ${totalFailed > 0 ? colors.red : colors.green}${colors.bold}${totalFailed}${colors.reset}`,
  );
  console.log(
    `  Total Duration   : ${colors.dim}${globalDuration}ms (${(globalDuration / 1000).toFixed(2)}s)${colors.reset}\n`,
  );

  if (totalFailed > 0) {
    console.log(
      `${colors.bold}${colors.red}❌ E2E TEST SUITE FAILED (${totalFailed} failures).${colors.reset}\n`,
    );
    process.exit(1);
  } else {
    console.log(
      `${colors.bold}${colors.green}🎉 ALL TIERS PASSED PERFECTLY (100% SUCCESS RATE)!${colors.reset}\n`,
    );
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\nFatal error during test runner execution:', err);
  process.exit(1);
});
