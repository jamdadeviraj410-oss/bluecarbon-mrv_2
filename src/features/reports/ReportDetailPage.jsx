import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReportById, downloadReportFile } from './reportsService';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const report = useMemo(() => {
    return getReportById(id);
  }, [id]);

  const handleDownload = () => {
    if (report) {
      downloadReportFile(report);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 gap-6 font-body-md text-on-surface">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
          <Link to="/admin/reports" className="hover:text-primary transition-colors">
            Reports & Analytics
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">{report.id}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/60 text-xs font-label-md text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </button>
      </div>

      {/* Report Header Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">description</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-data text-xs px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                {report.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-xs font-semibold">
                {report.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-xs font-semibold">
                {report.format}
              </span>
            </div>
            <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface m-0 tracking-tight">
              {report.title}
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant m-0">
              Period: <span className="font-semibold text-on-surface">{report.period}</span> • Generated:{' '}
              <span className="font-semibold text-on-surface">
                {new Date(report.dateGenerated).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleDownload}
            className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download {report.format}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-outline-variant/60 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant block uppercase tracking-wider">
            Total Restoration Area
          </span>
          <span className="font-headline-md text-2xl font-bold text-on-surface mt-1 block">
            {report.summaryMetrics?.totalArea || '14,200 ha'}
          </span>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-outline-variant/60 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant block uppercase tracking-wider">
            Gross CO2e Sequestered
          </span>
          <span className="font-headline-md text-2xl font-bold text-secondary mt-1 block">
            {report.summaryMetrics?.totalSequestered || '1.2M tCO2e'}
          </span>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-outline-variant/60 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant block uppercase tracking-wider">
            Verified Credits Issued
          </span>
          <span className="font-headline-md text-2xl font-bold text-primary mt-1 block">
            {report.summaryMetrics?.creditsIssued || '850,000'}
          </span>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-outline-variant/60 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant block uppercase tracking-wider">
            Avg. Survival Rate
          </span>
          <span className="font-headline-md text-2xl font-bold text-on-surface mt-1 block">
            {report.summaryMetrics?.survivalRate || '88.0%'}
          </span>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Summary & Findings (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-lg text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
              Executive Summary
            </h3>
            <p className="font-body-md text-sm text-on-surface leading-relaxed">{report.description}</p>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-lg text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">fact_check</span>
              Key Verification Findings & Scientific Metrics
            </h3>
            <ul className="flex flex-col gap-3 pl-2">
              {(report.keyFindings || []).map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 flex-shrink-0">
                    check_circle
                  </span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Audit Sign-Off & Methodologies (1 col) */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-lg text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
              Methodology Compliance
            </h3>
            <div className="flex flex-col gap-2.5">
              {(report.methodologies || []).map((method, idx) => (
                <div key={idx} className="p-3 bg-surface-container-low rounded-lg text-xs font-medium text-on-surface">
                  {method}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-lg text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
              Cryptographic Audit Proof
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="text-on-surface-variant block font-label-md uppercase">Issuing Body</span>
                <span className="font-semibold text-on-surface">{report.author}</span>
                <span className="text-on-surface-variant block text-[11px]">{report.authorRole}</span>
              </div>
              <div className="border-t border-outline-variant/40 pt-2">
                <span className="text-on-surface-variant block font-label-md uppercase">Report Hash</span>
                <span className="font-mono-data text-primary break-all">{report.hash}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
