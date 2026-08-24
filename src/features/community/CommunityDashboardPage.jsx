
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card, { CardHeader } from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const MOCK_KPIS = [
  { label: 'Active Projects', value: '4', border: 'border-t-primary', color: 'text-primary' },
  { label: 'Submitted for Review', value: '2', border: 'border-t-amber-500', color: 'text-amber-700' },
  { label: 'Verified Projects', value: '8', border: 'border-t-secondary', color: 'text-secondary' },
  { label: 'Restoration Area', value: '450', unit: 'ha', border: 'border-t-[#00abc1]', color: 'text-[#00abc1]' },
  { label: 'Estimated CO2e', value: '42.5k', unit: 't', border: 'border-t-secondary', color: 'text-secondary' },
  { label: 'Carbon Credits', value: '12.4k', border: 'border-t-primary', color: 'text-primary' },
];

const MOCK_PROJECTS = [
  {
    id: 'PRJ-MMR-01',
    name: 'Sundarbans West Reserve',
    location: 'Bangladesh • Mangrove',
    status: 'Under Review',
    area: '120.5 ha',
    co2e: '14,200 t',
    progress: 70,
    steps: [
      { label: 'Registered', done: true },
      { label: 'Data Collection', done: true },
      { label: 'Evidence Submitted', done: true },
      { label: 'MRV Review', active: true },
      { label: 'Verified', done: false },
    ],
  },
  {
    id: 'PRJ-BC-0924',
    name: 'Mida Creek Conservation',
    location: 'Kenya • Seagrass',
    status: 'Active',
    area: '85.2 ha',
    co2e: '8,450 t',
    progress: 30,
    steps: [
      { label: 'Registered', done: true },
      { label: 'Data Collection', active: true },
      { label: 'Evidence Submitted', done: false },
      { label: 'MRV Review', done: false },
      { label: 'Verified', done: false },
    ],
  },
];

const MOCK_ACTIVITY = [
  { icon: 'upload_file', text: 'Survey uploaded for', project: 'Mida Creek Conservation', time: '2 hours ago by Field Team' },
  { icon: 'precision_manufacturing', text: 'Drone data processed and validated for', project: 'Sundarbans West Reserve', time: 'Yesterday at 14:30', hasImage: true },
  { icon: 'verified', text: 'MRV verified successfully for', project: 'Pichavaram Mangrove Revival', time: '3 days ago' },
];

const MOCK_ALERTS = [
  { icon: 'warning', type: 'error', title: 'Field evidence requested', desc: 'Sundarbans West Reserve MRV review requires additional soil sample photos for plot 4B.', action: 'Upload Evidence', to: '/organization/evidence/upload' },
  { icon: 'task_alt', type: 'success', title: 'Project MRV Verified', desc: 'Pichavaram Mangrove Revival has passed final verification. 14,200 Carbon Credits issued.', action: 'View Certificate', to: '/blockchain' },
];

function ProgressStepper({ steps, progressPercent }) {
  return (
    <div className="mt-2">
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

export default function CommunityDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-data text-on-surface-variant mb-1">
            <span>COMMUNITY</span>
            <span>/</span>
            <span className="text-primary font-semibold">MY RESTORATION SITES</span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold tracking-tight">
            My Restoration Projects
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Monitor coastal restoration activities, field submissions, and sovereign verification status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="outline"
            icon="upload_file"
            onClick={() => navigate('/organization/evidence/upload')}
          >
            Upload Evidence
          </Button>
          <Button
            variant="primary"
            icon="add_circle"
            onClick={() => navigate('/organization/projects/new')}
          >
            Create New Project
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {MOCK_KPIS.map((kpi, i) => (
          <div key={i} className={`bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-outline-variant/30 border-t-[3px] ${kpi.border} hover:shadow-[0_4px_16px_rgba(0,51,102,0.06)] transition-all`}>
            <p className="font-label-md text-on-surface-variant uppercase text-[11px] font-semibold mb-1">{kpi.label}</p>
            <p className={`font-headline-lg text-2xl font-bold ${kpi.color} tracking-tight`}>
              {kpi.value}
              {kpi.unit && <span className="font-title-md text-sm text-on-surface-variant ml-1 font-normal">{kpi.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Current Projects */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-lg sm:text-xl font-bold text-primary tracking-tight m-0">Current Projects</h2>
          <Link to="/admin/projects" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View All Projects</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MOCK_PROJECTS.map((proj, i) => (
            <Card key={i} hover className="flex flex-col gap-4 cursor-pointer" onClick={() => navigate(`/projects/${proj.id}`)}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="font-title-md font-bold text-on-surface text-base mb-0.5">{proj.name}</h3>
                  <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    {proj.location}
                  </p>
                </div>
                <StatusBadge status={proj.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div>
                  <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">Restoration Area</p>
                  <p className="font-mono-data font-bold text-on-surface text-sm">{proj.area}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">Estimated CO2e</p>
                  <p className="font-mono-data font-bold text-secondary text-sm">{proj.co2e}</p>
                </div>
              </div>
              <ProgressStepper steps={proj.steps} progressPercent={proj.progress} />
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Recent Activity"
              subtitle="Latest submissions and automated data pipeline runs"
            />
            <div className="relative pl-6 border-l-2 border-outline-variant/30 flex flex-col gap-6 ml-2 mt-2">
              {MOCK_ACTIVITY.map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="font-body-md text-sm text-on-surface m-0">
                      {item.text} <span className="font-title-md font-semibold text-primary">{item.project}</span>
                    </p>
                    <p className="font-mono-data text-xs text-on-surface-variant m-0">{item.time}</p>
                    {item.hasImage && (
                      <div className="mt-2 w-full max-w-sm h-20 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[28px] opacity-70">satellite_alt</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Alerts & Notifications */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Alerts & Actions"
              subtitle="Required items for MRV progression"
            />
            <div className="flex flex-col gap-3">
              {MOCK_ALERTS.map((alert, i) => (
                <div key={i} className={`rounded-xl p-4 border flex gap-3 ${
                  alert.type === 'error' ? 'bg-error-container/20 border-error/30' :
                  alert.type === 'success' ? 'bg-secondary-container/20 border-secondary/30' :
                  'bg-surface-container-low border-outline-variant/20'
                }`}>
                  <span className={`material-symbols-outlined text-[20px] shrink-0 ${
                    alert.type === 'error' ? 'text-error' :
                    alert.type === 'success' ? 'text-secondary' :
                    'text-on-surface-variant'
                  }`}>{alert.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-title-md font-bold text-xs text-on-surface mb-1">{alert.title}</h4>
                    <p className="font-body-md text-xs text-on-surface-variant mb-2">{alert.desc}</p>
                    {alert.action && (
                      <Link
                        to={alert.to || '#'}
                        className={`text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1 ${
                          alert.type === 'error' ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        <span>{alert.action}</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

