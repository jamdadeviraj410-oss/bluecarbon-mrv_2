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

process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key-placeholder';

async function main() {
  const { runMrvIntelligenceTests } = await import('./mrv_intelligence.test.js');
  const { runBlockchainProvenanceTests } = await import('./blockchain_provenance.test.js');
  const { runAuthRbacTests } = await import('./auth_rbac_onboarding.test.js');
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
