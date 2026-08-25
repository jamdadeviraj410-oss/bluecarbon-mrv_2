import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCarbonCreditById } from './carbonCreditsService';
import { formatNumber } from '../../utils/formatters';

export default function CarbonCreditDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const credit = useMemo(() => getCarbonCreditById(id), [id]);

  const handleCopy = (text, setter) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleDownloadCertificate = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      window.print();
    }, 400);
  };

  if (!credit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
        <h2 className="font-headline-md text-primary">Carbon Credit Not Found</h2>
        <p className="text-body-md text-on-surface-variant">
          No carbon credit found for identifier "{id}".
        </p>
        <button
          onClick={() => navigate('/admin/carbon-credits')}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-title-md hover:bg-primary-container transition-colors"
        >
          Return to Carbon Credits
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 max-w-[1440px] mx-auto font-body-md text-on-surface">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display-lg text-primary text-2xl sm:text-3xl lg:text-4xl tracking-tight">Carbon Credit Details</h1>
            <span className="px-3 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-md flex items-center gap-1 border border-secondary-container text-xs">
              <span className="material-symbols-outlined text-[16px]">verified</span> Verified
            </span>
          </div>
          <p className="font-body-lg text-on-surface-variant">
            Official certificate and audit record for verified blue carbon sequestration.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono-data text-on-surface-variant px-2.5 py-1 bg-surface-container-low rounded border border-outline-variant/30 text-xs">
              ID: {credit.id}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            to={`/admin/projects/${credit.projectId}`}
            className="px-4 py-2 rounded-lg border border-primary-container text-primary-container font-title-md hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
            <span>View Project</span>
          </Link>
          <Link
            to={`/admin/blockchain`}
            className="px-4 py-2 rounded-lg border border-primary-container text-primary-container font-title-md hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">link</span>
            <span>View Blockchain Record</span>
          </Link>
          <button
            onClick={handleDownloadCertificate}
            disabled={isDownloading}
            className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-title-md hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDownloading ? 'hourglass_top' : 'download'}
            </span>
            <span>{isDownloading ? 'Preparing...' : 'Download Certificate'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-[3px] border-secondary-fixed relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-xl group-hover:bg-secondary-container/30 transition-colors"></div>
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block mb-2 relative z-10 text-[11px]">
            CO2e Quantity
          </span>
          <div className="flex items-end gap-2 relative z-10">
            <span className="font-headline-lg text-on-surface font-mono-data tracking-tight">
              {formatNumber(credit.quantity)}
            </span>
            <span className="font-title-md text-on-surface-variant pb-1">tCO2e</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-secondary font-semibold text-xs relative z-10">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Verified Sequestered</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-[3px] border-primary-fixed relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed/20 rounded-full blur-xl group-hover:bg-primary-fixed/30 transition-colors"></div>
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block mb-2 relative z-10 text-[11px]">
            Issue Date
          </span>
          <div className="flex items-end gap-2 relative z-10">
            <span className="font-headline-lg text-on-surface font-mono-data tracking-tight">
              {credit.issuedDate ? credit.issuedDate.split(' ')[0] + ' ' + (credit.issuedDate.split(' ')[1] || '') : 'Pending'}
            </span>
            <span className="font-title-md text-on-surface-variant pb-1">
              {credit.vintage || '2026'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-on-surface-variant text-xs relative z-10">
            <span className="material-symbols-outlined text-primary text-[16px]">calendar_month</span>
            <span>Issued Time</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-[3px] border-tertiary-fixed relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary-fixed/20 rounded-full blur-xl group-hover:bg-tertiary-fixed/30 transition-colors"></div>
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block mb-2 relative z-10 text-[11px]">
            Methodology
          </span>
          <div className="flex flex-col justify-end h-10 relative z-10">
            <span className="font-title-md text-on-surface truncate">{credit.methodology}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-on-surface-variant text-xs relative z-10">
            <span className="material-symbols-outlined text-tertiary-container text-[16px]">science</span>
            <span>Framework</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-[3px] border-outline-variant relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-variant/30 rounded-full blur-xl group-hover:bg-surface-variant/50 transition-colors"></div>
          <span className="font-label-md text-on-surface-variant uppercase tracking-wider block mb-2 relative z-10 text-[11px]">
            Verifier
          </span>
          <div className="flex flex-col justify-end h-10 relative z-10">
            <span className="font-title-md text-on-surface line-clamp-2 leading-tight text-sm font-semibold">
              {credit.verifier}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-on-surface-variant text-xs relative z-10">
            <span className="material-symbols-outlined text-outline text-[16px]">gavel</span>
            <span>Authority</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout (7 cols left, 5 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Verification Lifecycle */}
          <section className="flex flex-col gap-3 relative">
            <h2 className="font-headline-md text-on-background text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">route</span>
              <span>Verification Lifecycle</span>
            </h2>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high">
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-outline-variant"></div>

                {credit.lifecycle.map((step) => {
                  const isDone = step.status === 'completed';
                  return (
                    <div key={step.step} className="relative z-10 group">
                      <div
                        className={`absolute -left-6 mt-1 w-3 h-3 rounded-full ring-4 ring-surface-container-lowest transition-transform group-hover:scale-125 ${
                          isDone ? 'bg-secondary' : 'bg-surface-variant border border-outline-variant'
                        }`}
                      ></div>
                      <div className="flex flex-col gap-0.5 pl-3 transition-transform group-hover:translate-x-1">
                        <span className="font-title-md text-on-surface text-sm">{step.title}</span>
                        <span className="font-body-md text-on-surface-variant text-xs flex items-center gap-1">
                          {step.subtitle}
                          {step.link && (
                            <Link
                              to="/admin/mrv"
                              className="text-primary hover:underline text-xs flex items-center gap-0.5 font-medium ml-1"
                            >
                              <span>View Package</span>
                              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                            </Link>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 2: Blockchain Record (Slate dark card) */}
          <section className="flex flex-col gap-3">
            <h2 className="font-headline-md text-on-background text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">lan</span>
              <span>Blockchain Record</span>
            </h2>
            <div className="bg-inverse-surface p-6 rounded-xl shadow-lg relative overflow-hidden text-inverse-on-surface">
              {/* Subtle background SVG */}
              <svg
                className="absolute right-0 bottom-0 opacity-10 w-64 h-64 pointer-events-none"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M42.7,-73.4C55.9,-65.8,67.7,-55.1,76.5,-42.2C85.3,-29.3,91.1,-14.7,89.5,-0.9C87.9,12.9,78.9,25.8,70.1,38.2C61.3,50.6,52.7,62.5,41.1,70.1C29.5,77.7,14.7,81.1,0.5,80.3C-13.8,79.5,-27.6,74.5,-40.4,67.3C-53.2,60.1,-65.1,50.7,-74,38.8C-82.9,26.9,-88.9,13.4,-88.4,0.3C-87.9,-12.9,-80.9,-25.8,-71.8,-37.2C-62.7,-48.6,-51.5,-58.5,-39,-66.4C-26.5,-74.3,-13.2,-80.1,1.1,-82.1C15.5,-84.1,31,-82.3,42.7,-73.4Z"
                  fill="currentColor"
                  transform="translate(100 100)"
                ></path>
              </svg>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 relative z-10 font-mono-data text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Network</span>
                  <span className="font-title-md flex items-center gap-2 text-inverse-on-surface text-sm">
                    <div className="w-5 h-5 rounded-full bg-surface-container-low flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{credit.networkSymbol || 'P'}</span>
                    </div>
                    <span>{credit.network || 'Polygon POS'}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Block Number</span>
                  <span className="font-mono-data text-inverse-on-surface text-sm font-semibold">
                    {credit.blockNumber ? formatNumber(credit.blockNumber) : 'Pending...'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Smart Contract</span>
                  <div className="flex items-center gap-2 bg-surface/10 px-3 py-2 rounded-lg w-fit group">
                    <span className="font-mono-data text-inverse-on-surface truncate">
                      {credit.smartContract}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(credit.smartContract, setCopiedContract)}
                      className="text-on-surface-variant hover:text-inverse-on-surface transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedContract ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Transaction Hash</span>
                  <div className="flex items-center gap-2 bg-surface/10 px-3 py-2 rounded-lg w-fit group">
                    <span className="font-mono-data text-inverse-on-surface truncate max-w-[200px] sm:max-w-none">
                      {credit.blockchainHash || 'Pending on-chain confirmation...'}
                    </span>
                    {credit.blockchainHash && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopy(credit.blockchainHash, setCopiedTxHash)}
                          className="text-on-surface-variant hover:text-inverse-on-surface transition-colors cursor-pointer"
                          title="Copy Hash"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {copiedTxHash ? 'check' : 'content_copy'}
                          </span>
                        </button>
                        <Link
                          to="/admin/blockchain"
                          className="text-tertiary-fixed hover:underline text-xs flex items-center ml-2 gap-0.5"
                        >
                          <span>View on Explorer</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Token ID</span>
                  <span className="font-mono-data text-inverse-on-surface text-sm font-semibold">
                    {credit.tokenId || 'N/A'}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Timestamp</span>
                  <span className="font-mono-data text-inverse-on-surface text-xs">
                    {credit.timestamp || 'Pending execution'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols, sticky top-24): Official Certificate */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24 w-full min-w-0">
          <h2 className="font-headline-md text-on-background text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">workspace_premium</span>
            <span>Official Certificate</span>
          </h2>

          {/* Certificate Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant group hover:-translate-y-1 transition-transform duration-300 w-full min-w-0">
            <div className="relative p-6 sm:p-8 flex flex-col items-center text-center gap-5 border-b-[8px] border-primary-container bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-variant/40">
              <div className="relative z-10 w-full flex justify-between items-start">
                <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-on-primary text-[30px]">water_drop</span>
                </div>
                <div className="text-right">
                  <span className="block font-mono-data text-on-surface-variant text-[10px] uppercase">VERIFICATION ID</span>
                  <span className="block font-mono-data text-on-surface font-semibold text-xs">{credit.verificationId}</span>
                </div>
              </div>

              <div className="relative z-10 w-full space-y-3 mt-2">
                <h3 className="font-display-lg text-primary-container text-xl sm:text-2xl uppercase tracking-widest leading-tight">
                  Certificate of<br />Carbon Sequestration
                </h3>
                <div className="h-px w-20 bg-tertiary-container mx-auto"></div>
                <p className="font-body-lg text-on-surface italic w-full max-w-md mx-auto text-sm sm:text-base leading-relaxed px-2">
                  This certifies that{' '}
                  <strong className="font-headline-md text-on-surface not-italic block my-2 text-lg text-primary font-bold">
                    {formatNumber(credit.quantity)} tCO2e
                  </strong>{' '}
                  has been sequestered by {credit.projectName}.
                </p>
              </div>

              <div className="relative z-10 w-full flex justify-between items-end mt-4 pt-4 border-t border-outline-variant">
                <div className="text-left">
                  {/* Stylized Digital Signature Graphic */}
                  <div className="h-10 flex items-center">
                    <span className="font-serif italic text-primary text-xl font-bold tracking-wider underline decoration-wavy decoration-tertiary">
                      {credit.verifierSignatory || 'Dr. A. Sharma'}
                    </span>
                  </div>
                  <span className="block font-label-md text-on-surface uppercase text-[11px] font-semibold">
                    {credit.verifierSignatory || 'Dr. A. Sharma'}
                  </span>
                  <span className="block font-body-md text-on-surface-variant text-[11px]">
                    {credit.verifierTitle || 'Director, NCCR'}
                  </span>
                </div>

                {/* QR Code Simulation Box */}
                <div className="w-18 h-18 bg-surface-container p-2 rounded-lg flex flex-col items-center justify-center border border-outline-variant shadow-inner">
                  <span className="material-symbols-outlined text-[32px] text-on-surface">qr_code_2</span>
                  <span className="text-[9px] font-mono-data text-on-surface-variant font-bold">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadCertificate}
            className="w-full py-3 rounded-xl border-2 border-outline-variant text-on-surface font-title-md hover:bg-surface-container hover:border-primary-container transition-all flex items-center justify-center gap-2 mt-1 group shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform text-error">
              picture_as_pdf
            </span>
            <span>Download High-Resolution PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
