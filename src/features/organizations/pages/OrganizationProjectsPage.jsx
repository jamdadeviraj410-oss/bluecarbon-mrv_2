import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../../../services/projectService';
import { ROUTES } from '../../../utils/constants';

export default function OrganizationProjectsPage() {
  const [projectsList, setProjectsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const data = await getProjects();
        if (isMounted) setProjectsList(data || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProjects();
    return () => { isMounted = false; };
  }, []);

  const filteredProjects = projectsList.filter((prj) => {
    const matchesSearch = 
      prj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prj.project_code && prj.project_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prj.state && prj.state.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || prj.status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-primary text-[24px] md:text-[28px] font-extrabold tracking-tight">
            My Organization Projects
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs md:text-sm">
            All blue carbon conservation and mangrove restoration plots registered under your management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ORG_CREATE_PROJECT}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-sm text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Register New Project
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            placeholder="Search projects by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'VERIFIED', 'ACTIVE', 'UNDER_REVIEW'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-5 py-3.5">Project Code & Name</th>
                <th className="px-5 py-3.5">Ecosystem & State</th>
                <th className="px-5 py-3.5 text-right">Area (ha)</th>
                <th className="px-5 py-3.5 text-right">Est. Carbon</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {filteredProjects.map((prj) => (
                <tr key={prj.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-on-surface">{prj.name}</div>
                    <div className="font-mono-data text-xs text-on-surface-variant">{prj.project_code || prj.id}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-on-surface">{prj.type}</div>
                    <div className="text-xs text-on-surface-variant">{prj.state}, {prj.location}</div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono-data font-bold text-on-surface">
                    {prj.area} ha
                  </td>
                  <td className="px-5 py-4 text-right font-mono-data text-secondary font-bold">
                    {Number(prj.est_co2e || prj.estCo2e).toLocaleString()} tCO2e
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-secondary/15 text-secondary">
                      {prj.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={ROUTES.ADMIN_PROJECT_DETAIL.replace(':id', prj.id)}
                      className="px-3.5 py-1.5 rounded-lg border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-on-surface-variant text-sm">
                    {isLoading ? 'Loading projects...' : 'No projects found matching your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
