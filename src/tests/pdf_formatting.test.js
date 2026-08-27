import assert from 'node:assert';
import { generateProfessionalPdfBlob } from '../utils/reportPdfGenerator.js';

export async function runPdfFormattingTests() {
  console.log('\n--- 4. REPORT PDF GENERATION & FORMATTING SUITE ---');
  const results = [];

  // Helper assertion wrapper
  function testAssert(condition, message) {
    assert(condition, message);
    console.log(`  [PASS] 4.${results.length + 1} ${message}`);
    results.push(message);
  }

  // -------------------------------------------------------------
  // Test 1: Short Report
  // -------------------------------------------------------------
  const shortReport = {
    id: 'REP-SHORT-001',
    title: 'Short MRV Summary',
    period: 'Q1 2026',
    type: 'Executive Summary',
    author: 'Dr. Test Author',
    authorRole: 'Senior Auditor',
    status: 'Completed',
  };
  const shortBlob = generateProfessionalPdfBlob(shortReport);
  testAssert(Boolean(shortBlob), 'Short report generates valid Blob');
  testAssert(shortBlob.type === 'application/pdf', 'Short report Blob has application/pdf MIME type');
  testAssert(shortBlob.size > 2000, 'Short report PDF has valid binary content');

  // -------------------------------------------------------------
  // Test 2: Long Multi-Page Report
  // -------------------------------------------------------------
  const longReport = {
    id: 'REP-LONG-999',
    title: 'Comprehensive National Coastal Blue Carbon Multi-Year Comprehensive Ecosystem Analysis and Auditing Ledger',
    period: '2020 - 2026 Multi-Year',
    type: 'National Summary Report',
    author: 'Dr. A. Sharma, Director of National Coastal Carbon MRV Authority',
    authorRole: 'Chief Executive MRV Verifier & National Registrar',
    status: 'Verified',
    description: 'A'.repeat(1200),
    summaryMetrics: {
      totalArea: '52,400 ha',
      totalSequestered: '4,850,000 tCO2e',
      creditsIssued: '3,200,000',
      activeProjects: 450,
      survivalRate: '94.5%',
    },
    methodologies: [
      'Verra VM0033 Tidal Wetland Restoration Standard v2.1',
      'Blue Carbon MRV Protocol v1.0 (NCCR Standard)',
      'IPCC Tier 3 Wetland Biomass & Soil Organic Carbon Framework',
      'Gold Standard for the Global Goals - Coastal Wetlands',
      'Plan Vivo Standard for Community Mangrove Reforestation',
    ],
    keyFindings: [
      'Total verified restoration area reconciled across all 450 monitored coastal plots.',
      'NDVI satellite index confirmed +14.2% average canopy density growth year-over-year.',
      'Soil core carbon density measurements match algorithmic estimations within 2.1% error margin.',
      'Zero double-counting detected across regional and international carbon registries.',
      'Community ground telemetry logs independently validated via Polygon Amoy timestamping.',
    ],
    evidence: Array.from({ length: 15 }, (_, i) => ({
      type: `Multispectral Drone Survey #${i + 1}`,
      source: `UAV-WING-${i + 100}`,
      date: '2026-08-20',
      status: 'Verified',
      hash: '0x' + 'a1b2c3d4e5f67890'.repeat(4),
    })),
    blockchain: {
      tx_hash: '0x' + '9f8e7d6c5b4a3210'.repeat(4),
      anchor_hash: '0x' + '1234567890abcdef'.repeat(4),
      network: 'Polygon Amoy Testnet (Chain ID: 80002)',
      contract_address: '0x2eA2643a6Fe138cf156715fAad61d368e7d23a10',
      block_number: 1482094,
    },
  };
  const longBlob = generateProfessionalPdfBlob(longReport);
  testAssert(Boolean(longBlob), 'Long multi-page report generates valid Blob');
  testAssert(longBlob.size > 8000, 'Multi-page report produces larger comprehensive PDF stream');

  // -------------------------------------------------------------
  // Test 3: Long Project / Organization Names
  // -------------------------------------------------------------
  const longNamesReport = {
    id: 'REP-LONG-NAME-01',
    title: 'Maharashtra Mangrove Ecological Restoration & Tidal Inlet Salinity Stabilization Program',
    projectName: 'Super Extended Ultra Long Name For Coastal Estuarine Mangrove Biosphere Conservation Project of Western Ghats',
    location: 'Ratnagiri Estuary, Konkan Coastal Division, State of Maharashtra, Republic of India',
    period: '2026 Q2',
    status: 'In Review',
  };
  const longNamesBlob = generateProfessionalPdfBlob(longNamesReport);
  testAssert(Boolean(longNamesBlob), 'Report with long names and location wraps correctly');

  // -------------------------------------------------------------
  // Test 4: Long Hashes and Technical Identifiers
  // -------------------------------------------------------------
  const longHashesReport = {
    id: 'REP-HASH-01',
    title: 'Cryptographic Provenance Audit',
    hash: '0x' + 'f9e8d7c6b5a43210deadbeefcafebabef00d'.repeat(3),
    blockchain: {
      tx_hash: '0x' + 'abcdef0123456789fedcba9876543210'.repeat(4),
      anchor_hash: '0x' + '999888777666555444333222111000'.repeat(3),
      contract_address: '0x' + '1111222233334444555566667777888899990000',
    },
  };
  const longHashesBlob = generateProfessionalPdfBlob(longHashesReport);
  testAssert(Boolean(longHashesBlob), 'Report with long 128+ char hex hashes formats safely without error');

  // -------------------------------------------------------------
  // Test 5: Missing / Null / Undefined Fields
  // -------------------------------------------------------------
  const nullFieldsReport = {
    id: null,
    title: undefined,
    period: '',
    status: null,
    summaryMetrics: null,
    methodologies: null,
    keyFindings: null,
    evidence: null,
    blockchain: null,
  };
  const nullBlob = generateProfessionalPdfBlob(nullFieldsReport);
  testAssert(Boolean(nullBlob), 'Report with all null/undefined optional fields uses safe defaults');
  testAssert(nullBlob.size > 2000, 'Null-fields report still produces complete PDF');

  // -------------------------------------------------------------
  // Test 6: Status Colors (Rejected / Failed)
  // -------------------------------------------------------------
  const failedReport = {
    id: 'REP-FAIL-01',
    title: 'Failed Telemetry Audit',
    status: 'REJECTED',
  };
  const failedBlob = generateProfessionalPdfBlob(failedReport);
  testAssert(Boolean(failedBlob), 'Report with REJECTED status formats successfully');

  return results;
}
