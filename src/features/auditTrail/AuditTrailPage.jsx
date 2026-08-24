import { useState, useMemo } from 'react';
import {
  mockAuditEntries,
  getAuditEntries,
  exportAuditTrailCSV,
} from './auditTrailService';

export default function AuditTrailPage() {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedOrg, setSelectedOrg] = useState('All Organizations');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Sliding Sidepanel State
  const [selectedActivity, setSelectedActivity] = useState(mockAuditEntries[0]);
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Derived Filter Options
  const usersList = useMemo(() => {
    return ['All Users', ...new Set(mockAuditEntries.map((e) => e.user).filter((u) => u !== '-'))];
  }, []);

  const orgsList = useMemo(() => {
    return ['All Organizations', ...new Set(mockAuditEntries.map((e) => e.organization).filter((o) => o !== '-'))];
  }, []);

  const actionsList = useMemo(() => {
    return ['All Actions', ...new Set(mockAuditEntries.map((e) => e.action))];
  }, []);

  const projectsList = useMemo(() => {
    return ['All Projects', ...new Set(mockAuditEntries.map((e) => e.project))];
  }, []);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return getAuditEntries({
      search: searchTerm,
      user: selectedUser,
      organization: selectedOrg,
      action: selectedAction,
      project: selectedProject,
      status: selectedStatus,
    });
  }, [searchTerm, selectedUser, selectedOrg, selectedAction, selectedProject, selectedStatus]);

  // Paginated Entries
  const totalEntries = filteredEntries.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Handle Row Click to Open Sidepanel
  const handleRowClick = (entry) => {
    setSelectedActivity(entry);
    setIsSidepanelOpen(true);
  };

  // Export to CSV
  const handleExport = () => {
    const csv = exportAuditTrailCSV(filteredEntries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bluecarbon-audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyTxHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 gap-6 font-body-md text-on-surface min-h-[calc(100vh-var(--topbar-height))] relative">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold tracking-tight m-0">
            Audit Trail
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant m-0">
            Complete history of project, MRV and carbon-credit activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-surface border border-outline-variant/60 text-on-surface text-xs font-label-md font-semibold rounded-lg hover:bg-surface-container transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Audit Log
          </button>
        </div>
      </header>

      {/* Action / Filter Bar */}
      <div className="flex items-center justify-between bg-surface-container-low rounded-xl shadow-sm p-3 gap-3 flex-wrap border border-outline-variant/50">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-1.5 w-full sm:w-64 shadow-sm border border-outline-variant/60">
          <span className="material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search Reference ID / Action"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent text-xs outline-none border-none text-on-surface w-full placeholder:text-outline-variant"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-outline hover:text-on-surface text-xs"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1 pb-1 sm:pb-0 scrollbar-none">
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface text-on-surface font-label-md text-xs px-3 py-2 rounded-lg shadow-sm border border-outline-variant/60 outline-none cursor-pointer hover:bg-surface-container transition-colors"
          >
            {usersList.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <select
            value={selectedOrg}
            onChange={(e) => {
              setSelectedOrg(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface text-on-surface font-label-md text-xs px-3 py-2 rounded-lg shadow-sm border border-outline-variant/60 outline-none cursor-pointer hover:bg-surface-container transition-colors"
          >
            {orgsList.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface text-on-surface font-label-md text-xs px-3 py-2 rounded-lg shadow-sm border border-outline-variant/60 outline-none cursor-pointer hover:bg-surface-container transition-colors"
          >
            {actionsList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface text-on-surface font-label-md text-xs px-3 py-2 rounded-lg shadow-sm border border-outline-variant/60 outline-none cursor-pointer hover:bg-surface-container transition-colors"
          >
            {projectsList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface text-on-surface font-label-md text-xs px-3 py-2 rounded-lg shadow-sm border border-outline-variant/60 outline-none cursor-pointer hover:bg-surface-container transition-colors"
          >
            <option value="All Status">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Date Range Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDateRangeOpen(!dateRangeOpen)}
              className="bg-surface text-on-surface font-label-md text-xs px-3 py-2 rounded-lg shadow-sm border border-outline-variant/60 flex items-center gap-1.5 cursor-pointer whitespace-nowrap hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
              <span>{selectedDateFilter}</span>
            </button>

            {dateRangeOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-surface rounded-xl shadow-xl border border-outline-variant z-30 p-2 flex flex-col gap-1 text-xs">
                {['All Time', 'Today', 'Last 7 Days', 'Last 30 Days', 'Q4 2023'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSelectedDateFilter(item);
                      setDateRangeOpen(false);
                    }}
                    className={`text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                      selectedDateFilter === item ? 'bg-primary text-on-primary font-semibold' : 'hover:bg-surface-container'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex bg-surface rounded-lg p-1 shadow-sm border border-outline-variant/60">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md font-label-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              viewMode === 'table'
                ? 'text-on-primary bg-primary shadow-sm'
                : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">table_chart</span>
            Table
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md font-label-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              viewMode === 'timeline'
                ? 'text-on-primary bg-primary shadow-sm'
                : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">timeline</span>
            Timeline
          </button>
        </div>
      </div>

      {/* Main Container with Sliding Sidepanel */}
      <div className="flex gap-4 relative w-full min-h-[560px]">
        {/* Left Area: Table or Timeline */}
        <div
          className={`flex-1 bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col z-10 transition-all duration-300 ${
            isSidepanelOpen ? 'lg:mr-[460px]' : ''
          }`}
        >
          {viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container text-on-surface-variant font-label-md text-xs sticky top-0 z-10 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold hidden md:table-cell">Organization</th>
                    <th className="py-3 px-4 font-semibold">Action</th>
                    <th className="py-3 px-4 font-semibold hidden sm:table-cell">Project</th>
                    <th className="py-3 px-4 font-semibold hidden lg:table-cell">Entity</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Reference ID</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-xs divide-y divide-outline-variant/30 cursor-pointer">
                  {paginatedEntries.map((entry) => {
                    const isSelected = selectedActivity?.id === entry.id && isSidepanelOpen;
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => handleRowClick(entry)}
                        className={`transition-colors border-b border-surface-container-high group ${
                          isSelected
                            ? 'bg-primary-fixed/40'
                            : 'hover:bg-primary-fixed-dim/20'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap font-mono-data text-[11px]">
                          {entry.displayTimestamp}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface whitespace-nowrap">
                          {entry.user}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant hidden md:table-cell truncate max-w-[140px]">
                          {entry.organization}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface font-semibold truncate max-w-[160px]">
                          {entry.action}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface hidden sm:table-cell truncate max-w-[160px]">
                          {entry.project}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant hidden lg:table-cell whitespace-nowrap">
                          {entry.entity}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center">
                            <span
                              className={`w-3 h-3 rounded-full inline-block shadow-sm ${
                                entry.status === 'Verified'
                                  ? 'bg-secondary'
                                  : entry.status === 'Rejected'
                                  ? 'bg-error'
                                  : 'bg-[#f57f17]'
                              }`}
                              title={entry.status}
                            ></span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono-data text-right text-primary font-semibold group-hover:underline whitespace-nowrap">
                          {entry.refId}
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        No audit events matching current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Timeline View */
            <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
              <div className="relative pl-6 sm:pl-8 border-l-2 border-outline-variant/60 ml-3 flex flex-col gap-8">
                {paginatedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => handleRowClick(entry)}
                    className="relative group cursor-pointer"
                  >
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full border-2 border-surface shadow-[0_0_0_4px_#f8f9ff] flex items-center justify-center ${
                        entry.status === 'Verified'
                          ? 'bg-secondary'
                          : entry.status === 'Rejected'
                          ? 'bg-error'
                          : 'bg-[#f57f17]'
                      }`}
                    ></div>

                    {/* Timeline Item Card */}
                    <div className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/50 p-4 rounded-xl shadow-sm transition-all group-hover:translate-x-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-title-md text-sm font-bold text-on-surface">
                            {entry.action}
                          </span>
                          <span className="font-mono-data text-xs text-primary font-semibold">
                            {entry.refId}
                          </span>
                        </div>
                        <span className="font-mono-data text-xs text-on-surface-variant">
                          {entry.timestampUtc}
                        </span>
                      </div>

                      <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mb-3">
                        {entry.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface">{entry.user}</span>
                          <span>•</span>
                          <span>{entry.organization}</span>
                        </div>
                        <span className="text-primary font-semibold group-hover:underline">
                          View details →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="bg-surface-container p-3 sm:px-4 flex items-center justify-between text-label-md text-xs text-on-surface-variant border-t border-outline-variant/40">
            <span>
              Showing {totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-surface rounded-lg border border-outline-variant/60 hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer font-semibold"
              >
                Prev
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-surface rounded-lg border border-outline-variant/60 hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Sidepanel (Activity Detail) */}
        <div
          id="audit-sidepanel"
          className={`fixed lg:absolute top-0 right-0 w-full sm:w-[450px] h-full bg-surface shadow-2xl rounded-l-2xl lg:rounded-2xl border border-surface-container-high flex flex-col z-40 transition-transform duration-300 ease-in-out ${
            isSidepanelOpen ? 'translate-x-0' : 'translate-x-[110%]'
          }`}
        >
          {selectedActivity && (
            <>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-surface-container-high bg-surface-container-low rounded-t-xl">
                <div>
                  <h3 className="font-title-lg text-lg font-bold text-on-surface m-0">Activity Detail</h3>
                  <p className="font-mono-data text-xs text-primary font-semibold mt-0.5">
                    Ref: {selectedActivity.refId}
                  </p>
                </div>
                <button
                  onClick={() => setIsSidepanelOpen(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 text-sm">
                {/* 2-Column Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Timestamp
                    </span>
                    <span className="font-body-md text-xs text-on-surface font-mono-data">
                      {selectedActivity.timestampUtc}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      User
                    </span>
                    <span className="font-body-md text-xs font-semibold text-on-surface">
                      {selectedActivity.user}
                    </span>
                    <span className="font-label-md text-[11px] text-on-surface-variant">
                      {selectedActivity.role}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Organization
                    </span>
                    <span className="font-body-md text-xs text-on-surface">
                      {selectedActivity.organization}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Project
                    </span>
                    <span className="font-body-md text-xs text-primary font-semibold underline cursor-pointer truncate">
                      {selectedActivity.project}
                    </span>
                  </div>
                </div>

                {/* Action Description */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40">
                  <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Action Description
                  </span>
                  <p className="font-body-md text-xs text-on-surface leading-relaxed m-0">
                    {selectedActivity.description}
                  </p>
                </div>

                {/* State Change Diff Box */}
                {selectedActivity.stateChange && (
                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                      State Change
                    </span>
                    <div className="flex flex-col gap-1.5 font-mono-data text-xs">
                      <div className="bg-error-container text-on-error-container p-2.5 rounded-lg flex items-center gap-3">
                        <span className="opacity-60 font-bold w-3 text-center">-</span>
                        <span className="truncate">{selectedActivity.stateChange.old}</span>
                      </div>
                      <div className="bg-secondary-container text-on-secondary-container p-2.5 rounded-lg flex items-center gap-3">
                        <span className="opacity-60 font-bold w-3 text-center">+</span>
                        <span className="truncate">{selectedActivity.stateChange.new}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cryptographic Verification Footer */}
                <div className="mt-auto border-t border-surface-container-high pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <span>IP Address</span>
                    <span className="font-mono-data text-on-surface">{selectedActivity.ipAddress || 'Internal Oracle'}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <span>Tx Hash</span>
                    <button
                      onClick={() => copyTxHash(selectedActivity.txHash)}
                      title="Click to copy full transaction hash"
                      className="font-mono-data text-primary truncate ml-3 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{selectedActivity.txHashShort || '0x8f2a...4b9c'}</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedHash ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>

                  {selectedActivity.blockNumber && (
                    <div className="flex justify-between items-center text-xs text-on-surface-variant">
                      <span>Block Number</span>
                      <span className="font-mono-data text-on-surface">#{selectedActivity.blockNumber}</span>
                    </div>
                  )}

                  <a
                    href={`https://polygonscan.com/tx/${selectedActivity.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 w-full py-2.5 bg-primary-container text-on-primary-container font-label-md text-xs font-semibold rounded-xl hover:bg-primary hover:text-on-primary transition-colors cursor-pointer flex justify-center items-center gap-1.5 shadow-sm text-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    View on Explorer
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
