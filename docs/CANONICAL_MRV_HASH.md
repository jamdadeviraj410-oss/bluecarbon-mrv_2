# Canonical MRV Hashing Specification

This document defines the deterministic canonicalization and hashing algorithm used to anchor and verify BlueCarbon MRV (Measurement, Reporting, and Verification) submissions on the Polygon Amoy blockchain.

## 1. Objective

To produce an immutable, tamper-evident cryptographic fingerprint (`bytes32` SHA-256 hash) of an MRV verification package without storing raw sensor files, images, or personally identifiable information (PII) on-chain.

## 2. Invariant Fields

The canonical representation incorporates the following immutable provenance fields:

1. **Submission Identifier**: `id` (UUID) and `code` (e.g. `MRV-2026-001`).
2. **Project Identifier**: `project_id` (UUID).
3. **Status**: `status` (Must be `VERIFIED` at the time of anchoring).
4. **Carbon Estimate**: `carbon_estimate` (in tonnes of CO2e).
5. **Claimed Metrics**: Key-sorted dictionary of physical measurements (e.g., `biomass_density`, `canopy_cover_percent`, `hectares_restored`).
6. **Reporting Period**: `period_start` and `period_end` (ISO-8601 strings).
7. **Verification Timestamp**: `verified_at` (ISO-8601 string).
8. **Evidence Hashes**: Sorted array of evidence file manifests containing:
   - `id`: File record ID.
   - `file_name`: Original filename.
   - `file_type`: MIME or extension classification.
   - `file_size_bytes`: Integer size.
   - `sha256_hash`: SHA-256 hex digest of the raw file stored in secure storage.
   - `validation_status`: Status of automated/manual validation.

### Excluded Mutable Fields
- UI display colors and transient state.
- Real-time page view counters.
- User session tokens and client metadata.

## 3. Canonicalization Algorithm

1. **Recursive Key Sorting**: For all JSON objects, object keys are sorted lexicographically in Unicode code point order (`Object.keys(obj).sort()`).
2. **Deterministic Array Serialization**: Arrays retain their deterministic order (evidence array is pre-sorted by `id` / `sha256_hash`).
3. **No Extraneous Whitespace**: The canonical JSON string is constructed without spaces around delimiters (`:`, `,`).
4. **UTF-8 Encoding**: The canonical string is encoded to bytes using standard UTF-8.
5. **SHA-256 Digest**: The digest is computed as standard SHA-256 and converted to lowercase hexadecimal string (64 characters).

```typescript
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(',')}}`;
}
```

## 4. On-Chain Anchoring

- **Chain**: Polygon Amoy Testnet (Chain ID: `80002`)
- **Contract**: `BlueCarbonMRVAnchor.sol`
- **Method**:
  ```solidity
  anchorMRV(bytes32 dataHash, string calldata recordId, uint256 carbonAmountCentiTonne)
  ```
- **Carbon Conversion**: Carbon amount in tonnes is multiplied by 100 to yield centi-tonnes (`uint256`), preserving 2 decimal places without floating point errors.

## 5. Verification Flow

1. Fetch MRV record and evidence files from database.
2. Construct canonical object and recompute SHA-256 digest.
3. Query `verifyMRV(bytes32 dataHash)` on the smart contract via Polygon Amoy RPC.
4. Compare on-chain data (`exists == true`, `recordId == submission_code`).
5. Confirm verification validity. If data was modified or tampered with, hash recomputation will mismatch the on-chain immutable hash.
