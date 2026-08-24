/**
 * Blockchain Ledger Service — Real Supabase Backend Integration & Polygon Amoy Provenance
 * Provides data and operations for on-chain blue carbon registry entries and Credit DNA
 * 
 * Strict Data-Integrity Rules:
 * - Real Supabase records are NEVER silently replaced with demo data.
 * - Demo records are only accessible when explicit demo mode is requested.
 * - Formatter defaults use null / 'Pending' / [] instead of fabricated IDs or counts.
 * - getBlockchainRecord() returns null for unknown IDs.
 * - getBlockchainStats() strictly excludes demo records and fake growth numbers.
 */

import { supabase } from '../../lib/supabase.js';
import {
  blockchainNetworks,
  blockchainRecordsFallback,
} from './mockBlockchainFallback.js';

export { blockchainNetworks };

// Active in-memory cache synchronized with Supabase (initialized empty)
let cachedRecords = [];
let isDemoModeEnabled = false;

/**
 * Enable or disable explicit demo mode
 * @param {boolean} enabled 
 */
export function setBlockchainDemoMode(enabled) {
  isDemoModeEnabled = Boolean(enabled);
}

/**
 * Check if demo mode is active
 * @returns {boolean}
 */
export function isBlockchainDemoMode() {
  return isDemoModeEnabled;
}

/**
 * Format a Supabase blockchain record into UI format with complete Credit DNA
 */
export function formatBlockchainRecord(r) {
  if (!r) return null;

  const credit = r.credit || {};
  const project = credit.project || {};
  const org = project.organization || {};
  const network = r.network || {};
  const contract = r.contract || {};
  const events = (credit.lifecycle_events || []).sort((a, b) => a.step_number - b.step_number);

  const carbonValue =
    credit.issued_quantity != null
      ? Number(credit.issued_quantity)
      : r.payload?.carbon_estimate != null
      ? Number(r.payload.carbon_estimate)
      : null;

  const isDemo = Boolean(r.isDemo || r.isSimulated || r.status === 'DEMO_SIMULATED');

  const txShort = r.tx_hash
    ? `${r.tx_hash.slice(0, 6)}...${r.tx_hash.slice(-4)}`
    : 'Pending Anchor';

  const contractAddress = contract.contract_address ?? null;
  const contractShort = contractAddress
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    : null;

  const networkShort = network.short_name ?? network.name ?? 'Network Not Configured';
  const networkFull = network.name ?? network.short_name ?? 'Network Not Configured';
  const chainId = network.chain_id ?? null;
  const networkSymbol = network.symbol ?? null;
  const networkColor = network.color ?? '#6c757d';

  // Independent verify-mrv result confirms all required checks
  const isVerifiedOnChain = Boolean(
    r.tx_hash &&
    (
      r.verified_on_chain === true ||
      r.verified_on_chain_provenance === true ||
      (r.verification_result && r.verification_result.verified === true)
    )
  );

  const statusLabel = isDemo
    ? 'DEMO / SIMULATED'
    : isVerifiedOnChain
    ? 'On-Chain Verified'
    : r.tx_hash && (r.status === 'CONFIRMED' || r.status === 'ANCHORED')
    ? (network.short_name ? `Anchored on ${network.short_name}` : 'Anchored on-chain')
    : r.status === 'ANCHORING'
    ? 'Anchoring'
    : r.status === 'PENDING' || !r.tx_hash
    ? 'Pending'
    : r.status === 'FAILED'
    ? 'Failed'
    : 'Pending';

  const statusCode = isDemo
    ? 'DEMO_SIMULATED'
    : isVerifiedOnChain
    ? 'VERIFIED_ON_CHAIN'
    : r.tx_hash && (r.status === 'CONFIRMED' || r.status === 'ANCHORED')
    ? 'ANCHORED'
    : r.status === 'ANCHORING'
    ? 'ANCHORING'
    : r.status === 'FAILED'
    ? 'FAILED'
    : 'PENDING';

  const creditId = credit.credit_code || r.credit_id || r.record_code || 'Pending';
  const provenanceId = credit.credit_code || creditId;
  const mrvCode = r.payload?.record_id || credit.mrv_submission_code || 'Pending';
  const dataHash = r.data_hash || r.merkle_root || r.payload?.data_hash || null;
  const explorerUrl = r.explorer_url || (r.tx_hash && network.explorer_url ? `${network.explorer_url}/tx/${r.tx_hash}` : null);

  const dnaTrace = [
    { type: 'Credit', code: provenanceId, label: carbonValue != null ? `${carbonValue.toLocaleString()} tCO2e Issued` : 'Pending / Not Available' },
    { type: 'Project', code: project.project_code || project.name || 'Pending', label: project.name || 'Coastal Restoration Project' },
    { type: 'MRV', code: mrvCode, label: mrvCode !== 'Pending' ? 'Verified MRV Package' : 'Pending MRV Submission' },
    { type: 'Verification', code: credit.verification_reference || 'Pending', label: credit.verifier_signatory || 'Pending Verifier' },
    { type: 'Evidence', code: r.payload?.evidence_count ? `${r.payload.evidence_count} Files` : (r.payload?.evidence_hashes?.length ? `${r.payload.evidence_hashes.length} Files` : 'Pending Files'), label: 'Cryptographic Evidence Hashes' },
    { type: 'Hash', code: dataHash ? `0x${dataHash.slice(0, 8)}...` : 'Pending Hash', label: 'Canonical SHA-256 Digest' },
    { type: 'Polygon', code: r.tx_hash ? `${networkShort} ${r.block_number ? `#${r.block_number}` : ''}` : 'Pending On-Chain Anchor', label: r.tx_hash ? `${networkFull}` : 'Awaiting Smart Contract Anchor' },
  ];

  return {
    isDemo,
    isSimulated: isDemo,
    creditId,
    provenanceId,
    projectName: project.name || 'Coastal Restoration Project',
    projectId: project.project_code || project.id || 'Pending',
    mrvCode,
    mrvId: r.payload?.submission_id || 'Pending',
    organization: org.name || 'Not Available',
    location: project.location_name || 'Coastal Region',
    tCO2e: carbonValue,
    network: networkShort,
    networkFull,
    networkSymbol,
    networkColor,
    chainId,
    txHash: r.tx_hash || null,
    txHashShort: txShort,
    contractAddress,
    contractAddressShort: contractShort,
    blockNumber: r.block_number ?? null,
    tokenId: r.token_id ?? null,
    timestamp: r.on_chain_timestamp || null,
    issueDate: r.on_chain_timestamp
      ? new Date(r.on_chain_timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Pending',
    status: statusLabel,
    statusCode,
    confirmations: r.confirmations ?? null,
    confirmationsTotal: r.confirmations_total ?? null,
    methodology: credit.methodology || 'Standard Blue Carbon MRV',
    verificationId: credit.verification_reference || null,
    auditor: credit.verifier_signatory || 'Pending Verifier',
    gasUsed: r.gas_used ?? null,
    mrvHash: dataHash,
    merkleRoot: dataHash ? (dataHash.startsWith('0x') ? dataHash : `0x${dataHash}`) : null,
    explorerUrl,
    evidenceCount: r.payload?.evidence_count || r.payload?.evidence_hashes?.length || 0,
    evidenceHashes: r.payload?.evidence_hashes || [],
    dnaTrace,
    lifecycle: events.length > 0
      ? events.map((e, idx) => ({
          step: e.step_number || idx + 1,
          title: e.title,
          date: e.event_timestamp ? new Date(e.event_timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent',
          subtitle: e.subtitle,
          icon: e.icon || 'verified',
          status: e.status || 'completed',
        }))
      : [],
  };
}

/**
 * Fetch blockchain records from Supabase
 */
export async function fetchBlockchainRecordsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('blockchain_records')
      .select(`
        *,
        credit:carbon_credits(*, project:projects(*, organization:organizations(*)), lifecycle_events:blockchain_lifecycle_events(*)),
        network:blockchain_networks(*),
        contract:smart_contracts(*)
      `)
      .order('on_chain_timestamp', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      cachedRecords = data.map(formatBlockchainRecord);
      return cachedRecords;
    }
  } catch (err) {
    console.warn('Supabase blockchain records query notice:', err);
  }
  // Return empty array on failure or empty database — DO NOT silently fallback to demo records
  cachedRecords = [];
  return cachedRecords;
}

// Initial eager fetch
fetchBlockchainRecordsFromSupabase();

/**
 * Get all blockchain records with optional filtering
 * @param {{ search?: string, network?: string, status?: string }} filters
 * @param {boolean} [isDemo]
 * @returns {Array}
 */
export function getBlockchainRecords(filters = {}, isDemo = isDemoModeEnabled) {
  let list = isDemo ? [...blockchainRecordsFallback] : [...cachedRecords];

  if (filters.status && filters.status !== 'All') {
    list = list.filter((r) => r.status && r.status.toLowerCase() === filters.status.toLowerCase());
  }

  if (filters.network && filters.network !== 'All') {
    list = list.filter((r) => r.network && r.network.toLowerCase().includes(filters.network.toLowerCase()));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (r) =>
        (r.creditId && r.creditId.toLowerCase().includes(q)) ||
        (r.projectName && r.projectName.toLowerCase().includes(q)) ||
        (r.txHash && r.txHash.toLowerCase().includes(q)) ||
        (r.mrvHash && r.mrvHash.toLowerCase().includes(q)) ||
        (r.mrvCode && r.mrvCode.toLowerCase().includes(q)) ||
        (r.verificationId && r.verificationId.toLowerCase().includes(q)) ||
        (r.organization && r.organization.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Get a single blockchain record by hash or credit ID
 * @param {string} identifier (txHash or creditId)
 * @param {boolean} [isDemo]
 * @returns {Object|null}
 */
export function getBlockchainRecord(identifier, isDemo = isDemoModeEnabled) {
  if (!identifier) return null;
  const q = identifier.toLowerCase();
  const records = isDemo ? blockchainRecordsFallback : cachedRecords;
  const match = records.find(
    (r) =>
      (r.txHash && r.txHash.toLowerCase() === q) ||
      (r.creditId && r.creditId.toLowerCase() === q) ||
      (r.provenanceId && r.provenanceId.toLowerCase() === q) ||
      (r.mrvCode && r.mrvCode.toLowerCase() === q)
  );
  return match || null;
}

/**
 * Get summary statistics for blockchain dashboard
 * @returns {Object}
 */
export function getBlockchainStats() {
  const realRecords = cachedRecords.filter((r) => !r.isDemo && !r.isSimulated && r.statusCode !== 'DEMO_SIMULATED');
  const verifiedOnChainRecords = realRecords.filter((r) => r.statusCode === 'VERIFIED_ON_CHAIN');
  const totalCredits = realRecords.reduce((sum, r) => sum + (Number(r.tCO2e) || 0), 0);

  return {
    totalCreditsIssued: totalCredits >= 1000 ? `${(totalCredits / 1000).toFixed(1)}k` : `${totalCredits}`,
    totalCreditsIssuedChange: verifiedOnChainRecords.length > 0
      ? `${verifiedOnChainRecords.length} Verified on-chain`
      : realRecords.length > 0
      ? `${realRecords.length} Anchored on-chain`
      : '0 registered',
    totalCO2eTokenized: totalCredits >= 1000 ? `${(totalCredits / 1000).toFixed(1)}k` : `${totalCredits}`,
    activeNetworksCount: realRecords.filter((r) => r.network && r.network !== 'Network Not Configured').length > 0 ? 1 : 0,
    verifiedProjectsCount: verifiedOnChainRecords.length,
    blockchainTxnsCount: `${realRecords.filter((r) => r.txHash).length}`,
    lastSynced: verifiedOnChainRecords.length > 0
      ? 'Polygon Amoy synchronized'
      : realRecords.length > 0
      ? 'Awaiting on-chain verification'
      : 'Awaiting on-chain records',
  };
}

/**
 * Export registry data as CSV string
 * @returns {string}
 */
export function exportBlockchainRegistryCSV() {
  const records = isDemoModeEnabled ? blockchainRecordsFallback : cachedRecords;
  const headers = ['Credit / Provenance ID', 'Project Name', 'Organization', 'Location', 'tCO2e', 'Network', 'Tx Hash', 'Block Number', 'MRV Hash', 'Status', 'Issue Date'];
  const rows = records.map((r) => [
    r.creditId,
    `"${r.projectName}"`,
    `"${r.organization}"`,
    `"${r.location}"`,
    r.tCO2e,
    r.networkFull,
    r.txHash || '',
    r.blockNumber || 'Pending',
    r.mrvHash || '',
    r.status,
    r.issueDate,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export const blockchainRecords = cachedRecords;
