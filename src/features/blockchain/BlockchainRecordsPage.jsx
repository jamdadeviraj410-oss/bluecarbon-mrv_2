import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getBlockchainRecords,
  getBlockchainStats,
  exportBlockchainRegistryCSV,
  isBlockchainDemoMode,
  setBlockchainDemoMode,
  fetchBlockchainRecordsFromSupabase,
} from './blockchainService';
import { truncateHash, formatNumber } from '../../utils/formatters';

export default function BlockchainRecordsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedPanelHash, setCopiedPanelHash] = useState(false);
  const [showDnaModal, setShowDnaModal] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(isBlockchainDemoMode());
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchBlockchainRecordsFromSupabase().finally(() => {
      setIsLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    return getBlockchainStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode, isLoading]);

  const filteredRecords = useMemo(() => {
    return getBlockchainRecords(
      {
        search: searchTerm,
        network: selectedNetwork,
        status: selectedStatus,
      },
      isDemoMode
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedNetwork, selectedStatus, isDemoMode, isLoading]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const selectedRecord = useMemo(() => {
    if (selectedRecordId) {
      const match = filteredRecords.find((r) => r.creditId === selectedRecordId || r.provenanceId === selectedRecordId);
      if (match) return match;
    }
    return filteredRecords[0] || null;
  }, [filteredRecords, selectedRecordId]);

  const handleToggleDemoMode = () => {
    const next = !isDemoMode;
    setIsDemoMode(next);
    setBlockchainDemoMode(next);
    setCurrentPage(1);
    setSelectedRecordId(null);
  };

  const handleCopy = (text, type = 'hash') => {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (type === 'contract') {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else if (type === 'panelHash') {
      setCopiedPanelHash(true);
      setTimeout(() => setCopiedPanelHash(false), 2000);
    } else {
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const handleExport = () => {
    const csvData = exportBlockchainRegistryCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bluecarbon-mrv-provenance-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 max-w-[1440px] mx-auto font-body-md text-on-surface">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-primary tracking-tight">Blockchain Carbon Registry</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-mono-data text-xs border border-secondary">
              {stats.activeNetworksCount > 0 ? 'Polygon Amoy (Chain 80002)' : 'Configured Blockchain Network'}
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant max-w-2xl">
            Immutable provenance and tamper-evident audit trail of verified blue carbon MRV records on configured blockchain networks.
          </p>
          <div className="inline-flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-full mt-1 shadow-sm w-fit">
            <span className="material-symbols-outlined text-secondary text-[16px] animate-pulse">verified_user</span>
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">Cryptographic MRV Integrity Secured</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Explicit Demo Mode Toggle Button */}
          <button
            type="button"
            onClick={handleToggleDemoMode}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-title-md text-xs transition-colors cursor-pointer border shadow-sm ${
              isDemoMode
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/50 hover:bg-amber-500/20'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
            }`}
            title="Toggle between live database and demo datasets"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDemoMode ? 'science' : 'labs'}
            </span>
            <span>{isDemoMode ? 'Demo Mode Active' : 'Switch to Demo Dataset'}</span>
          </button>

          <div className="relative flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-3 py-2 bg-surface-container rounded-lg font-body-md text-on-surface placeholder-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64 shadow-sm transition-shadow border border-transparent focus:border-outline-variant"
              placeholder="Search Txn, Hash, or ID"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 bg-surface-container rounded-lg font-title-md text-on-surface hover:bg-surface-container-highest transition-colors shadow-sm cursor-pointer ${
              showFilters || selectedNetwork !== 'All' || selectedStatus !== 'All' ? 'ring-2 ring-primary/20 bg-surface-container-high' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span>Filters</span>
            {(selectedNetwork !== 'All' || selectedStatus !== 'All') && (
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            )}
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-title-md hover:bg-primary-container transition-colors shadow-md hover:shadow-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Export Registry</span>
          </button>
        </div>
      </div>

      {/* Demo Mode Notice Banner */}
      {isDemoMode && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">science</span>
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5">Explicit Demo Dataset Mode Active</span>
              Viewing simulated reference records for demonstration. These records are not recorded in the production Supabase database. Click "Switch to Demo Dataset" again to return to live registry records.
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleDemoMode}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 rounded font-semibold text-[11px] whitespace-nowrap cursor-pointer"
          >
            Switch to Live Data
          </button>
        </div>
      )}

      {/* Filter Dropdown Bar */}
      {showFilters && (
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm flex flex-wrap items-center gap-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-label-md uppercase tracking-wider text-on-surface-variant">Network:</span>
            <select
              value={selectedNetwork}
              onChange={(e) => {
                setSelectedNetwork(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface-container px-3 py-1.5 rounded-lg text-body-md font-body-md border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Networks</option>
              <option value="Amoy">Polygon Amoy Testnet (80002)</option>
              <option value="Polygon">Polygon POS</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-label-md uppercase tracking-wider text-on-surface-variant">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface-container px-3 py-1.5 rounded-lg text-body-md font-body-md border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {(selectedNetwork !== 'All' || selectedStatus !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedNetwork('All');
                setSelectedStatus('All');
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="text-primary hover:text-primary-container text-label-md font-semibold ml-auto cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest p-4 lg:p-5 rounded-xl shadow-sm border-t-4 border-secondary flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between z-10">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wide">Total Credits Anchored</span>
            <span className="material-symbols-outlined text-secondary bg-secondary-container/50 p-1.5 rounded-md text-[20px]">
              workspace_premium
            </span>
          </div>
          <div className="font-headline-lg text-on-surface z-10 tracking-tight">{stats.totalCreditsIssued}</div>
          <div className="font-body-md text-secondary inline-flex items-center gap-1 z-10 text-[13px] font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span> {stats.totalCreditsIssuedChange}
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest p-4 lg:p-5 rounded-xl shadow-sm border-t-4 border-tertiary-fixed-dim flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between z-10">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wide">Total CO2e Verified</span>
            <span className="material-symbols-outlined text-tertiary-fixed-dim bg-tertiary-container/50 p-1.5 rounded-md text-on-tertiary text-[20px]">
              token
            </span>
          </div>
          <div className="font-headline-lg text-on-surface z-10 tracking-tight">
            {stats.totalCO2eTokenized} <span className="font-title-md text-on-surface-variant">tCO2e</span>
          </div>
          <div className="font-body-md text-outline z-10 text-[13px]">
            {stats.activeNetworksCount > 0 ? 'on Polygon Amoy Testnet' : 'On-chain Registry'}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest p-4 lg:p-5 rounded-xl shadow-sm border-t-4 border-primary flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between z-10">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wide">Verified Projects</span>
            <span className="material-symbols-outlined text-primary bg-primary-container/30 p-1.5 rounded-md text-[20px]">
              account_tree
            </span>
          </div>
          <div className="font-headline-lg text-on-surface z-10 tracking-tight">{stats.verifiedProjectsCount}</div>
          <div className="font-body-md text-on-surface-variant z-10 text-[13px]">Full Lineage Available</div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest p-4 lg:p-5 rounded-xl shadow-sm border-t-4 border-inverse-surface flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between z-10">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wide">Ledger Transactions</span>
            <span className="material-symbols-outlined text-inverse-surface bg-inverse-on-surface p-1.5 rounded-md text-[20px]">
              dataset
            </span>
          </div>
          <div className="font-headline-lg text-on-surface z-10 tracking-tight">{stats.blockchainTxnsCount}</div>
          <div className="font-body-md text-secondary inline-flex items-center gap-1 z-10 text-[13px]">
            <span className="material-symbols-outlined text-[16px]">sync</span> {stats.lastSynced}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Registry Table Area (Left 2/3) */}
        <div className="w-full lg:w-2/3 bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col border border-surface-container-high">
          <div className="px-6 py-4 border-b border-surface-container-high bg-surface flex justify-between items-center">
            <h2 className="font-title-lg text-on-surface">Provenanced Credit Registry</h2>
            <div className="flex gap-2">
              <span className="font-label-md text-on-surface-variant bg-surface-container px-3 py-1 rounded-full text-xs">
                Showing {paginatedRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container-high">
                  <th className="py-3 px-4 font-label-md text-on-surface-variant font-semibold whitespace-nowrap">Provenance ID</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant font-semibold whitespace-nowrap">Project</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant font-semibold text-right whitespace-nowrap">tCO2e</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant font-semibold whitespace-nowrap">Network</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant font-semibold whitespace-nowrap">Tx Hash</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant font-semibold text-center whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md divide-y divide-surface-container-high">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-outline">database</span>
                        <span>No blockchain records match your search criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => {
                    const isSelected = selectedRecord?.creditId === record.creditId;
                    return (
                      <tr
                        key={record.creditId}
                        onClick={() => setSelectedRecordId(record.creditId)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-primary/5 border-l-4 border-l-primary'
                            : 'hover:bg-primary/5 border-l-4 border-l-transparent'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span className={`font-mono-data font-semibold text-xs ${isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary group-hover:underline'}`}>
                            {record.creditId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface">
                          <div className="font-body-md font-medium text-on-surface line-clamp-1">{record.projectName}</div>
                          <div className="text-[12px] text-on-surface-variant">{record.organization}</div>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface font-mono-data text-right font-medium">
                          {record.tCO2e != null ? formatNumber(record.tCO2e) : <span className="text-xs text-on-surface-variant italic">Pending / Not Available</span>}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0"
                              style={{ backgroundColor: record.networkColor }}
                            >
                              {record.networkSymbol}
                            </div>
                            <span className="text-on-surface text-body-md text-xs">{record.network}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 text-on-surface-variant font-mono-data text-[12px]">
                            <span>{record.txHash ? truncateHash(record.txHash, 6, 4) : 'Pending Anchor'}</span>
                            {record.txHash && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(record.txHash);
                                }}
                                className="text-outline hover:text-primary transition-colors cursor-pointer"
                                title="Copy Hash"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {copiedHash === record.txHash ? 'check' : 'content_copy'}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {record.isDemo || record.isSimulated ? (
                            <div className="inline-flex items-center justify-center bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full gap-1 border border-amber-500/30">
                              <span className="material-symbols-outlined text-[14px]">science</span>
                              <span className="font-label-md text-[11px] font-semibold">DEMO / SIMULATION</span>
                            </div>
                          ) : record.status === 'Confirmed' && record.txHash ? (
                            <div className="inline-flex items-center justify-center bg-secondary-container/20 text-on-secondary-container px-2.5 py-0.5 rounded-full gap-1 border border-secondary-container">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              <span className="font-label-md text-[11px]">Confirmed</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center bg-surface-variant text-on-surface-variant px-2.5 py-0.5 rounded-full gap-1 border border-outline-variant">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              <span className="font-label-md text-[11px]">{record.status || 'Pending'}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
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

        {/* Right Detail Panel (Pinned for Selected Credit, 1/3) */}
        {selectedRecord && (
          <div className="w-full lg:w-1/3 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-high flex flex-col relative overflow-hidden lg:sticky lg:top-24">
            {/* Header / Banner Area */}
            <div className="p-5 lg:p-6 border-b border-surface-container-high bg-gradient-to-b from-primary/5 to-transparent relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">Credit DNA Profile</div>
                {selectedRecord.isDemo || selectedRecord.isSimulated ? (
                  <div className="bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border border-amber-500/30 inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">science</span>
                    <span>Demo Simulation</span>
                  </div>
                ) : selectedRecord.txHash ? (
                  <div className="bg-secondary-container/20 text-on-secondary-container px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border border-secondary-container inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>On-Chain Verified</span>
                  </div>
                ) : (
                  <div className="bg-surface-variant text-on-surface-variant px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border border-outline-variant inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>Pending On-Chain</span>
                  </div>
                )}
              </div>
              <h3 className="font-headline-md text-on-surface font-mono-data tracking-tight text-lg">{selectedRecord.creditId}</h3>
              <p className="font-body-md text-primary font-semibold mt-1 line-clamp-1">{selectedRecord.projectName}</p>
              
              {(selectedRecord.isDemo || selectedRecord.isSimulated) && (
                <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">info</span>
                  <span><strong>DEMO BLOCKCHAIN RECORD:</strong> Simulated for testing. Real immutable anchoring requires invoking the smart contract on Polygon Amoy.</span>
                </div>
              )}
              
              <div className="mt-4 bg-surface p-3 rounded-lg border border-surface-container-high flex items-center justify-between">
                <span className="font-body-md text-on-surface-variant text-sm">Quantity Verified</span>
                <span className="font-title-lg text-secondary font-mono-data text-base font-bold">
                  {selectedRecord.tCO2e != null ? (
                    <>
                      {formatNumber(selectedRecord.tCO2e)}{' '}
                      <span className="text-[12px] text-on-surface-variant font-body-md font-normal">tCO2e</span>
                    </>
                  ) : (
                    <span className="text-xs text-on-surface-variant font-normal italic">Pending / Not Available</span>
                  )}
                </span>
              </div>
            </div>

            {/* Panel Body */}
            <div className="p-5 lg:p-6 flex-1 overflow-y-auto z-10 flex flex-col gap-5">
              {/* Provenance Trace: Credit → Project → MRV → Verification → Evidence → Hash → Polygon */}
              <div>
                <h4 className="font-title-md text-on-surface mb-2 text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">alt_route</span>
                  <span>Provenance Lineage Trace</span>
                </h4>
                <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/30 flex flex-col gap-2 font-mono-data text-xs">
                  {selectedRecord.dnaTrace.map((node, index) => (
                    <div key={node.type} className="flex items-center justify-between text-[11px]">
                      <span className="text-outline uppercase font-semibold">{index + 1}. {node.type}</span>
                      <span className="text-primary font-medium truncate max-w-[170px]" title={node.code}>{node.code}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                <div>
                  <div className="font-label-md text-outline text-[11px] uppercase tracking-wider">Organization</div>
                  <div className="font-body-md text-on-surface font-medium truncate">{selectedRecord.organization}</div>
                </div>
                <div>
                  <div className="font-label-md text-outline text-[11px] uppercase tracking-wider">Issue Date</div>
                  <div className="font-body-md text-on-surface">{selectedRecord.issueDate}</div>
                </div>
                <div>
                  <div className="font-label-md text-outline text-[11px] uppercase tracking-wider">MRV Package</div>
                  <div className="font-body-md text-on-surface truncate">{selectedRecord.mrvCode}</div>
                </div>
                <div>
                  <div className="font-label-md text-outline text-[11px] uppercase tracking-wider">Auditor</div>
                  <div className="font-body-md text-on-surface truncate">{selectedRecord.auditor}</div>
                </div>
              </div>

              <div className="h-px bg-surface-container-high w-full"></div>

              {/* On-Chain Record Details */}
              <div className="flex flex-col gap-2">
                <h4 className="font-title-md text-on-surface mb-1 flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-[18px] text-outline">link</span>
                  <span>On-Chain Record Details</span>
                </h4>
                <div className="bg-surface-container rounded-lg p-3 flex flex-col gap-2 font-mono-data text-[12px]">
                  <div className="flex justify-between items-center">
                    <span className="text-outline">Network</span>
                    <span className="text-on-surface font-semibold flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedRecord.networkColor }}></div>
                      {selectedRecord.networkFull}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-outline">Contract</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedRecord.contractAddress, 'contract')}
                      className="text-primary hover:underline cursor-pointer flex items-center gap-1"
                      title="Copy Contract Address"
                    >
                      <span>{selectedRecord.contractAddressShort || truncateHash(selectedRecord.contractAddress, 6, 4)}</span>
                      <span className="material-symbols-outlined text-[13px]">
                        {copiedContract ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-outline">Block Height</span>
                    <span className="text-on-surface">{selectedRecord.blockNumber ? `#${selectedRecord.blockNumber}` : 'Pending...'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-outline-variant/30">
                    <span className="text-outline">Tx Hash</span>
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span>{selectedRecord.txHashShort || truncateHash(selectedRecord.txHash, 6, 4)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedRecord.txHash, 'panelHash')}
                        className="material-symbols-outlined text-[14px] cursor-pointer hover:text-primary transition-colors"
                        title="Copy Tx Hash"
                      >
                        {copiedPanelHash ? 'check' : 'content_copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Actions */}
            <div className="p-4 border-t border-surface-container-high bg-surface flex flex-col gap-2 z-10">
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/blockchain/${selectedRecord.creditId}`)}
                  className="flex-1 px-3 py-2 bg-primary text-on-primary font-title-md text-sm rounded-lg hover:bg-primary-container transition-colors text-center inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">biotech</span>
                  <span>Inspect Credit DNA</span>
                </button>
                <button
                  onClick={() => setShowDnaModal(true)}
                  className="px-3 py-2 border border-outline text-on-surface font-title-md text-sm rounded-lg hover:bg-surface-container-low transition-colors text-center cursor-pointer"
                  title="Quick View"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                </button>
              </div>
              {selectedRecord.explorerUrl && (
                <a
                  href={selectedRecord.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center text-xs text-primary hover:underline flex items-center justify-center gap-1"
                >
                  <span>Verify on Polygonscan Amoy</span>
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Credit DNA Quick Modal */}
      {showDnaModal && selectedRecord && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-3xl w-full border border-outline-variant/40 overflow-hidden flex flex-col animate-scaleUp">
            <div className="p-5 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">biotech</span>
                <span className="font-title-lg text-primary">Carbon Credit DNA & Provenance Fingerprint</span>
              </div>
              <button
                onClick={() => setShowDnaModal(false)}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 font-mono-data text-xs overflow-y-auto max-h-[75vh]">
              {/* DNA Flow */}
              <div className="bg-surface-container p-4 rounded-xl flex flex-col gap-3">
                <span className="text-outline uppercase text-[10px] font-bold">End-to-End Cryptographic Provenance Chain</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {selectedRecord.dnaTrace.map((node) => (
                    <div key={node.type} className="p-2 bg-surface rounded border border-outline-variant/30 flex flex-col gap-0.5">
                      <span className="text-secondary font-bold uppercase text-[9px]">{node.type}</span>
                      <span className="text-on-surface font-semibold truncate">{node.code}</span>
                      <span className="text-on-surface-variant text-[10px] truncate">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">Credit ID</span>
                  <span className="text-primary font-bold">{selectedRecord.creditId}</span>
                </div>
                <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">MRV Package</span>
                  <span className="text-on-surface font-bold">{selectedRecord.mrvCode}</span>
                </div>
                <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">Carbon Volume</span>
                  <span className="text-secondary font-bold">
                    {selectedRecord.tCO2e != null ? `${formatNumber(selectedRecord.tCO2e)} tCO2e` : 'Pending / Not Available'}
                  </span>
                </div>
                <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">Auditor</span>
                  <span className="text-on-surface font-bold">{selectedRecord.auditor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 bg-surface-container p-3 rounded-lg">
                <span className="text-outline uppercase text-[10px]">MRV Canonical SHA-256 Digest</span>
                <span className="text-on-surface-variant break-all font-mono">{selectedRecord.mrvHash}</span>
              </div>

              <div className="flex flex-col gap-1 bg-surface-container p-3 rounded-lg">
                <span className="text-outline uppercase text-[10px]">Smart Contract Method</span>
                <span className="text-on-surface font-mono">
                  BlueCarbonMRVAnchor.anchorMRV(bytes32 dataHash, string recordId, uint256 carbonAmountCentiTonne)
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-surface-container-high bg-surface flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDnaModal(false);
                  navigate(`/admin/blockchain/${selectedRecord.creditId}`);
                }}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-title-md text-sm hover:bg-primary-container transition-colors cursor-pointer"
              >
                Open Full Detail Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
