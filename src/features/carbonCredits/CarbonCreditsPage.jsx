import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getCarbonCredits,
  getCarbonCreditStats,
  exportCarbonCreditsCSV,
  retireCarbonCredit,
  carbonCreditMethodologies,
} from './carbonCreditsService';
import StatusBadge from '../../components/common/StatusBadge';
import { formatNumber } from '../../utils/formatters';

export default function CarbonCreditsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMethodology, setSelectedMethodology] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Retire Modal State
  const [retireTargetCredit, setRetireTargetCredit] = useState(null);
  const [retireAmount, setRetireAmount] = useState('');
  const [retireBeneficiary, setRetireBeneficiary] = useState('');
  const [retireReason, setRetireReason] = useState('');
  const [retirementSuccess, setRetirementSuccess] = useState(null);
  const [retireError, setRetireError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => getCarbonCreditStats(), [retirementSuccess]);

  const filteredCredits = useMemo(() => {
    return getCarbonCredits({
      search: searchTerm,
      status: selectedStatus,
      methodology: selectedMethodology,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedStatus, selectedMethodology, retirementSuccess]);

  const totalPages = Math.ceil(filteredCredits.length / pageSize) || 1;
  const paginatedCredits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCredits.slice(start, start + pageSize);
  }, [filteredCredits, currentPage]);

  const handleExport = () => {
    const csvData = exportCarbonCreditsCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bluecarbon-credits-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenRetireModal = (credit) => {
    setRetireTargetCredit(credit);
    setRetireAmount(Math.min(100, credit.available || 0).toString());
    setRetireBeneficiary('');
    setRetireReason('Voluntary Climate Commitment 2026');
    setRetireError('');
  };

  const handleConfirmRetire = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(retireAmount);
    if (!amountNum || amountNum <= 0) {
      setRetireError('Please enter a valid credit amount to retire.');
      return;
    }
    if (amountNum > retireTargetCredit.available) {
      setRetireError(`Amount exceeds available balance (${retireTargetCredit.available} tCO2e).`);
      return;
    }
    if (!retireBeneficiary.trim()) {
      setRetireError('Please specify the retirement beneficiary organization or individual.');
      return;
    }

    try {
      const result = await retireCarbonCredit(
        retireTargetCredit.id,
        amountNum,
        retireBeneficiary.trim(),
        retireReason.trim()
      );

      if (result.success) {
        setRetirementSuccess(result);
        setRetireTargetCredit(null);
      } else {
        setRetireError(result.message || 'Failed to retire credits.');
      }
    } catch (err) {
      setRetireError(err.message || 'Failed to retire credits.');
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 max-w-[1440px] mx-auto font-body-md text-on-surface">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant font-mono-data text-xs mb-1">
            <span>REGISTRY</span>
            <span>/</span>
            <span className="text-primary font-semibold">CARBON CREDITS</span>
          </div>
          <h1 className="font-headline-lg text-primary tracking-tight">Blue Carbon Credits</h1>
          <p className="font-body-md text-on-surface-variant mt-1 max-w-2xl">
            Manage, verify, and retire high-integrity coastal carbon credits derived from rigorous MRV measurements and blockchain provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/blockchain"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary text-primary font-title-md hover:bg-surface-container transition-all shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span>Ledger Registry</span>
          </Link>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-title-md hover:bg-primary-container transition-all shadow-sm active:scale-[0.98] text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Credits</span>
          </button>
        </div>
      </div>

      {/* Retirement Success Notification Banner */}
      {retirementSuccess && (
        <div className="p-4 bg-secondary-container/20 border border-secondary rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">check</span>
            </div>
            <div>
              <div className="font-title-md text-primary font-bold">
                Successfully Retired {formatNumber(retirementSuccess.amount)} tCO2e Credits
              </div>
              <div className="text-xs text-on-surface-variant font-mono-data">
                Certificate ID: {retirementSuccess.certificateId} • Beneficiary: {retirementSuccess.beneficiary}
              </div>
            </div>
          </div>
          <button
            onClick={() => setRetirementSuccess(null)}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-primary flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">Total Carbon Volume</span>
            <span className="material-symbols-outlined text-primary bg-primary-container/20 p-1.5 rounded-lg text-[20px]">token</span>
          </div>
          <div className="font-headline-lg text-primary font-mono-data tracking-tight">
            {formatNumber(stats.totalVolume)} <span className="text-title-md text-on-surface-variant">tCO2e</span>
          </div>
          <div className="text-xs text-secondary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span> 100% MRV Audited
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-secondary flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">Available Balance</span>
            <span className="material-symbols-outlined text-secondary bg-secondary-container/30 p-1.5 rounded-lg text-[20px]">eco</span>
          </div>
          <div className="font-headline-lg text-secondary font-mono-data tracking-tight">
            {formatNumber(stats.totalAvailable)} <span className="text-title-md text-on-surface-variant">tCO2e</span>
          </div>
          <div className="text-xs text-on-surface-variant">Ready for retirement or transfer</div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-tertiary-fixed-dim flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">Retired Credits</span>
            <span className="material-symbols-outlined text-tertiary-fixed-dim bg-tertiary-container/30 p-1.5 rounded-lg text-[20px]">verified</span>
          </div>
          <div className="font-headline-lg text-on-surface font-mono-data tracking-tight">
            {formatNumber(stats.totalRetired)} <span className="text-title-md text-on-surface-variant">tCO2e</span>
          </div>
          <div className="text-xs text-outline">Permanently claimed offsets</div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-t-4 border-inverse-surface flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">Total Asset Valuation</span>
            <span className="material-symbols-outlined text-inverse-surface bg-inverse-on-surface p-1.5 rounded-lg text-[20px]">payments</span>
          </div>
          <div className="font-headline-lg text-on-surface font-mono-data tracking-tight">
            ${formatNumber(stats.totalValue)}
          </div>
          <div className="text-xs text-on-surface-variant">Avg: $13.25 / tCO2e</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search credits, projects, or verification ID..."
            className="w-full pl-10 pr-3 py-2 bg-surface-container rounded-lg font-body-md text-on-surface placeholder-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm border border-transparent focus:border-outline-variant"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface-container px-3 py-1.5 rounded-lg text-xs font-body-md border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Active">Active</option>
              <option value="Minted">Minted</option>
              <option value="Pending">Pending</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Methodology:</span>
            <select
              value={selectedMethodology}
              onChange={(e) => {
                setSelectedMethodology(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface-container px-3 py-1.5 rounded-lg text-xs font-body-md border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[200px]"
            >
              {carbonCreditMethodologies.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedStatus !== 'All' || selectedMethodology !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('All');
                setSelectedMethodology('All');
                setCurrentPage(1);
              }}
              className="text-primary hover:text-primary-container text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Carbon Credits Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col border border-surface-container-high">
        <div className="px-6 py-4 border-b border-surface-container-high bg-surface flex justify-between items-center">
          <h2 className="font-title-lg text-on-surface text-base sm:text-lg">Credit Certificates & Inventory</h2>
          <span className="font-label-md text-on-surface-variant bg-surface-container px-3 py-1 rounded-full text-xs">
            Viewing {paginatedCredits.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredCredits.length)} of {filteredCredits.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low text-label-md text-on-surface-variant uppercase tracking-wider text-[11px] border-b border-surface-container-high">
                <th className="py-3 px-4 font-semibold">Credit ID</th>
                <th className="py-3 px-4 font-semibold">Project & Org</th>
                <th className="py-3 px-4 font-semibold text-center">Vintage</th>
                <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                <th className="py-3 px-4 font-semibold text-right">Available</th>
                <th className="py-3 px-4 font-semibold">Methodology</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-body-md">
              {paginatedCredits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-outline">token</span>
                      <span>No carbon credits match your current filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCredits.map((credit) => (
                  <tr key={credit.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="py-3.5 px-4 font-mono-data">
                      <Link
                        to={`/admin/carbon-credits/${credit.id}`}
                        className="text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>{credit.id}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-title-md text-on-surface text-sm font-medium line-clamp-1">
                        {credit.projectName}
                      </div>
                      <div className="text-xs text-on-surface-variant truncate">
                        {credit.organization}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-data text-xs">
                      {credit.vintage || '2026'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-data font-semibold">
                      {formatNumber(credit.quantity)} <span className="text-[11px] font-normal text-on-surface-variant">tCO2e</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-data text-secondary font-semibold">
                      {formatNumber(credit.available)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant truncate max-w-[150px]">
                      {credit.methodology}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={credit.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/admin/carbon-credits/${credit.id}`}
                          className="px-2.5 py-1 text-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold transition-colors flex items-center gap-1"
                          title="View Official Certificate"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          <span>Certificate</span>
                        </Link>
                        {credit.available > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenRetireModal(credit)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-secondary-container/30 hover:bg-secondary-container/60 text-on-secondary-container font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Retire Credits"
                          >
                            <span className="material-symbols-outlined text-[15px]">eco</span>
                            <span>Retire</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-surface-container-high bg-surface-container-lowest flex justify-end items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 text-on-surface-variant hover:bg-surface-container rounded-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Page"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="font-body-md text-on-surface-variant text-sm">
            <span className="text-on-surface font-semibold">{currentPage}</span> / {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 text-on-surface-variant hover:bg-surface-container rounded-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next Page"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Retire Credits Modal */}
      {retireTargetCredit && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full border border-outline-variant/40 overflow-hidden flex flex-col animate-scaleUp">
            <div className="p-5 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">eco</span>
                <span className="font-title-lg text-primary text-base sm:text-lg">Retire Blue Carbon Credits</span>
              </div>
              <button
                onClick={() => setRetireTargetCredit(null)}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmRetire} className="p-6 flex flex-col gap-4">
              <div className="p-3 bg-surface-container rounded-xl text-xs flex flex-col gap-1">
                <span className="text-on-surface-variant font-mono-data">Credit ID: {retireTargetCredit.id}</span>
                <span className="font-bold text-primary">{retireTargetCredit.projectName}</span>
                <span className="text-secondary font-semibold">
                  Available Balance: {formatNumber(retireTargetCredit.available)} tCO2e
                </span>
              </div>

              {retireError && (
                <div className="p-3 bg-error-container text-on-error-container text-xs rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{retireError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface font-semibold uppercase text-[11px]">
                  Quantity to Retire (tCO2e)
                </label>
                <input
                  type="number"
                  min="1"
                  max={retireTargetCredit.available}
                  value={retireAmount}
                  onChange={(e) => setRetireAmount(e.target.value)}
                  className="px-3 py-2 bg-surface-container rounded-lg font-body-md text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface font-semibold uppercase text-[11px]">
                  Retirement Beneficiary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Environmental Fund"
                  value={retireBeneficiary}
                  onChange={(e) => setRetireBeneficiary(e.target.value)}
                  className="px-3 py-2 bg-surface-container rounded-lg font-body-md text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface font-semibold uppercase text-[11px]">
                  Retirement Purpose / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scope 1 & 2 Annual Carbon Neutrality"
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  className="px-3 py-2 bg-surface-container rounded-lg font-body-md text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg text-xs text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">verified</span>
                <span>
                  Retirement is irreversible. Once retired, these credits will be permanently removed from circulation and tokenized as claimed on the ledger.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRetireTargetCredit(null)}
                  className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-title-md text-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-on-secondary rounded-lg font-title-md text-sm hover:bg-secondary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Confirm Retirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
