import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { anchorMRVSubmission, verifyMRVAnchor } from '../../../services/blockchainService';

export default function MrvBlockchainAnchorPage() {
  const { submissionId } = useParams();
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const isValidUuid = Boolean(
    submissionId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)
  );

  const effectiveError = error || (!isValidUuid ? `Invalid MRV Submission ID ('${submissionId || 'missing'}'). Expected a valid database UUID (e.g., 550e8400-e29b-41d4-a716-446655440000). Please select an authentic verified MRV submission from the registry.` : '');

  async function run(action, name) {
    if (!isValidUuid) {
      setError(`Invalid MRV Submission ID ('${submissionId || 'missing'}'). A valid database UUID is required.`);
      return;
    }
    setBusy(true);
    setActiveAction(name);
    setError('');
    try {
      const data = await action(submissionId);
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Blockchain operation failed');
    } finally {
      setBusy(false);
      setActiveAction('');
    }
  }

  const handleCopy = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const isVerified = result?.verified === true || (result?.success === true && result?.transactionHash);

  return (
    <div className="min-h-[70vh] p-6 md:p-8 max-w-4xl mx-auto font-body-md text-on-surface">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
        <Link to="/admin/blockchain" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Blockchain Registry</span>
        </Link>
        <span>/</span>
        <span className="font-mono-data text-primary font-semibold">MRV Anchor Workspace</span>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-surface-container-high pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Polygon Amoy Testnet (80002)</span>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono-data">SHA-256</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">MRV On-Chain Provenance Anchor</h1>
            <p className="text-sm text-on-surface-variant break-all mt-1">
              Submission UUID: <span className={`font-mono-data font-medium ${isValidUuid ? 'text-on-surface' : 'text-error'}`}>{submissionId || 'None'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              disabled={busy || !isValidUuid}
              onClick={() => run(anchorMRVSubmission, 'anchor')}
              className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-title-md text-sm hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {busy && activeAction === 'anchor' ? 'sync' : 'hub'}
              </span>
              <span>{busy && activeAction === 'anchor' ? 'Anchoring to Polygon…' : 'Anchor on Polygon'}</span>
            </button>
            <button
              disabled={busy || !isValidUuid}
              onClick={() => run(verifyMRVAnchor, 'verify')}
              className="px-4 py-2.5 rounded-lg border border-primary text-primary font-title-md text-sm hover:bg-primary/5 disabled:opacity-50 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {busy && activeAction === 'verify' ? 'sync' : 'verified_user'}
              </span>
              <span>{busy && activeAction === 'verify' ? 'Reading Contract…' : 'Verify On-Chain'}</span>
            </button>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant flex flex-col gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-on-surface text-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">info</span>
            <span>How BlueCarbon MRV Anchoring Works</span>
          </div>
          <p>
            When anchored, the verified MRV submission and all its constituent evidence file SHA-256 hashes are canonicalized into a deterministic JSON object. Its SHA-256 fingerprint is permanently recorded on Polygon Amoy through the <code className="font-mono bg-surface p-1 rounded">BlueCarbonMRVAnchor</code> smart contract.
          </p>
          <div className="font-mono text-[11px] text-primary flex items-center gap-2 pt-1 border-t border-outline-variant/20">
            <span>Trace Pipeline:</span>
            <span className="text-on-surface">Verified MRV → Canonical JSON → SHA-256 Digest → Polygon Smart Contract → Immutable Proof</span>
          </div>
        </div>

        {/* Error Alert */}
        {effectiveError && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-error shrink-0">error</span>
            <div className="flex flex-col gap-1">
              <span className="font-bold">Operation Notice</span>
              <span>{effectiveError}</span>
            </div>
          </div>
        )}

        {/* Operation Result Box */}
        {result && (
          <div className="grid gap-4 animate-fadeIn">
            <div className={`p-4 sm:p-5 rounded-xl border flex items-center justify-between ${
              isVerified ? 'bg-secondary-container/30 border-secondary text-on-surface' : 'bg-error-container/30 border-error text-on-surface'
            }`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[28px]">
                  {isVerified ? 'check_circle' : 'warning'}
                </span>
                <div>
                  <div className="font-bold text-base">
                    {isVerified ? 'Cryptographic Proof Verified On-Chain' : 'Blockchain Anchor Not Confirmed'}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {result.reason ? `Reason: ${result.reason}` : 'Live contract call matched canonical deterministic hash.'}
                  </div>
                </div>
              </div>
              {result.timestamp && (
                <div className="text-right text-xs font-mono-data text-on-surface-variant hidden sm:block">
                  <div>Anchored Block: #{result.blockNumber}</div>
                  <div>{new Date(result.timestamp * 1000).toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Hashes & Tx Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono-data text-xs">
              {result.dataHash && (
                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-1.5 md:col-span-2">
                  <div className="flex items-center justify-between text-outline uppercase text-[10px]">
                    <span>Canonical MRV SHA-256 Digest</span>
                    <button
                      onClick={() => handleCopy(result.dataHash)}
                      className="text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedHash ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                  <code className="text-primary font-bold break-all bg-surface/60 p-2 rounded">{result.dataHash}</code>
                </div>
              )}

              {result.transactionHash && (
                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-1.5 md:col-span-2">
                  <div className="text-outline uppercase text-[10px]">Polygon Amoy Transaction Hash</div>
                  <code className="text-on-surface break-all bg-surface/60 p-2 rounded">{result.transactionHash}</code>
                  {result.explorerUrl && (
                    <a
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body-md font-semibold mt-1"
                      href={result.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>Open on Polygonscan Amoy Explorer</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                </div>
              )}

              {result.carbonAmount !== undefined && (
                <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">On-Chain Carbon Amount</span>
                  <span className="text-secondary font-bold text-sm">{result.carbonAmount} tCO2e</span>
                </div>
              )}

              {result.recordId && (
                <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">On-Chain Record Code</span>
                  <span className="text-on-surface font-bold text-sm">{result.recordId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
