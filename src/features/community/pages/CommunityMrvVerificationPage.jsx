import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import { getMRVSubmissions } from '../../../services/mrvService';

export default function CommunityMrvVerificationPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSubmissions() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMRVSubmissions();
        setSubmissions(data);
      } catch (err) {
        setError('Failed to load MRV submissions.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || s.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = submissions.length;
  const reviewCount = submissions.filter(s => s.status === 'Under Review').length;
  const verifiedCount = submissions.filter(s => s.status === 'Verified').length;

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="MRV Verification" 
        subtitle="Monitor the reporting and verification status of community projects."
        actions={
          <Button variant="primary" icon="upload_file" onClick={() => navigate('/community/evidence-upload')}>
            Submit New Evidence
          </Button>
        }
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card accentTop="primary" className="flex flex-col gap-2">
              <p className="font-label-md text-on-surface-variant uppercase font-semibold">Total Submissions</p>
              <p className="font-headline-lg text-3xl font-bold text-primary">{totalCount}</p>
            </Card>
            <Card accentTop="warning" className="flex flex-col gap-2">
              <p className="font-label-md text-on-surface-variant uppercase font-semibold">Under Review</p>
              <p className="font-headline-lg text-3xl font-bold text-amber-600">{reviewCount}</p>
            </Card>
            <Card accentTop="secondary" className="flex flex-col gap-2">
              <p className="font-label-md text-on-surface-variant uppercase font-semibold">Successfully Verified</p>
              <p className="font-headline-lg text-3xl font-bold text-secondary">{verifiedCount}</p>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
              <h2 className="font-headline-md text-xl font-bold text-on-surface m-0">Verification Pipeline</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                 <div className="relative flex-1 w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    placeholder="Search MRV ID or Project..."
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-body-md text-on-surface"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verified">Verified</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-md uppercase tracking-wider text-xs">
                    <th className="pb-3 px-4 font-semibold">Submission ID</th>
                    <th className="pb-3 px-4 font-semibold">Project</th>
                    <th className="pb-3 px-4 font-semibold">Date</th>
                    <th className="pb-3 px-4 font-semibold">Status</th>
                    <th className="pb-3 px-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredSubmissions.map((sub, i) => (
                    <tr key={sub.id || i} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono-data font-semibold text-primary">{sub.id}</span>
                      </td>
                      <td className="py-4 px-4 font-title-md font-semibold text-on-surface">{sub.projectName}</td>
                      <td className="py-4 px-4 font-mono-data text-sm text-on-surface-variant">{sub.submittedDate}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-on-surface-variant m-0 max-w-xs truncate" title={sub.notes}>
                          {sub.notes || 'No notes available'}
                        </p>
                        <p className="text-[10px] text-primary/70 mt-1 uppercase font-semibold">{sub.verifiedBy || sub.submittedBy}</p>
                      </td>
                    </tr>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-on-surface-variant">
                        No submissions found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
