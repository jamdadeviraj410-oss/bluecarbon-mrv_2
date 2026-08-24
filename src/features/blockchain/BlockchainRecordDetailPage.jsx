import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBlockchainRecord } from './blockchainService';
import { formatNumber } from '../../utils/formatters';

export default function BlockchainRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedMrvHash, setCopiedMrvHash] = useState(false);
  const [copiedEvidenceHash, setCopiedEvidenceHash] = useState(null);

  const record = useMemo(() => getBlockchainRecord(id), [id]);

  const handleCopy = (text, setter) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (typeof setter === 'function') {
      setter(true);
      setTimeout(() => setter(false), 2000);
    } else {
      setCopiedEvidenceHash(text);
      setTimeout(() => setCopiedEvidenceHash(null), 2000);
    }
  };

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
        <h2 className="font-headline-md text-primary">Blockchain Record Not Found</h2>
        <p className="text-body-md text-on-surface-variant">
          No blockchain record found for identifier "{id}".
        </p>
        <button
          onClick={() => navigate('/admin/blockchain')}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-title-md hover:bg-primary-container transition-colors"
        >
          Return to Blockchain Registry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 max-w-[1440px] mx-auto font-body-md text-on-surface">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/admin/blockchain" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Blockchain Registry</span>
        </Link>
        <span>/</span>
        <span className="font-mono-data text-primary font-semibold">{record.creditId}</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-headline-lg text-primary tracking-tight">Credit DNA & On-Chain Provenance</h1>
            {record.isDemo || record.isSimulated ? (
              <span className="px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-label-md flex items-center gap-1 border border-amber-500/30">
                <span className="material-symbols-outlined text-[16px]">science</span>
                <span>DEMO / SIMULATED RECORD</span>
              </span>
            ) : record.txHash ? (
              <span className="px-3 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-md flex items-center gap-1 border border-secondary-container">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{record.status}</span>
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-md flex items-center gap-1 border border-outline-variant">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Pending On-Chain Anchor</span>
              </span>
            )}
          </div>
          <p className="font-body-md text-on-surface-variant max-w-3xl">
            {record.isDemo || record.isSimulated
              ? 'Demonstration carbon credit representation. Real on-chain anchoring is initiated via the anchorMRVSubmission edge function.'
              : `Cryptographically verified immutable proof of blue carbon sequestration on ${record.networkFull && record.networkFull !== 'Network Not Configured' ? record.networkFull : 'configured blockchain network'}.`}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="font-mono-data text-on-surface-variant px-2.5 py-1 bg-surface-container rounded text-xs">
              Provenance ID: {record.provenanceId || record.creditId}
            </span>
            <span className="font-mono-data text-on-surface-variant px-2.5 py-1 bg-surface-container rounded text-xs">
              MRV Package: {record.mrvCode}
            </span>
            <span className="font-mono-data text-on-surface-variant px-2.5 py-1 bg-surface-container rounded text-xs">
              Token #{record.tokenId}
            </span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {record.explorerUrl && record.txHash && (
            <a
              href={record.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg border border-primary-container text-primary font-title-md hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span>View on Amoy Explorer</span>
            </a>
          )}
          {record.txHash ? (
            <button
              onClick={() => handleCopy(record.txHash, setCopiedHash)}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-title-md hover:bg-primary-container transition-colors flex items-center gap-2 shadow-md text-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copiedHash ? 'check' : 'content_copy'}
              </span>
              <span>{copiedHash ? 'Hash Copied' : 'Copy Tx Hash'}</span>
            </button>
          ) : (
            <div className="px-3.5 py-1.5 bg-surface-container rounded-lg text-xs font-mono-data text-on-surface-variant border border-outline-variant/40">
              Tx Hash: Pending Blockchain Anchor
            </div>
          )}
        </div>
      </div>

      {(record.isDemo || record.isSimulated) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">info</span>
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5">Demo Simulation Record</span>
            This record is a pre-configured demo model designed to illustrate Credit DNA lineage. In a production environment, real on-chain cryptographic proofs and Polygon transaction hashes are created exclusively when an approved MRV submission is anchored via the Polygon smart contract.
          </div>
        </div>
      )}

      {/* Credit DNA Provenance Lineage Bar */}
      <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-high flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-title-lg text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
            <span>End-to-End Cryptographic Provenance Trace</span>
          </h2>
          <span className="text-xs font-mono-data text-outline">Credit → Project → MRV → Verification → Evidence → Hash → Polygon</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-1">
          {record.dnaTrace.map((node, i) => (
            <div key={node.type} className="p-3 bg-surface-container rounded-lg border border-outline-variant/30 flex flex-col gap-1 relative">
              <div className="flex items-center justify-between">
                <span className="text-secondary font-bold text-[10px] uppercase">{i + 1}. {node.type}</span>
                <span className="material-symbols-outlined text-secondary text-[14px]">check_circle</span>
              </div>
              <span className="font-mono-data text-on-surface font-semibold text-xs truncate" title={node.code}>{node.code}</span>
              <span className="text-on-surface-variant text-[11px] truncate" title={node.label}>{node.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-secondary flex flex-col gap-2 relative overflow-hidden">
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block text-[11px]">CO2e Volume Minted</span>
          <div className="flex items-end gap-2">
            {record.tCO2e != null ? (
              <>
                <span className="font-headline-lg text-on-surface font-mono-data">{formatNumber(record.tCO2e)}</span>
                <span className="font-title-md text-on-surface-variant pb-1">tCO2e</span>
              </>
            ) : (
              <span className="font-title-md text-on-surface-variant italic py-1">Pending / Not Available</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-secondary text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span> Verified Sequestered
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-primary flex flex-col gap-2 relative overflow-hidden">
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block text-[11px]">Block Height</span>
          <div className="flex items-end gap-2">
            <span className="font-headline-lg text-on-surface font-mono-data">#{record.blockNumber || 'Pending'}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">hub</span> {record.confirmations} Confirmations
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-tertiary-fixed-dim flex flex-col gap-2 relative overflow-hidden">
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block text-[11px]">Execution Network</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: record.networkColor }}>
              {record.networkSymbol}
            </div>
            <span className="font-title-lg text-on-surface">{record.networkFull}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-1">
            <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">speed</span> Gas: {record.gasUsed}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-inverse-surface flex flex-col gap-2 relative overflow-hidden">
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block text-[11px]">Verification Standard</span>
          <div className="flex flex-col justify-end">
            <span className="font-title-md text-on-surface truncate">{record.methodology}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[16px] text-outline">gavel</span> Ref: {record.verificationId}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Blockchain Record Slate Card */}
          <div className="bg-inverse-surface p-6 rounded-xl shadow-lg relative overflow-hidden text-inverse-on-surface flex flex-col gap-5">
            <h2 className="font-headline-md text-inverse-on-surface text-lg flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <span className="material-symbols-outlined text-primary-fixed-dim">lan</span>
              <span>Cryptographic MRV Proof & Contract Anchor</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 font-mono-data text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-outline uppercase tracking-wider text-[10px]">Network Protocol</span>
                <span className="font-title-md text-inverse-on-surface text-sm flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: record.networkColor }}></div>
                  {record.networkFull}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-label-md text-outline uppercase tracking-wider text-[10px]">Block Number</span>
                <span className="text-inverse-on-surface text-sm font-semibold">{record.blockNumber ? `#${record.blockNumber}` : 'Pending'}</span>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="font-label-md text-outline uppercase tracking-wider text-[10px]">Smart Contract Address (BlueCarbonMRVAnchor)</span>
                <div className="flex items-center gap-2 bg-surface/10 px-3 py-2 rounded-lg w-full justify-between">
                  <span className="text-inverse-on-surface truncate break-all">{record.contractAddress}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(record.contractAddress, setCopiedContract)}
                    className="text-primary-fixed-dim hover:text-inverse-on-surface transition-colors shrink-0 cursor-pointer"
                    title="Copy Contract"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedContract ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="font-label-md text-outline uppercase tracking-wider text-[10px]">
                  Transaction Hash {record.network && record.network !== 'Network Not Configured' ? `(${record.network})` : ''}
                </span>
                <div className="flex items-center gap-2 bg-surface/10 px-3 py-2 rounded-lg w-full justify-between">
                  <span className="text-inverse-on-surface truncate break-all">{record.txHash}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(record.txHash, setCopiedHash)}
                    className="text-primary-fixed-dim hover:text-inverse-on-surface transition-colors shrink-0 cursor-pointer"
                    title="Copy Tx Hash"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedHash ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="font-label-md text-outline uppercase tracking-wider text-[10px]">Canonical MRV SHA-256 Digest</span>
                <div className="flex items-center gap-2 bg-surface/10 px-3 py-2 rounded-lg w-full justify-between">
                  <span className="text-inverse-on-surface truncate break-all">{record.mrvHash}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(record.mrvHash, setCopiedMrvHash)}
                    className="text-primary-fixed-dim hover:text-inverse-on-surface transition-colors shrink-0 cursor-pointer"
                    title="Copy MRV Hash"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedMrvHash ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-label-md text-outline uppercase tracking-wider text-[10px]">Token ID</span>
                <span className="text-inverse-on-surface text-sm font-semibold">{record.tokenId}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-label-md text-outline uppercase tracking-wider text-[10px]">Anchored Timestamp (UTC)</span>
                <span className="text-inverse-on-surface text-sm">{record.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Evidence Files SHA-256 Hashes Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-primary text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">fingerprint</span>
                <span>Verified Evidence Files & SHA-256 Hashes ({record.evidenceHashes.length})</span>
              </h2>
              <span className="text-xs text-on-surface-variant">Cryptographic Hashes Anchored in MRV Digest</span>
            </div>

            <div className="flex flex-col gap-2.5 font-mono-data text-xs">
              {record.evidenceHashes.map((ev) => (
                <div key={ev.name} className="p-3 bg-surface-container rounded-lg flex flex-col gap-1 border border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold flex items-center gap-1.5 font-body-md text-xs">
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      <span>{ev.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ev.hash)}
                      className="text-outline hover:text-primary transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                      title="Copy SHA-256"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedEvidenceHash === ev.hash ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedEvidenceHash === ev.hash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <span className="text-on-surface-variant break-all text-[11px] bg-surface/50 p-1.5 rounded">{ev.hash}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Lifecycle Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high flex flex-col gap-4">
            <h2 className="font-headline-md text-primary text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">route</span>
              <span>Provenance & Verification Lifecycle</span>
            </h2>

            <div className="relative pl-6 space-y-5">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-outline-variant"></div>

              {record.lifecycle.map((step) => {
                const isDone = step.status === 'completed';
                return (
                  <div key={step.step} className="relative z-10 flex flex-col gap-0.5">
                    <div
                      className={`absolute -left-6 mt-0.5 w-4 h-4 rounded-full ring-4 ring-surface-container-lowest ${
                        isDone ? 'bg-secondary' : 'bg-surface-variant border border-outline-variant'
                      }`}
                    ></div>
                    <div className="pl-3">
                      <span className="font-title-md text-on-surface text-sm block">{step.title}</span>
                      <span className="font-body-md text-on-surface-variant text-xs">
                        {step.date} • {step.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Associated Project & MRV Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high flex flex-col gap-4">
            <h3 className="font-title-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">account_tree</span>
              <span>Associated Blue Carbon Asset</span>
            </h3>

            <div className="flex flex-col gap-3 text-sm">
              <div className="p-3 bg-surface-container rounded-lg flex flex-col gap-1">
                <span className="text-label-md text-on-surface-variant uppercase text-[10px]">Project Name</span>
                <span className="font-title-md text-primary">{record.projectName}</span>
                <span className="text-body-md text-on-surface-variant text-xs">{record.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container rounded-lg flex flex-col gap-1">
                  <span className="text-label-md text-on-surface-variant uppercase text-[10px]">Organization</span>
                  <span className="font-body-md text-on-surface font-medium truncate">{record.organization}</span>
                </div>
                <div className="p-3 bg-surface-container rounded-lg flex flex-col gap-1">
                  <span className="text-label-md text-on-surface-variant uppercase text-[10px]">Lead Auditor</span>
                  <span className="font-body-md text-on-surface font-medium truncate">{record.auditor}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container rounded-lg flex flex-col gap-1">
                  <span className="text-label-md text-on-surface-variant uppercase text-[10px]">MRV Package</span>
                  <span className="font-body-md text-on-surface font-medium truncate">{record.mrvCode}</span>
                </div>
                <div className="p-3 bg-surface-container rounded-lg flex flex-col gap-1">
                  <span className="text-label-md text-on-surface-variant uppercase text-[10px]">Carbon Volume</span>
                  <span className="font-body-md text-secondary font-bold truncate">
                    {record.tCO2e != null ? `${formatNumber(record.tCO2e)} tCO2e` : 'Pending / Not Available'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-surface-container-high flex flex-col gap-2">
              <Link
                to={`/mrv/blockchain/${record.mrvId}`}
                className="w-full py-2.5 px-4 bg-primary text-on-primary rounded-lg font-title-md text-sm text-center hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                <span>Verify MRV On-Chain</span>
              </Link>
              <Link
                to="/admin/blockchain"
                className="w-full py-2.5 px-4 bg-surface-container text-on-surface rounded-lg font-title-md text-sm text-center hover:bg-surface-container-highest transition-colors"
              >
                Back to Registry Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
