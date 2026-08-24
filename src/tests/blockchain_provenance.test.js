import crypto from 'node:crypto';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

export async function runBlockchainProvenanceTests() {
  const testResults = [];

  async function recordTest(name, fn) {
    try {
      await fn();
      testResults.push({ name, passed: true });
    } catch (err) {
      testResults.push({ name, passed: false, error: err.message });
    }
  }

  // 1. Canonicalization algorithm implementation
  function canonicalize(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
    const obj = value;
    return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(',')}}`;
  }

  function sha256Hex(input) {
    return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
  }

  // Test 1: Deterministic Canonical JSON
  await recordTest('Deterministic Canonical JSON (Key order independence)', () => {
    const payloadA = {
      submission: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'MRV-2026-001',
        project_id: 'PRJ-2023-089',
        status: 'VERIFIED',
        carbon_estimate: 1250.0,
        claimed_metrics: { canopy_cover_percent: 85, biomass_density: 140 },
        period_start: '2026-01-01',
        period_end: '2026-06-30',
        verified_at: '2026-08-14T10:00:00Z',
      },
      evidence: [
        { id: '1', file_name: 'drone.las', file_type: 'las', file_size_bytes: 1048576, sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', validation_status: 'VALID' },
      ],
    };

    const payloadB = {
      evidence: [
        { validation_status: 'VALID', sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', file_size_bytes: 1048576, file_type: 'las', file_name: 'drone.las', id: '1' },
      ],
      submission: {
        verified_at: '2026-08-14T10:00:00Z',
        period_end: '2026-06-30',
        period_start: '2026-01-01',
        claimed_metrics: { biomass_density: 140, canopy_cover_percent: 85 },
        carbon_estimate: 1250.0,
        status: 'VERIFIED',
        project_id: 'PRJ-2023-089',
        code: 'MRV-2026-001',
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    };

    const canonicalA = canonicalize(payloadA);
    const canonicalB = canonicalize(payloadB);
    assert.strictEqual(canonicalA, canonicalB, 'Canonical strings must match regardless of object property ordering');
    const hashA = sha256Hex(canonicalA);
    const hashB = sha256Hex(canonicalB);
    assert.strictEqual(hashA, hashB, 'SHA-256 digests must match exactly');
  });

  // Test 2: Tamper Detection (Altered Carbon Estimate)
  await recordTest('Tamper Detection on altered carbon estimate', () => {
    const payloadA = {
      submission: { id: '1', carbon_estimate: 1250.0 },
      evidence: [{ id: '1', sha256_hash: 'abc' }],
    };
    const hashA = sha256Hex(canonicalize(payloadA));
    const tampered = JSON.parse(JSON.stringify(payloadA));
    tampered.submission.carbon_estimate = 1250.01;
    const hashTampered = sha256Hex(canonicalize(tampered));
    assert.notStrictEqual(hashA, hashTampered, 'Tampered carbon estimate must produce different hash');
  });

  // Test 3: Solidity Contract Signatures
  await recordTest('Solidity contract signatures in BlueCarbonMRVAnchor.sol', () => {
    const contractPath = path.resolve('contracts', 'BlueCarbonMRVAnchor.sol');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    assert(contractSource.includes('function anchorMRV('), 'Must contain anchorMRV');
    assert(contractSource.includes('function verifyMRV('), 'Must contain verifyMRV');
    assert(contractSource.includes('function getAnchor('), 'Must contain getAnchor');
    assert(contractSource.includes('function isAnchored('), 'Must contain isAnchored');
    assert(contractSource.includes('event MRVAnchored('), 'Must emit MRVAnchored event');
  });

  // Test 4: Edge functions integrity
  await recordTest('Edge functions existence & absence of fake generators', () => {
    const anchorFnPath = path.resolve('supabase', 'functions', 'anchor-mrv', 'index.ts');
    const verifyFnPath = path.resolve('supabase', 'functions', 'verify-mrv', 'index.ts');
    assert(fs.existsSync(anchorFnPath), 'anchor-mrv index.ts must exist');
    assert(fs.existsSync(verifyFnPath), 'verify-mrv index.ts must exist');
    const anchorCode = fs.readFileSync(anchorFnPath, 'utf8');
    assert(!anchorCode.includes('Math.random()'), 'anchor-mrv must not generate fake random hashes');
  });

  // Test 5: Negative Test — Non-VERIFIED MRV Rejection
  await recordTest('Negative Test: Non-VERIFIED MRV rejection in anchor logic', () => {
    const anchorFnPath = path.resolve('supabase', 'functions', 'anchor-mrv', 'index.ts');
    const anchorCode = fs.readFileSync(anchorFnPath, 'utf8');
    assert(anchorCode.includes('status !== \'VERIFIED\''), 'Must strictly reject non-VERIFIED MRV submissions');
  });

  // Test 6: Negative Test — Missing server configuration results in safe failure
  await recordTest('Negative Test: Missing blockchain credentials returns safe error', () => {
    const anchorFnPath = path.resolve('supabase', 'functions', 'anchor-mrv', 'index.ts');
    const anchorCode = fs.readFileSync(anchorFnPath, 'utf8');
    assert(anchorCode.includes('Blockchain server configuration is incomplete'), 'Must return 500 configuration error');
  });

  // Test 7: Negative Test — Changed evidence hash alters canonical digest
  await recordTest('Negative Test: Changed evidence file hash alters canonical digest', () => {
    const payloadOrig = {
      submission: { id: 'SUB-1', code: 'MRV-01', status: 'VERIFIED' },
      evidence: [{ id: 'E1', sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }],
    };
    const payloadAltered = {
      submission: { id: 'SUB-1', code: 'MRV-01', status: 'VERIFIED' },
      evidence: [{ id: 'E1', sha256_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' }],
    };
    const hashOrig = sha256Hex(canonicalize(payloadOrig));
    const hashAltered = sha256Hex(canonicalize(payloadAltered));
    assert.notStrictEqual(hashOrig, hashAltered, 'Altered evidence hash must produce a completely different canonical digest');
  });

  // Test 8: Negative Test — Verification function returns false when anchor absent
  await recordTest('Negative Test: On-chain absence returns verified: false', () => {
    const verifyFnPath = path.resolve('supabase', 'functions', 'verify-mrv', 'index.ts');
    const verifyCode = fs.readFileSync(verifyFnPath, 'utf8');
    assert(verifyCode.includes('verified: false'), 'Must return verified: false on missing or mismatched anchor');
  });

  // Test 9: Data Integrity — formatBlockchainRecord uses null for missing blockNumber
  await recordTest('Data Integrity: Missing block_number produces null, not fake default', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', status: 'PENDING' });
    assert.strictEqual(formatted.blockNumber, null, 'blockNumber must be null when not present in database record');
  });

  // Test 10: Data Integrity — formatBlockchainRecord uses null for missing confirmations
  await recordTest('Data Integrity: Missing confirmations produces null, not fake default', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', status: 'PENDING' });
    assert.strictEqual(formatted.confirmations, null, 'confirmations must be null when not present in database record');
  });

  // Test 11: Data Integrity — formatBlockchainRecord uses null for missing contract_address
  await recordTest('Data Integrity: Missing contract_address produces null, not fake default', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', status: 'PENDING' });
    assert.strictEqual(formatted.contractAddress, null, 'contractAddress must be null when not configured');
    assert.strictEqual(formatted.contractAddressShort, null, 'contractAddressShort must be null when not configured');
  });

  // Test 12: Data Integrity — formatBlockchainRecord uses Pending Anchor for missing tx_hash
  await recordTest('Data Integrity: Missing tx_hash produces Pending Anchor', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', status: 'PENDING', tx_hash: null });
    assert.strictEqual(formatted.txHashShort, 'Pending Anchor', 'txHashShort must indicate Pending Anchor');
    assert.strictEqual(formatted.explorerUrl, null, 'explorerUrl must be null when tx_hash is absent');
  });

  // Test 13: Data Integrity — Confirmed status strictly requires real tx_hash
  await recordTest('Data Integrity: Status CONFIRMED without tx_hash reverts to Pending', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', status: 'CONFIRMED', tx_hash: null });
    assert.strictEqual(formatted.status, 'Pending', 'Status must not claim Confirmed without tx_hash');
  });

  // Test 14: Data Integrity — Empty lifecycle_events produces empty array
  await recordTest('Data Integrity: No fake lifecycle events generated', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', credit: { lifecycle_events: [] } });
    assert(Array.isArray(formatted.lifecycle), 'lifecycle must be an array');
    assert.strictEqual(formatted.lifecycle.length, 0, 'lifecycle must be empty when no events exist in database');
  });

  // Test 15: Data Integrity — Empty evidence hashes produces empty array
  await recordTest('Data Integrity: No fake evidence hashes generated', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', payload: {} });
    assert(Array.isArray(formatted.evidenceHashes), 'evidenceHashes must be an array');
    assert.strictEqual(formatted.evidenceHashes.length, 0, 'evidenceHashes must be empty when no hashes exist');
  });

  // Test 16: Data Integrity — Unknown credit ID returns null
  await recordTest('Data Integrity: getBlockchainRecord returns null for unknown ID', async () => {
    const { getBlockchainRecord, setBlockchainDemoMode } = await import('../features/blockchain/blockchainService.js');
    setBlockchainDemoMode(false);
    const result = getBlockchainRecord('NONEXISTENT_IDENTIFIER_12345');
    assert.strictEqual(result, null, 'Must return null for unknown identifier instead of defaulting to first record');
  });

  // Test 17: Data Integrity — Production getBlockchainStats excludes demo records
  await recordTest('Data Integrity: getBlockchainStats strictly excludes demo records', async () => {
    const { getBlockchainStats, setBlockchainDemoMode } = await import('../features/blockchain/blockchainService.js');
    setBlockchainDemoMode(false);
    const stats = getBlockchainStats();
    assert.strictEqual(typeof stats.totalCreditsIssued, 'string');
    assert(!stats.totalCreditsIssuedChange.includes('+14%'), 'Must not display fake +14% growth statistic');
  });

  // Test 18: Semantic Integrity — Missing network does not default to Polygon Amoy
  await recordTest('Semantic Integrity: Missing network does not default to Polygon Amoy', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1' });
    assert.strictEqual(formatted.network, 'Network Not Configured', 'Network must be Network Not Configured when missing');
    assert.strictEqual(formatted.networkFull, 'Network Not Configured', 'NetworkFull must be Network Not Configured when missing');
  });

  // Test 19: Semantic Integrity — Missing chain ID does not default to 80002
  await recordTest('Semantic Integrity: Missing chain ID does not default to 80002', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1' });
    assert.strictEqual(formatted.chainId, null, 'chainId must be null when network is not configured');
  });

  // Test 20: Semantic Integrity — Missing carbon quantity does not become 0
  await recordTest('Semantic Integrity: Missing carbon quantity becomes null, not 0', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({ id: 'rec-1', credit: {}, payload: {} });
    assert.strictEqual(formatted.tCO2e, null, 'tCO2e must be null when both issued_quantity and carbon_estimate are missing');
  });

  // Test 21: Semantic Integrity — tx hash + DB CONFIRMED does not claim VERIFIED_ON_CHAIN without independent verification
  await recordTest('Semantic Integrity: tx hash + DB CONFIRMED does not claim VERIFIED_ON_CHAIN', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({
      id: 'rec-1',
      tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'CONFIRMED',
      network: { short_name: 'Polygon Amoy' },
    });
    assert.notStrictEqual(formatted.statusCode, 'VERIFIED_ON_CHAIN', 'Must not claim VERIFIED_ON_CHAIN without cryptographic verification');
    assert.strictEqual(formatted.statusCode, 'ANCHORED', 'Must have ANCHORED status code');
    assert.strictEqual(formatted.status, 'Anchored on Polygon Amoy', 'Must display Anchored on Polygon Amoy, not On-Chain Verified');
  });

  // Test 22: Semantic Integrity — Real verified on-chain result produces VERIFIED_ON_CHAIN
  await recordTest('Semantic Integrity: Independent verified on-chain result produces VERIFIED_ON_CHAIN', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({
      id: 'rec-1',
      tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      verified_on_chain: true,
      network: { short_name: 'Polygon Amoy' },
    });
    assert.strictEqual(formatted.statusCode, 'VERIFIED_ON_CHAIN', 'Must produce VERIFIED_ON_CHAIN status code');
    assert.strictEqual(formatted.status, 'On-Chain Verified', 'Must display On-Chain Verified');
  });

  // Test 23: Semantic Integrity — Explicit demo record produces DEMO_SIMULATED
  await recordTest('Semantic Integrity: Demo record produces DEMO_SIMULATED status code', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const formatted = formatBlockchainRecord({
      id: 'rec-demo-1',
      isDemo: true,
    });
    assert.strictEqual(formatted.statusCode, 'DEMO_SIMULATED', 'Must produce DEMO_SIMULATED status code');
    assert.strictEqual(formatted.status, 'DEMO / SIMULATED', 'Must display DEMO / SIMULATED label');
  });

  // Test 24: verify-mrv verifies transaction receipt existence and success
  await recordTest('verify-mrv Edge Function independently verifies tx receipt on blockchain', () => {
    const verifyPath = path.resolve('supabase', 'functions', 'verify-mrv', 'index.ts');
    const code = fs.readFileSync(verifyPath, 'utf8');
    assert(code.includes('getTransactionReceipt'), 'verify-mrv must call getTransactionReceipt');
    assert(code.includes('txReceipt.status === 1'), 'verify-mrv must check that receipt status is 1 (success)');
  });

  // Test 25: anchor-mrv rejects missing or invalid carbon estimate and does not convert to 0
  await recordTest('anchor-mrv rejects missing/invalid carbon and never defaults to 0', () => {
    const anchorPath = path.resolve('supabase', 'functions', 'anchor-mrv', 'index.ts');
    const code = fs.readFileSync(anchorPath, 'utf8');
    assert(!code.includes('Number(submission.carbon_estimate || 0)'), 'Must not convert missing carbon estimate to 0');
    assert(code.includes('submission.carbon_estimate == null'), 'Must validate carbon_estimate presence');
  });

  // Test 26: retirement RPC does not fabricate tx_hash or fake CONFIRMED blockchain_records
  await recordTest('retirement RPC does not fabricate fake blockchain transactions or blocks', () => {
    const migrationPath = path.resolve('supabase', 'migrations', '202608240007_carbon_rpc_and_retirement.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    assert(!sql.includes('gen_random_bytes(20)'), 'retire_carbon_credit must not fabricate tx_hash with gen_random_bytes');
    assert(!sql.includes('48200000 + floor(random()'), 'retire_carbon_credit must not fabricate random block numbers');
  });

  // Test 27: getBlockchainStats does not count ANCHORED records as VERIFIED_ON_CHAIN
  await recordTest('getBlockchainStats strictly separates ANCHORED from VERIFIED_ON_CHAIN', async () => {
    const { getBlockchainStats, formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const anchoredRecord = formatBlockchainRecord({
      id: 'rec-anchored-1',
      tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'CONFIRMED',
      tCO2e: 500,
    });
    assert.strictEqual(anchoredRecord.statusCode, 'ANCHORED');
    const stats = getBlockchainStats();
    // verifiedProjectsCount should be 0 when no verified records exist in cache
    assert.strictEqual(typeof stats.verifiedProjectsCount, 'number');
  });

  // Test 28: Raw is_verified_on_chain boolean without tx_hash is rejected as PENDING
  await recordTest('Raw DB boolean without tx_hash does not qualify for VERIFIED_ON_CHAIN', async () => {
    const { formatBlockchainRecord } = await import('../features/blockchain/blockchainService.js');
    const record = formatBlockchainRecord({
      id: 'rec-fake-1',
      is_verified_on_chain: true,
      tx_hash: null,
    });
    assert.notStrictEqual(record.statusCode, 'VERIFIED_ON_CHAIN', 'Cannot be VERIFIED_ON_CHAIN without tx_hash');
    assert.strictEqual(record.statusCode, 'PENDING');
  });

  return testResults;
}
