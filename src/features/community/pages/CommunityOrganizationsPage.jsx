import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/common/StatusBadge';
import { getOrganizations } from '../../../services/organizationService';

export default function CommunityOrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrganizations() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOrganizations();
        setOrganizations(data);
      } catch (err) {
        setError('Failed to load organizations. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrganizations();
  }, []);

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || org.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Network & Organizations" 
        subtitle="Connect with active organizations, verification bodies, and partners in the blue carbon network."
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
        <div className="relative flex-1 w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search organizations..."
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
            <option value="All">All Types</option>
            <option value="Project Developer">Project Developer</option>
            <option value="Verifier (VVB)">Verifier (VVB)</option>
            <option value="Local NGO">Local NGO</option>
            <option value="Research Institute">Research Institute</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org, i) => (
            <Card key={org.id || i} hover className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30 text-primary font-bold text-lg uppercase">
                  {org.name?.substring(0, 2) || 'OR'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md font-bold text-on-surface text-base truncate mb-1" title={org.name}>{org.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/20 uppercase tracking-wider">
                      {org.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/20 uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                      {org.country}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-outline-variant/20">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Status</span>
                  <StatusBadge status={org.status} />
                </div>
                {org.type === 'Project Developer' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Active Projects</span>
                    <span className="font-mono-data font-semibold text-primary">{org.projectsCount || 0}</span>
                  </div>
                )}
                {org.type === 'Verifier (VVB)' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Verifications</span>
                    <span className="font-mono-data font-semibold text-secondary">{org.projectsCount || 0}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {filteredOrgs.length === 0 && (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              No organizations found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
