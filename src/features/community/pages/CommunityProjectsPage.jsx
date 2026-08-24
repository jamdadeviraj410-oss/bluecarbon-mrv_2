import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import { getProjects } from '../../../services/projectService';

function ProgressStepper({ steps, progressPercent }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Verification Progress</p>
      <div className="flex items-center w-full relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container-high rounded-full -z-10" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-secondary rounded-full -z-10 transition-all" style={{ width: `${progressPercent}%` }} />
        <div className="flex justify-between w-full">
          {steps.map((step, i) => (
            <div key={i} className={`flex flex-col items-center gap-1.5 ${!step.done && !step.active ? 'opacity-40' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-all ${
                step.done ? 'bg-secondary text-on-secondary' :
                step.active ? 'bg-surface-container-lowest border-2 border-secondary text-secondary relative' :
                'bg-surface-container-lowest border-2 border-outline-variant text-on-surface-variant'
              }`}>
                {step.done && <span className="material-symbols-outlined text-[14px]">check</span>}
                {step.active && <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />}
              </div>
              <span className="text-[10px] font-semibold text-on-surface whitespace-nowrap">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommunityProjectsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Community Projects" 
        subtitle="Browse and monitor blue carbon restoration projects in your community."
        actions={
          <Button variant="primary" icon="add_circle" onClick={() => navigate('/organization/projects/new')}>
            Register Project
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
        <div className="relative flex-1 w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-2.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-4 pr-10 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-body-md text-on-surface"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified</option>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map((proj, i) => {
            const steps = proj.statusHistory?.length > 0 ? [] : [
              { label: 'Registered', done: true },
              { label: 'Data Collection', done: proj.status !== 'Draft', active: proj.status === 'Draft' },
              { label: 'Evidence Submitted', done: proj.status === 'Under Review' || proj.status === 'Verified' },
              { label: 'MRV Review', done: proj.status === 'Verified', active: proj.status === 'Under Review' },
              { label: 'Verified', done: proj.status === 'Verified' },
            ];
            const progress = proj.status === 'Verified' ? 100 : proj.status === 'Under Review' ? 70 : 30;

            return (
              <Card key={proj.id || i} hover className="flex flex-col gap-4 cursor-pointer" onClick={() => navigate(`/projects/${proj.id}`)}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <h3 className="font-title-md font-bold text-on-surface text-base mb-0.5">{proj.name}</h3>
                    <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                      {proj.location || proj.country}
                    </p>
                  </div>
                  <StatusBadge status={proj.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div>
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">Restoration Area</p>
                    <p className="font-mono-data font-bold text-on-surface text-sm">{proj.area} ha</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">Estimated CO2e</p>
                    <p className="font-mono-data font-bold text-secondary text-sm">{proj.estCO2e} t</p>
                  </div>
                </div>
                <ProgressStepper steps={steps} progressPercent={progress} />
              </Card>
            );
          })}
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              No projects found matching your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
