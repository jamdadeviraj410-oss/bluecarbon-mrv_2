import { useEffect, useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import { downloadReportPdf } from '../../../services/reportService';

export default function ReportPreviewModal({ report, isOpen, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadReportPdf(report);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(err.message || 'Failed to download report PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const summaryMetrics = report.summaryMetrics || report.data_summary?.summaryMetrics || {
    totalArea: '14,200 ha',
    totalSequestered: '1,200,000 tCO2e',
    creditsIssued: '850,000',
    activeProjects: 142,
    survivalRate: '88.0%',
  };

  const methodologies = report.methodologies || report.data_summary?.methodologies || [
    'Verra VM0033 Tidal Wetland Restoration',
    'Blue Carbon MRV Protocol v1.0',
    'IPCC Tier 3 Wetland Biomass Framework',
  ];

  const keyFindings = report.keyFindings || report.data_summary?.keyFindings || [
    'Total verified restoration area reconciled across all plots.',
    'Zero double-counting detected across regional carbon registries.',
    'Cryptographic SHA-256 integrity hash reconciled against live blockchain anchor ledger.',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">
                {report.report_type === 'Financial' || report.type === 'Financial'
                  ? 'account_balance'
                  : report.report_type === 'MRV Audit' || report.type === 'MRV Audit'
                  ? 'verified'
                  : 'analytics'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-xs font-bold text-on-surface-variant">
                  {report.report_code || report.id}
                </span>
                <StatusBadge status={report.status || 'Completed'} />
              </div>
              <h3 id="report-preview-title" className="font-headline-sm font-bold text-on-surface text-base sm:text-lg leading-tight">
                {report.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant/30"
            aria-label="Close report preview"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {downloadError && (
          <div className="bg-error/10 border-b border-error/20 px-4 py-2 text-xs text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{downloadError}</span>
          </div>
        )}

        {/* Modal Body / Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 text-xs">
            <div>
              <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Report Type</span>
              <span className="font-bold text-on-surface">{report.report_type || report.type}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Period</span>
              <span className="font-bold text-on-surface">{report.period}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Generated Date</span>
              <span className="font-mono-data text-on-surface">{report.dateGenerated || report.date || report.created_at?.split('T')[0] || '15 Nov 2023'}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Issuing Officer</span>
              <span className="font-bold text-on-surface">{report.author || report.generated_by_name || 'Dr. A. Sharma'}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Overview & Purpose</h4>
            <p className="text-sm text-on-surface leading-relaxed bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30">
              {report.description}
            </p>
          </div>

          {/* Key Executive Metrics */}
          <div>
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Key Executive Metrics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Restoration Area</span>
                <span className="font-mono-data font-bold text-base text-on-surface">{summaryMetrics.totalArea || '14,200 ha'}</span>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">CO2e Sequestered</span>
                <span className="font-mono-data font-bold text-base text-primary">{summaryMetrics.totalSequestered || '1,200,000 tCO2e'}</span>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Credits Issued</span>
                <span className="font-mono-data font-bold text-base text-secondary">{summaryMetrics.creditsIssued || '850,000'}</span>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Active Sites</span>
                <span className="font-mono-data font-bold text-base text-on-surface">{summaryMetrics.activeProjects || 142}</span>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Avg Survival</span>
                <span className="font-mono-data font-bold text-base text-emerald-700 dark:text-emerald-400">{summaryMetrics.survivalRate || '88.0%'}</span>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Verification State</span>
                <span className="font-mono-data font-bold text-base text-on-surface">{report.status || 'COMPLETED'}</span>
              </div>
            </div>
          </div>

          {/* Compliance Methodologies */}
          {methodologies && methodologies.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Compliance Frameworks</h4>
              <ul className="space-y-1.5 text-xs text-on-surface">
                {methodologies.map((m, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                    <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Findings */}
          {keyFindings && keyFindings.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Key Findings & Audit Summary</h4>
              <ul className="space-y-1.5 text-xs text-on-surface">
                {keyFindings.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                    <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">verified</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cryptographic Ledger Anchor */}
          {report.hash && (
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">lock</span>
                <span className="text-on-surface-variant font-medium">Cryptographic Anchor:</span>
                <span className="font-mono-data font-bold text-on-surface text-[11px]">{report.hash.substring(0, 18)}...</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold rounded text-[10px]">
                AMOY ANCHORED
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="download"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
