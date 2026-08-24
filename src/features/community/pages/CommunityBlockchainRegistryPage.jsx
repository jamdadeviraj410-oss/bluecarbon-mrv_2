import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/common/StatusBadge';
import { getBlockchainTransactions } from '../../../services/blockchainService';

export default function CommunityBlockchainRegistryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [copiedHash, setCopiedHash] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRecords() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBlockchainTransactions();
        setRecords(data);
      } catch (err) {
        setError('Failed to load blockchain records. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecords();
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.txHash?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || r.recordType === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = ['All', ...new Set(records.map(r => r.recordType).filter(Boolean))];

  const copyToClipboard = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(''), 2000);
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Blockchain Registry" 
        subtitle="View immutable, on-chain anchored MRV records and transactions for community projects."
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-error/10 text-error rounded-xl border border-error/20">
          {error}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
            <h2 className="font-headline-md text-xl font-bold text-on-surface m-0">Transaction Log</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Search Hash or Project..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-body-md text-on-surface"
              >
                {uniqueTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-md uppercase tracking-wider text-xs">
                  <th className="pb-3 px-4 font-semibold">Tx Hash</th>
                  <th className="pb-3 px-4 font-semibold">Block</th>
                  <th className="pb-3 px-4 font-semibold">Timestamp</th>
                  <th className="pb-3 px-4 font-semibold">Record Type</th>
                  <th className="pb-3 px-4 font-semibold">Project</th>
                  <th className="pb-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredRecords.map((record, i) => (
                  <tr key={record.id || i} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data font-semibold text-primary">{record.txHash || 'Pending'}</span>
                        {record.txHash && (
                          <button 
                            onClick={() => copyToClipboard(record.txHash)}
                            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Copy Hash"
                          >
                            <span className="material-symbols-outlined text-[16px]">{copiedHash === record.txHash ? 'check' : 'content_copy'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono-data text-sm text-on-surface-variant">{record.blockNumber || 'Pending'}</td>
                    <td className="py-4 px-4 font-mono-data text-sm text-on-surface-variant">{record.timestamp || record.createdAt?.split('T')[0] || 'N/A'}</td>
                    <td className="py-4 px-4 text-sm font-semibold">{record.recordType}</td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">{record.projectName}</td>
                    <td className="py-4 px-4 text-right">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                      No records found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
