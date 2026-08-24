import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getProjects } from '../../../services/projectService';
import { ROUTES } from '../../../utils/constants';

export default function OrganizationDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const data = await getProjects();
        if (isMounted) {
          setProjects(data || []);
        }
      } catch (err) {
        console.error('Failed to load organization projects:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProjects();
    return () => { isMounted = false; };
  }, []);

  const totalArea = projects.reduce((acc, p) => acc + (Number(p.area) || 0), 0);
  const totalCredits = projects.reduce((acc, p) => acc + (Number(p.totalCredits || p.total_credits) || 0), 0);
  const verifiedCount = projects.filter((p) => p.status === 'VERIFIED' || p.status === 'Verified').length;

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono-data">{user?.role || 'NGO'}</span>
            <span>•</span>
            <span>{user?.organization || 'Coastal Restoration Unit'}</span>
          </div>
          <h1 className="font-headline-lg text-primary text-[24px] md:text-[28px] font-extrabold tracking-tight">
            Organization Project & MRV Workspace
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs md:text-sm">
            Manage your registered blue carbon projects, submit drone & field evidence, and monitor verified carbon credit allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.ORG_UPLOAD_EVIDENCE}
            className="px-4 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-title-sm text-xs font-bold hover:bg-surface-container flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Upload Field Evidence
          </Link>
          <Link
            to={ROUTES.ORG_CREATE_PROJECT}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-sm text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Register New Project
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active Projects</div>
          <div className="text-2xl font-mono-data font-extrabold text-on-surface">
            {isLoading ? '...' : projects.length}
          </div>
          <div className="text-xs text-secondary font-medium">{verifiedCount} Fully Verified</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Restored Area</div>
          <div className="text-2xl font-mono-data font-extrabold text-primary">
            {isLoading ? '...' : totalArea.toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">ha</span>
          </div>
          <div className="text-xs text-on-surface-variant">Coastal Mangroves & Wetlands</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Issued Carbon Credits</div>
          <div className="text-2xl font-mono-data font-extrabold text-secondary">
            {isLoading ? '...' : totalCredits.toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">tCO2e</span>
          </div>
          <div className="text-xs text-secondary font-medium">100% Polygon Anchored</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Verification Status</div>
          <div className="text-2xl font-mono-data font-extrabold text-on-surface">
            Compliant
          </div>
          <div className="text-xs text-secondary font-medium">NCCR Accredited Entity</div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden space-y-4">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="font-headline-sm text-on-surface font-bold text-[16px]">My Active Coastal Projects</h2>
          <Link to={ROUTES.ORG_PROJECTS} className="text-xs font-bold text-primary hover:underline">
            View All Projects ({projects.length})
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-5 py-3.5">Project Name & Code</th>
                <th className="px-5 py-3.5">Ecosystem & State</th>
                <th className="px-5 py-3.5 text-right">Area (ha)</th>
                <th className="px-5 py-3.5 text-right">Est. Carbon (tCO2e)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {projects.slice(0, 5).map((prj) => (
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
                    {Number(prj.est_co2e || prj.estCo2e).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-secondary/15 text-secondary">
                      {prj.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={ROUTES.ADMIN_PROJECT_DETAIL.replace(':id', prj.id)}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
