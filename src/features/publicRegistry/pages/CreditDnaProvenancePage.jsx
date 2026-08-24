import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCreditProvenanceDna, formatContractLink } from '../../governance/adapters/blockchainProvenanceAdapter';
import { ROUTES } from '../../../utils/constants';

export default function CreditDnaProvenancePage() {
  const { id } = useParams();
  const [dna, setDna] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('LINEAGE'); // 'LINEAGE', 'BENEFITS', 'TECHNICAL'

  useEffect(() => {
    let isMounted = true;
    async function loadDna() {
      const data = await getCreditProvenanceDna(id || 'CRD-2023-001');
      if (isMounted) setDna(data);
    }
    loadDna();
    return () => { isMounted = false; };
  }, [id]);

  if (!dna) {
    return <div className="p-12 text-center text-on-surface-variant font-mono-data">Loading Credit DNA Provenance Ledger...</div>;
  }

  const copyHash = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link to={ROUTES.PUBLIC_REGISTRY} className="flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Public Registry
        </Link>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-secondary/15 text-secondary border border-secondary/30 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          Verified Sovereign Credit DNA
        </span>
      </div>

      {/* Credit DNA Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary-container text-on-primary shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-tertiary-fixed text-xs font-mono-data font-bold uppercase backdrop-blur-md">
              {dna.creditCode} • Vintage {dna.vintage}
            </div>
            <h1 className="font-display-lg text-[26px] md:text-[32px] font-extrabold tracking-tight text-white leading-tight">
              {dna.projectName}
            </h1>
            <p className="font-body-md text-white/80 text-xs md:text-sm">
              Methodology: <strong>{dna.methodology}</strong> • Smart Contract Token Standard: <strong>{dna.tokenStandard}</strong>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 self-start lg:self-auto min-w-[260px]">
            <div className="text-xs uppercase tracking-wider text-white/70">Verified Issued Volume</div>
            <div className="text-3xl font-extrabold text-tertiary-fixed font-mono-data">
              {dna.issuedQuantity.toLocaleString()} <span className="text-xs text-white/80">tCO2e</span>
            </div>
            <div className="flex justify-between text-xs text-white/80 pt-1 border-t border-white/15">
              <span>Active: {dna.availableQuantity.toLocaleString()}</span>
              <span>Retired: {dna.retiredQuantity.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Ledger Proof Banner */}
        <div className="p-4 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">fingerprint</span>
            <span className="text-white/70 font-semibold">Merkle Root Hash:</span>
            <span className="font-mono-data text-white truncate max-w-xs">{dna.merkleRoot}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyHash(dna.merkleRoot)}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors"
            >
              {isCopied ? 'Copied!' : 'Copy Hash'}
            </button>
            <a
              href={dna.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded bg-secondary text-on-secondary font-bold text-[11px] hover:bg-secondary/90 transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              PolygonScan
            </a>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30">
        {[
          { id: 'LINEAGE', label: 'Cryptographic Provenance Lineage', icon: 'timeline' },
          { id: 'BENEFITS', label: 'Ecosystem & Community Co-Benefits', icon: 'diversity_3' },
          { id: 'TECHNICAL', label: 'Smart Contract & Network Parameters', icon: 'code' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-t-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Provenance Lineage */}
      {activeTab === 'LINEAGE' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="font-headline-sm text-on-surface text-[18px] font-bold">5-Stage Verification & Tokenization Lineage</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Every unit of carbon in this vintage has an immutable audit trail signed by coastal communities, IoT sensors, third-party auditors, and national regulators.
            </p>
          </div>

          <div className="space-y-4">
            {dna.provenanceLineage.map((item) => (
              <div key={item.step} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs font-mono-data shrink-0 mt-0.5">
                    0{item.step}
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-on-surface">{item.event}</div>
                    <div className="text-xs text-on-surface-variant">
                      Authority: <strong className="text-on-surface">{item.actor}</strong> • Date: <span className="font-mono-data">{item.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-mono-data text-xs text-on-surface-variant bg-surface px-2.5 py-1 rounded border border-outline-variant/30">
                    {item.hash}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-secondary/10 text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Signed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Co-Benefits */}
      {activeTab === 'BENEFITS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dna.coBenefits.map((benefit, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">{benefit.icon}</span>
              </div>
              <div className="font-bold text-sm text-on-surface">{benefit.metric}</div>
              <div className="text-xl font-extrabold text-secondary font-mono-data">{benefit.value}</div>
              <p className="text-xs text-on-surface-variant">Direct measurable impact confirmed during third-party coastal MRV audit.</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Technical Parameters */}
      {activeTab === 'TECHNICAL' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-headline-sm text-on-surface font-bold text-[16px]">Smart Contract & Ledger Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1">
              <span className="text-on-surface-variant font-bold">Network:</span>
              <div className="font-mono-data text-on-surface">{dna.network}</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1">
              <span className="text-on-surface-variant font-bold">Smart Contract Address:</span>
              <a href={formatContractLink(dna.contractAddress)} target="_blank" rel="noreferrer" className="font-mono-data text-primary hover:underline block truncate">
                {dna.contractAddress}
              </a>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1">
              <span className="text-on-surface-variant font-bold">Block Number & Confirmations:</span>
              <div className="font-mono-data text-on-surface">Block #{dna.blockNumber} ({dna.confirmations} Confirmations)</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1">
              <span className="text-on-surface-variant font-bold">Canonical Data SHA-256 Hash:</span>
              <div className="font-mono-data text-on-surface truncate">{dna.dataHash}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
