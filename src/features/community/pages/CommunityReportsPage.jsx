import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { getReports, downloadReportPdf } from '../../../services/reportService';
import ReportPreviewModal from '../components/ReportPreviewModal';

export default function CommunityReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getReports();
        setReports(data);
      } catch (err) {
        setError('Failed to load reports. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleDownload = async (report) => {
    const reportKey = report.id || report.report_code;
    setDownloadingId(reportKey);
    setActionError(null);
    try {
      await downloadReportPdf(report);
    } catch (err) {
      console.error('PDF download error:', err);
      setActionError(`Failed to download PDF for ${report.report_code || report.title}. Please try again.`);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || r.report_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || r.report_type === typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = ['All', ...new Set(reports.map(r => r.report_type || r.type).filter(Boolean))];

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Access generated impact reports, MRV summaries, and financial analytics for community projects."
      />

      {actionError && (
        <div className="p-3 bg-error/10 text-error rounded-xl border border-error/20 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="text-error hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
        <div className="relative flex-1 w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-2.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-4 pr-10 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-body-md text-on-surface"
          >
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-error/10 text-error rounded-xl border border-error/20">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReports.map((report, i) => (
            <Card key={report.id || i} hover className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{report.report_type === 'Financial' || report.type === 'Financial' ? 'account_balance' : report.report_type === 'MRV Audit' || report.type === 'MRV Audit' ? 'verified' : 'analytics'}</span>
                  </div>
                  <div>
                    <span className="font-mono-data text-xs text-on-surface-variant">{report.report_code || `REP-${report.id?.substring(0, 4)}`}</span>
                    <h3 className="font-title-md font-bold text-on-surface leading-tight line-clamp-1" title={report.title}>{report.title}</h3>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-on-surface-variant line-clamp-2 min-h-[40px]">
                {report.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                 <span className="px-2 py-1 bg-surface-container-high rounded-md text-on-surface-variant font-semibold">
                   {report.period}
                 </span>
                 <span className="px-2 py-1 bg-surface-container-high rounded-md text-on-surface-variant font-semibold">
                   {report.report_type || report.type}
                 </span>
              </div>

              <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Generated On</span>
                  <span className="font-mono-data text-xs">{report.dateGenerated || report.date || report.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon="visibility" onClick={() => setSelectedReport(report)}>View</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="download"
                    disabled={downloadingId === (report.id || report.report_code)}
                    onClick={() => handleDownload(report)}
                  >
                    {downloadingId === (report.id || report.report_code) ? '...' : 'PDF'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filteredReports.length === 0 && (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              No reports found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* Report Preview Modal */}
      <ReportPreviewModal
        report={selectedReport}
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

