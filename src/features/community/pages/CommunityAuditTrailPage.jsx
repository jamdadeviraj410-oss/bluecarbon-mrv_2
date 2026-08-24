import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/common/StatusBadge';
import { getAuditLogs } from '../../../services/auditService';

export default function CommunityAuditTrailPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err) {
        setError('Failed to load audit logs. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const searchMatch = log.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       log.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const actionMatch = actionFilter === 'All' || log.action === actionFilter;
    return searchMatch && actionMatch;
  });

  const uniqueActions = ['All', ...new Set(logs.map(log => log.action).filter(Boolean))];

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Audit Trail" 
        subtitle="Review immutable system activity, user actions, and data changes across the network."
      />

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <h2 className="font-headline-md text-xl font-bold text-on-surface m-0">System Activity</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             <div className="relative flex-1 w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-body-md text-on-surface"
            >
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action === 'All' ? 'All Actions' : action}</option>
              ))}
            </select>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-md uppercase tracking-wider text-xs">
                  <th className="pb-3 px-4 font-semibold">Timestamp</th>
                  <th className="pb-3 px-4 font-semibold">User / System</th>
                  <th className="pb-3 px-4 font-semibold">Action</th>
                  <th className="pb-3 px-4 font-semibold">Description</th>
                  <th className="pb-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredLogs.map((log, i) => (
                  <tr key={log.id || i} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4 font-mono-data text-sm text-on-surface-variant">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">{log.user_id ? 'person' : 'smart_toy'}</span>
                        <span className="font-semibold text-sm">{log.user_name || 'System Auto'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-semibold text-on-surface-variant uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-on-surface max-w-md">
                      {log.description}
                      {log.entity_id && (
                        <span className="block mt-1 font-mono-data text-[10px] text-on-surface-variant">
                          Entity: {log.entity_type} ({log.entity_id})
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <StatusBadge status={log.status || 'Verified'} />
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-on-surface-variant">
                      No audit logs found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
