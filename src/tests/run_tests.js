/* global process */
import fs from 'node:fs';
import path from 'node:path';

// Automatically load local .env if present during testing
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.resolve('.env'))) {
    process.loadEnvFile();
  }
} catch {
  // Continue if .env is absent in CI
}

import { runMrvIntelligenceTests } from './mrv_intelligence.test.js';
import { runBlockchainProvenanceTests } from './blockchain_provenance.test.js';
import { runAuthRbacTests } from './auth_rbac_onboarding.test.js';

async function main() {
  console.log('==================================================');
  console.log('    BLUECARBON MRV COMPREHENSIVE TEST SUITE       ');
  console.log('==================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;

  // 1. MRV Intelligence Tests
  console.log('--- 1. MRV INTELLIGENCE & SENSORS & OCR SUITE ---');
  try {
    const results1 = await runMrvIntelligenceTests();
    results1.forEach((r, idx) => {
      if (r.passed) {
        console.log(`  [PASS] 1.${idx + 1} ${r.name}`);
        totalPassed++;
      } else {
        console.error(`  [FAIL] 1.${idx + 1} ${r.name} - ${r.error}`);
        totalFailed++;
      }
    });
  } catch (err) {
    console.error('  [ERROR] MRV Intelligence tests failed with exception:', err);
    totalFailed++;
  }

  // 2. Blockchain Provenance Tests
  console.log('\n--- 2. BLOCKCHAIN PROVENANCE & CANONICAL HASH SUITE ---');
  try {
    const results2 = await runBlockchainProvenanceTests();
    results2.forEach((r, idx) => {
      if (r.passed) {
        console.log(`  [PASS] 2.${idx + 1} ${r.name}`);
        totalPassed++;
      } else {
        console.error(`  [FAIL] 2.${idx + 1} ${r.name} - ${r.error}`);
        totalFailed++;
      }
    });
  } catch (err) {
    console.error('  [ERROR] Blockchain provenance tests failed with exception:', err);
    totalFailed++;
  }

  // 3. Auth, RBAC & Onboarding Tests
  console.log('\n--- 3. AUTHENTICATION, RBAC & ONBOARDING SUITE ---');
  try {
    const results3 = await runAuthRbacTests();
    results3.forEach((r, idx) => {
      if (r.passed) {
        console.log(`  [PASS] 3.${idx + 1} ${r.name}`);
        totalPassed++;
      } else {
        console.error(`  [FAIL] 3.${idx + 1} ${r.name} - ${r.error}`);
        totalFailed++;
      }
    });
  } catch (err) {
    console.error('  [ERROR] Auth & RBAC tests failed with exception:', err);
    totalFailed++;
  }

  console.log('\n==================================================');
  console.log(`OVERALL TEST SUMMARY: ${totalPassed} passed, ${totalFailed} failed (${totalPassed + totalFailed} total)`);
  console.log('==================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
