import { useState, useMemo } from 'react';
import {
  reportKPIs,
  areaByStateData,
  projectStatusDistribution,
  getGeneratedReports,
  generateNewReport,
  exportReportsCSV,
} from './reportsService';

export default function ReportsPage() {
  // Filter States
  const [dateRange, setDateRange] = useState('Last 12 Months');
  const [selectedState, setSelectedState] = useState('All States');
  const [projectType, setProjectType] = useState('All Types');
  const [mrvStatus, setMrvStatus] = useState('All Statuses');

  // Generator Form States
  const [formReportType, setFormReportType] = useState('National Summary Report');
  const [formFormat, setFormFormat] = useState('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);

  // Active Report Modal State
  const [activeReportModal, setActiveReportModal] = useState(null);

  // Reports List State
  const [reportsSearch, setReportsSearch] = useState('');
  const [reportsFilterType, setReportsFilterType] = useState('All');
  const [reportsList, setReportsList] = useState(() => getGeneratedReports());

  // Filtered Archive Reports
  const filteredReports = useMemo(() => {
    return reportsList.filter((rep) => {
      const matchSearch =
        !reportsSearch ||
        rep.title.toLowerCase().includes(reportsSearch.toLowerCase()) ||
        rep.id.toLowerCase().includes(reportsSearch.toLowerCase()) ||
        rep.type.toLowerCase().includes(reportsSearch.toLowerCase());
      const matchType =
        reportsFilterType === 'All' || rep.type === reportsFilterType || rep.format === reportsFilterType;
      return matchSearch && matchType;
    });
  }, [reportsList, reportsSearch, reportsFilterType]);

  // Handle Export All
  const handleExportAll = () => {
    const csv = exportReportsCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bluecarbon-reports-summary-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      type: 'success',
      message: 'Reports summary exported successfully as CSV.',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Generate Report Form Submit
  const handleGenerateSubmit = (e) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const generated = generateNewReport({
        reportType: formReportType,
        format: formFormat,
        dateRange: dateRange,
        state: selectedState,
        projectType: projectType,
      });

      // Update list
      setReportsList(getGeneratedReports());
      setIsGenerating(false);
      setActiveReportModal(generated);

      setNotification({
        type: 'success',
        message: `Successfully generated "${generated.title}" (${generated.format})`,
      });
      setTimeout(() => setNotification(null), 5000);
    }, 600);
  };

  // Handle Single Report Download Simulation
  const handleDownloadReport = (report) => {
    const content = `=====================================================
BLUECARBON MRV REGISTRY — OFFICIAL REPORT
=====================================================
Report ID: ${report.id}
Title: ${report.title}
Report Type: ${report.type}
Period: ${report.period}
Date Generated: ${report.dateGenerated}
Issuing Authority: ${report.author} (${report.authorRole})
Cryptographic Hash: ${report.hash}
Status: ${report.status}

-----------------------------------------------------
EXECUTIVE SUMMARY
-----------------------------------------------------
${report.description}

-----------------------------------------------------
KEY METRICS
-----------------------------------------------------
Total Restoration Area: ${report.summaryMetrics?.totalArea || '14,200 ha'}
Total Carbon Sequestered: ${report.summaryMetrics?.totalSequestered || '1,200,000 tCO2e'}
Verified Carbon Credits: ${report.summaryMetrics?.creditsIssued || '850,000'}
Projects Monitored: ${report.summaryMetrics?.activeProjects || 142}
Average Vegetation Survival: ${report.summaryMetrics?.survivalRate || '88.0%'}

-----------------------------------------------------
COMPLIANCE METHODOLOGIES
-----------------------------------------------------
${(report.methodologies || []).map((m, i) => `${i + 1}. ${m}`).join('\n')}

-----------------------------------------------------
KEY FINDINGS & AUDIT NOTES
-----------------------------------------------------
${(report.keyFindings || []).map((k) => `• ${k}`).join('\n')}

-----------------------------------------------------
END OF REPORT — SECURED VIA DISTRIBUTED LEDGER TECHNOLOGY
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.id}-${report.type.replace(/\s+/g, '_')}.${report.format.toLowerCase() === 'csv' ? 'csv' : 'txt'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      type: 'success',
      message: `Downloaded ${report.id} (${report.format})`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Scroll smoothly to generate form
  const scrollToGenerator = () => {
    const el = document.getElementById('report-generator-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 gap-6 font-body-md text-on-surface">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-primary text-on-primary rounded-xl shadow-xl border border-outline-variant/30 animate-in fade-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-secondary-fixed text-[22px]">check_circle</span>
          <span className="font-body-md text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-on-primary/70 hover:text-on-primary p-0.5 rounded"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-background font-semibold m-0 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="font-body-lg text-sm sm:text-base text-on-surface-variant m-0">
            Monitor national coastal restoration and carbon outcomes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={scrollToGenerator}
            className="flex-1 sm:flex-none bg-primary text-on-primary font-label-md px-4 py-2.5 rounded-lg hover:bg-primary-container transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">add_chart</span>
            Generate Report
          </button>
          <button
            onClick={handleExportAll}
            className="flex-1 sm:flex-none bg-surface border border-outline/30 font-label-md text-on-surface px-4 py-2.5 rounded-lg hover:bg-surface-container transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span> Export
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
          >
            <option>Last 12 Months</option>
            <option>Year to Date</option>
            <option>Custom Range</option>
            <option>Q4 2023</option>
            <option>Q3 2023</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            State
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
          >
            <option>All States</option>
            <option>Maharashtra</option>
            <option>Gujarat</option>
            <option>Tamil Nadu</option>
            <option>Andhra Pradesh</option>
            <option>West Bengal</option>
            <option>Kerala</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Project Type
          </label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
          >
            <option>All Types</option>
            <option>Mangrove</option>
            <option>Seagrass</option>
            <option>Salt Marsh</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            MRV Status
          </label>
          <select
            value={mrvStatus}
            onChange={(e) => setMrvStatus(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
          >
            <option>All Statuses</option>
            <option>Verified</option>
            <option>In Review</option>
            <option>Pending</option>
          </select>
        </div>

        <button
          onClick={() => {
            setDateRange('Last 12 Months');
            setSelectedState('All States');
            setProjectType('All Types');
            setMrvStatus('All Statuses');
          }}
          title="Reset filters"
          className="bg-surface-container text-on-surface hover:bg-surface-variant p-2.5 rounded-lg transition-colors border border-outline-variant cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
        </button>
      </div>

      {/* KPI Cards Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Restoration Area */}
        <div className="bg-surface p-4 rounded-xl shadow-sm border-t-4 border-t-[#003941] border border-outline-variant/60 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#003941]/10 rounded-full blur-xl group-hover:bg-[#003941]/20 transition-colors pointer-events-none"></div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {reportKPIs.totalRestorationArea.label}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display-lg text-3xl font-bold text-on-surface">
                {reportKPIs.totalRestorationArea.value}
              </span>
              <span className="font-title-md text-sm font-semibold text-on-surface-variant">
                {reportKPIs.totalRestorationArea.unit}
              </span>
            </div>
            <div className="flex items-center gap-1 text-secondary text-xs font-semibold mt-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>{reportKPIs.totalRestorationArea.change}</span>
            </div>
          </div>
        </div>

        {/* Card 2: CO2e Sequestered */}
        <div className="bg-surface p-4 rounded-xl shadow-sm border-t-4 border-t-primary-container border border-outline-variant/60 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-container/10 rounded-full blur-xl group-hover:bg-primary-container/20 transition-colors pointer-events-none"></div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {reportKPIs.co2eSequestered.label}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display-lg text-3xl font-bold text-on-surface">
                {reportKPIs.co2eSequestered.value}
              </span>
              <span className="font-title-md text-sm font-semibold text-on-surface-variant">
                {reportKPIs.co2eSequestered.unit}
              </span>
            </div>
            <div className="flex items-center gap-1 text-secondary text-xs font-semibold mt-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>{reportKPIs.co2eSequestered.change}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Verified Credits */}
        <div className="bg-surface p-4 rounded-xl shadow-sm border-t-4 border-t-[#00abc1] border border-outline-variant/60 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#00abc1]/10 rounded-full blur-xl group-hover:bg-[#00abc1]/20 transition-colors pointer-events-none"></div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {reportKPIs.verifiedCredits.label}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display-lg text-3xl font-bold text-on-surface">
                {reportKPIs.verifiedCredits.value}
              </span>
            </div>
            <div className="flex items-center gap-1 text-secondary text-xs font-semibold mt-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>{reportKPIs.verifiedCredits.change}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Projects Verified */}
        <div className="bg-surface p-4 rounded-xl shadow-sm border-t-4 border-t-outline border border-outline-variant/60 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-outline/10 rounded-full blur-xl group-hover:bg-outline/20 transition-colors pointer-events-none"></div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {reportKPIs.projectsVerified.label}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display-lg text-3xl font-bold text-on-surface">
                {reportKPIs.projectsVerified.value}
              </span>
            </div>
            <div className="flex items-center gap-1 text-secondary text-xs font-semibold mt-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>{reportKPIs.projectsVerified.change}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Avg. Survival Rate */}
        <div className="bg-surface p-4 rounded-xl shadow-sm border-t-4 border-t-[#a0f399] border border-outline-variant/60 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#a0f399]/20 rounded-full blur-xl group-hover:bg-[#a0f399]/30 transition-colors pointer-events-none"></div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {reportKPIs.avgSurvivalRate.label}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display-lg text-3xl font-bold text-on-surface">
                {reportKPIs.avgSurvivalRate.value}
              </span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs font-semibold mt-1">
              <span className="material-symbols-outlined text-[16px]">horizontal_rule</span>
              <span>{reportKPIs.avgSurvivalRate.change}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (12 cols on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Charts & Analytics */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Carbon Sequestration Chart */}
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-title-lg text-lg font-semibold text-on-surface m-0">
                  Carbon Sequestration Over Time
                </h3>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  Cumulative national tCO2e growth vs issued carbon credit batches
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary"></span> 2020 – 2024
                </span>
              </div>
            </div>

            {/* Simulated Area Chart SVG */}
            <div className="w-full h-64 sm:h-72 relative border-b border-l border-outline-variant/60 flex items-end pt-4 pb-1 pl-1">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-outline w-full"></div>
                <div className="border-b border-dashed border-outline w-full"></div>
                <div className="border-b border-dashed border-outline w-full"></div>
                <div className="border-b border-dashed border-outline w-full"></div>
              </div>

              {/* SVG Area Chart */}
              <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#003366" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#003366" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="creditGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00abc1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#00abc1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Primary Sequestration Area */}
                <path d="M0 100 L0 85 Q 25 65, 50 45 T 75 20 L100 8 L100 100 Z" fill="url(#areaGradient)" />
                <path
                  d="M0 85 Q 25 65, 50 45 T 75 20 L100 8"
                  fill="none"
                  stroke="#003366"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Verified Credits Area */}
                <path d="M0 100 L0 90 Q 25 75, 50 60 T 75 40 L100 28 L100 100 Z" fill="url(#creditGradient)" />
                <path
                  d="M0 90 Q 25 75, 50 60 T 75 40 L100 28"
                  fill="none"
                  stroke="#00abc1"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Data Points */}
                <circle cx="0" cy="85" r="3" fill="#003366" />
                <circle cx="25" cy="65" r="3" fill="#003366" />
                <circle cx="50" cy="45" r="3" fill="#003366" />
                <circle cx="75" cy="20" r="3" fill="#003366" />
                <circle cx="100" cy="8" r="3.5" fill="#1b6d24" stroke="#ffffff" strokeWidth="1" />
              </svg>

              {/* Axis Labels */}
              <div className="absolute -bottom-6 left-0 w-full flex justify-between font-mono-data text-on-surface-variant text-[11px] px-1">
                <span>2020 (180k)</span>
                <span>2021 (420k)</span>
                <span>2022 (680k)</span>
                <span>2023 (990k)</span>
                <span className="font-semibold text-primary">2024 (1.2M tCO2e)</span>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 mt-8 pt-2 border-t border-outline-variant/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#003366]"></span>
                <span className="text-on-surface font-medium">Gross Carbon Sequestration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-sm bg-[#00abc1] border-b border-dashed border-[#00abc1]"></span>
                <span className="text-on-surface font-medium">Verified On-Chain Credits (850k)</span>
              </div>
            </div>
          </div>

          {/* Dual Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Area by State (ha) */}
            <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-title-lg text-base sm:text-lg font-semibold text-on-surface m-0">
                  Area by State (ha)
                </h3>
                <span className="text-xs text-on-surface-variant font-mono-data">Total: 14.2k ha</span>
              </div>

              <div className="flex flex-col gap-3">
                {areaByStateData.map((item) => (
                  <div key={item.state} className="flex items-center gap-3">
                    <span className="w-24 font-label-md text-xs font-semibold text-on-surface-variant text-right truncate">
                      {item.state}
                    </span>
                    <div className="flex-1 bg-surface-container rounded-full h-3.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                    <span className="font-mono-data text-xs text-on-surface font-medium w-12 text-right">
                      {item.display}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Status Doughnut */}
            <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-title-lg text-base sm:text-lg font-semibold text-on-surface m-0">
                  Project Status
                </h3>
                <span className="text-xs text-on-surface-variant font-mono-data">142 Sites</span>
              </div>

              <div className="flex items-center justify-center gap-6 py-2">
                {/* Visual Doughnut Chart */}
                <div
                  className="relative w-32 h-32 rounded-full border-[14px] border-surface-container flex items-center justify-center shadow-inner"
                  style={{
                    borderTopColor: '#003941',
                    borderRightColor: '#00abc1',
                    borderBottomColor: '#88d982',
                    borderLeftColor: '#003941',
                  }}
                >
                  <div className="bg-surface w-20 h-20 rounded-full absolute shadow-sm flex flex-col items-center justify-center">
                    <span className="font-title-md text-lg font-bold text-on-surface leading-none">142</span>
                    <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">Total</span>
                  </div>
                </div>

                {/* Status Legend */}
                <div className="flex flex-col gap-2.5">
                  {projectStatusDistribution.map((status) => (
                    <div key={status.status} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.dotColor}`}></div>
                      <span className="font-label-md text-xs text-on-surface-variant">
                        {status.status} <span className="font-bold text-on-surface">({status.percentage}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Reports Archive Section */}
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="font-title-lg text-base sm:text-lg font-semibold text-on-surface m-0">
                  Generated Reports Archive
                </h3>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  Access and download validated compliance reports & telemetry logs
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-52">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={reportsSearch}
                    onChange={(e) => setReportsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <select
                  value={reportsFilterType}
                  onChange={(e) => setReportsFilterType(e.target.value)}
                  className="bg-surface-container-low text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 font-label-md text-on-surface outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="PDF">PDF Only</option>
                  <option value="CSV">CSV Only</option>
                  <option value="National Summary Report">Summary</option>
                  <option value="MRV Verification Log">MRV Log</option>
                  <option value="Blockchain Audit Trail">Blockchain</option>
                </select>
              </div>
            </div>

            {/* Reports Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-xs uppercase tracking-wider border-b border-outline-variant/60">
                    <th className="py-2.5 px-3 font-semibold">Report ID</th>
                    <th className="py-2.5 px-3 font-semibold">Title</th>
                    <th className="py-2.5 px-3 font-semibold hidden md:table-cell">Period</th>
                    <th className="py-2.5 px-3 font-semibold">Format</th>
                    <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Size</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-surface-container/50 transition-colors group cursor-pointer"
                      onClick={() => setActiveReportModal(report)}
                    >
                      <td className="py-3 px-3 font-mono-data text-primary font-semibold whitespace-nowrap">
                        {report.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface group-hover:text-primary transition-colors max-w-xs sm:max-w-md truncate">
                          {report.title}
                        </div>
                        <div className="text-[11px] text-on-surface-variant truncate mt-0.5">{report.type}</div>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant hidden md:table-cell whitespace-nowrap">
                        {report.period}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-label-md font-semibold text-[11px] ${
                            report.format === 'PDF'
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-secondary-container text-on-secondary-container'
                          }`}
                        >
                          {report.format}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant font-mono-data hidden sm:table-cell whitespace-nowrap">
                        {report.size}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setActiveReportModal(report)}
                            title="Preview Report"
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => handleDownloadReport(report)}
                            title="Download Report"
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                        No reports matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Map Card & Report Generator */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Geographic Map Card */}
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-3 flex flex-col h-72 relative overflow-hidden group">
            <h3 className="font-title-md text-xs font-semibold text-on-surface absolute top-3 left-3 bg-surface/90 backdrop-blur px-2.5 py-1 rounded-md z-10 shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
              Project Locations
            </h3>
            <div
              className="w-full h-full bg-cover bg-center rounded-lg grayscale opacity-85 mix-blend-multiply transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 relative"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCrxUcsryifukdbT3YUw4CMkIqVshE--og2tgkgjUBT4inrkEBBprXHu92jPqSB_P-XahelsX8WeIGTHOD_De2qO0i67tU5lzd68fO1_P30k44OaZQGr-NttFybJ4RooBbWn72kXoywdhR47XGWSr__hnhyEdmdGvv-fWhmB0jVu45sPcZs_mhJWBbbCR5VpaEVYmauMJkXwM7AkiCIKhCnmKDJ1HnEYIr_kyuybHBdXh-VFEbuDmuZFw')`,
              }}
            >
              {/* Interactive Coastal Dots */}
              <div
                title="Ratnagiri: 14.2k tCO2e"
                className="absolute top-[52%] left-[34%] w-3 h-3 bg-[#00abc1] rounded-full shadow-[0_0_8px_rgba(0,188,212,0.8)] border border-white cursor-pointer hover:scale-150 transition-transform"
              ></div>
              <div
                title="Kutch Tidal Flats: 22.1k tCO2e"
                className="absolute top-[38%] left-[28%] w-3 h-3 bg-[#88d982] rounded-full shadow-[0_0_8px_rgba(136,217,130,0.8)] border border-white cursor-pointer hover:scale-150 transition-transform"
              ></div>
              <div
                title="Pichavaram: 42.5k tCO2e"
                className="absolute top-[72%] left-[45%] w-3.5 h-3.5 bg-[#003366] rounded-full shadow-[0_0_8px_rgba(0,51,102,0.8)] border border-white cursor-pointer hover:scale-150 transition-transform animate-pulse"
              ></div>
              <div
                title="Godavari Delta: 8.5k tCO2e"
                className="absolute top-[58%] left-[54%] w-3 h-3 bg-[#00abc1] rounded-full shadow-[0_0_8px_rgba(0,188,212,0.8)] border border-white cursor-pointer hover:scale-150 transition-transform"
              ></div>
              <div
                title="Sundarbans: 185.0k tCO2e"
                className="absolute top-[44%] left-[68%] w-3.5 h-3.5 bg-[#003941] rounded-full shadow-[0_0_8px_rgba(0,57,65,0.8)] border border-white cursor-pointer hover:scale-150 transition-transform"
              ></div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur rounded-lg p-2 text-[11px] text-on-surface-variant flex justify-between items-center">
              <span>6 Coastal State Clusters</span>
              <span className="font-semibold text-primary">142 Sites Mapped</span>
            </div>
          </div>

          {/* Report Generator Form */}
          <div
            id="report-generator-card"
            className="bg-surface rounded-xl shadow-sm border border-outline-variant p-5 sm:p-6 flex flex-col transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant">
              <span className="material-symbols-outlined text-primary text-[22px]">description</span>
              <h3 className="font-title-lg text-lg font-semibold text-on-surface m-0">Generate Report</h3>
            </div>

            <form onSubmit={handleGenerateSubmit} className="flex flex-col gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Report Type
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      checked={formReportType === 'National Summary Report'}
                      onChange={() => setFormReportType('National Summary Report')}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="font-body-md text-sm text-on-surface group-hover:text-primary transition-colors">
                      National Summary Report
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      checked={formReportType === 'MRV Verification Log'}
                      onChange={() => setFormReportType('MRV Verification Log')}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="font-body-md text-sm text-on-surface group-hover:text-primary transition-colors">
                      MRV Verification Log
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      checked={formReportType === 'Blockchain Audit Trail'}
                      onChange={() => setFormReportType('Blockchain Audit Trail')}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="font-body-md text-sm text-on-surface group-hover:text-primary transition-colors">
                      Blockchain Audit Trail
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      checked={formReportType === 'State Carbon Sequestration Assessment'}
                      onChange={() => setFormReportType('State Carbon Sequestration Assessment')}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="font-body-md text-sm text-on-surface group-hover:text-primary transition-colors">
                      State Coastal Assessment
                    </span>
                  </label>
                </div>
              </div>

              {/* Format Toggle */}
              <div className="flex flex-col gap-2 mt-1">
                <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Format
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormFormat('PDF')}
                    className={`flex-1 py-2 rounded-lg font-label-md text-xs font-semibold border transition-all cursor-pointer ${
                      formFormat === 'PDF'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormFormat('CSV')}
                    className={`flex-1 py-2 rounded-lg font-label-md text-xs font-semibold border transition-all cursor-pointer ${
                      formFormat === 'CSV'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormFormat('JSON')}
                    className={`flex-1 py-2 rounded-lg font-label-md text-xs font-semibold border transition-all cursor-pointer ${
                      formFormat === 'JSON'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-4 pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-primary text-on-primary font-title-md text-sm font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      Generating Assets...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">play_circle</span>
                      Generate Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Report Preview Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-lg font-bold text-on-surface leading-tight">
                    {activeReportModal.title}
                  </h3>
                  <p className="font-mono-data text-xs text-on-surface-variant mt-0.5">
                    {activeReportModal.id} • {activeReportModal.period}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5 text-sm">
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Executive Summary
                </span>
                <p className="font-body-md text-on-surface leading-relaxed">{activeReportModal.description}</p>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <span className="text-xs text-on-surface-variant block">Restoration Area</span>
                  <span className="text-base font-bold text-on-surface">
                    {activeReportModal.summaryMetrics?.totalArea || '14,200 ha'}
                  </span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <span className="text-xs text-on-surface-variant block">CO2e Sequestered</span>
                  <span className="text-base font-bold text-secondary">
                    {activeReportModal.summaryMetrics?.totalSequestered || '1.2M tCO2e'}
                  </span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-xs text-on-surface-variant block">Verified Credits</span>
                  <span className="text-base font-bold text-primary">
                    {activeReportModal.summaryMetrics?.creditsIssued || '850,000'}
                  </span>
                </div>
              </div>

              {/* Key Findings */}
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
                  Key Verification Findings
                </span>
                <ul className="flex flex-col gap-2 pl-4 list-disc text-on-surface">
                  {(activeReportModal.keyFindings || [
                    'All project telemetry matches ground-truth soil core calibration samples.',
                    'Zero double-counting detected across regional credit issuances.',
                  ]).map((finding, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Audit Proof Footer */}
              <div className="border-t border-outline-variant pt-4 flex flex-col gap-2 font-mono-data text-xs text-on-surface-variant">
                <div className="flex justify-between items-center">
                  <span>Author:</span>
                  <span className="text-on-surface font-sans font-medium">{activeReportModal.author}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cryptographic Hash:</span>
                  <span className="text-primary truncate ml-4">{activeReportModal.hash}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
              <button
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-2 rounded-xl text-on-surface font-label-md hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadReport(activeReportModal)}
                className="px-5 py-2 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download {activeReportModal.format}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
