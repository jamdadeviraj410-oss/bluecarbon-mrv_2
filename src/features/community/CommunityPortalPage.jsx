import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card, { CardHeader } from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const MOCK_PROJECTS = [
  { id: 'PRJ-BC-0924', name: 'Boca Chica Mangrove Restoration', dueLabel: 'Submission Due: 14 Days', dueSeverity: 'warn' },
  { id: 'PRJ-SE-1102', name: 'Salinas Estuary Protection', dueLabel: 'Submission Due: 45 Days', dueSeverity: 'ok' },
];

const MOCK_ACTIVE_PROJECTS = [
  {
    id: 'PRJ-BC-0924',
    name: 'Boca Chica Mangrove',
    progress: 82,
    step: 'Step 4/5: Biomass Survey',
    dueText: 'Due in 14 days',
    dueColor: 'text-error',
    barColor: 'bg-secondary',
  },
  {
    id: 'PRJ-SE-1102',
    name: 'Salinas Estuary',
    progress: 45,
    step: 'Step 2/5: Drone Mapping',
    dueText: 'On Track',
    dueColor: 'text-on-surface-variant',
    barColor: 'bg-[#00abc1]',
  },
];

const MOCK_TIMELINE = [
  { time: 'Today, 09:42 AM', title: 'Biomass CSV verified by Auditor', hash: '0x7a89f92...c01', badge: 'On-Chain', dotColor: 'bg-secondary' },
  { time: 'Yesterday, 14:15 PM', title: 'Drone imagery uploaded (Set A)', detail: 'Salinas Estuary • 4.2GB • 450 images', dotColor: 'bg-[#00abc1]' },
  { time: 'Oct 12, 2023', title: 'MRV Report Generated', detail: 'Q3 2023 Summary Report ready for review.', dotColor: 'bg-slate-400' },
];

const STEP_LABELS = ['Select Project', 'Upload Data', 'Field Notes', 'Sign & Submit'];

export default function CommunityPortalPage() {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const handleSubmitToLedger = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionSuccess(true);
      setTimeout(() => {
        setSubmissionSuccess(false);
        setCurrentStep(1);
      }, 5000);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface">
      {/* Welcome & Highlights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-3 relative">
          <div className="flex items-center gap-2 text-xs font-mono-data text-on-surface-variant mb-1">
            <span>PORTAL</span>
            <span>/</span>
            <span className="text-primary font-semibold">COMMUNITY LEAD WORKSPACE</span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl text-primary font-bold tracking-tight leading-tight">
            Welcome back,<br />
            <span className="text-on-surface font-semibold">Coastal Restoration Society</span>
          </h1>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Your active mangrove restoration sites are currently accumulating verified blue carbon data. You have 2 projects approaching their scheduled MRV submission window.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Button
              variant="primary"
              icon="add_circle"
              onClick={() => setCurrentStep(1)}
            >
              Submit Survey Data
            </Button>
            <Button
              variant="outline"
              icon="map"
              onClick={() => navigate('/public')}
            >
              View Public Map
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <Card accentTop="secondary">
            <p className="font-label-md text-on-surface-variant uppercase text-[11px] font-semibold mb-1">Est. Credits Generated</p>
            <p className="font-headline-lg text-2xl sm:text-3xl font-bold text-secondary tracking-tight">
              14,250 <span className="font-title-md text-xs sm:text-sm text-on-surface-variant font-normal">tCO2e</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-secondary-container/30 text-secondary px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%
              </span>
              <span className="font-body-md text-xs text-on-surface-variant">vs last verification</span>
            </div>
          </Card>
          <Card accentTop="tertiary">
            <p className="font-label-md text-on-surface-variant uppercase text-[11px] font-semibold mb-1">Local Impact</p>
            <p className="font-headline-lg text-2xl sm:text-3xl font-bold text-[#00abc1] tracking-tight">
              124 <span className="font-title-md text-xs sm:text-sm text-on-surface-variant font-normal">Jobs Supported</span>
            </p>
            <p className="font-body-md text-xs text-on-surface-variant mt-1">Across 3 local panchayat coastal communities</p>
          </Card>
        </div>
      </section>

      {submissionSuccess && (
        <div className="p-4 bg-secondary-container/20 border border-secondary/30 text-secondary rounded-2xl text-sm flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-[24px]">verified</span>
          <div>
            <h4 className="font-bold text-sm m-0">Survey Data Successfully Anchored</h4>
            <p className="text-xs opacity-90 m-0">Your cryptographic payload was recorded to the verification queue and signed with ledger hash.</p>
          </div>
        </div>
      )}

      {/* Upload Component & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Multi-step Upload */}
        <div className="lg:col-span-7">
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary text-on-primary rounded-xl">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                </div>
                <h2 className="font-headline-md text-lg font-bold text-primary tracking-tight m-0">
                  Submit Field Survey Data
                </h2>
              </div>
              <span className="font-mono-data text-xs font-semibold text-on-surface-variant px-3 py-1 bg-surface-container rounded-full border border-outline-variant/30">
                Step {currentStep} of 4
              </span>
            </div>

            {/* Stepper */}
            <div className="relative mb-6">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container -translate-y-1/2 z-0" />
              <div className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-300" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
              <div className="flex justify-between relative z-10">
                {STEP_LABELS.map((label, i) => {
                  const stepNum = i + 1;
                  const isCompleted = stepNum < currentStep;
                  const isCurrent = stepNum === currentStep;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-0"
                      onClick={() => setCurrentStep(stepNum)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono-data text-xs font-bold ring-4 ring-surface-container-lowest transition-all ${
                        isCompleted ? 'bg-secondary text-on-secondary shadow-xs' :
                        isCurrent ? 'bg-primary text-on-primary shadow-sm scale-110' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>
                        {isCompleted ? <span className="material-symbols-outlined text-[16px]">check</span> : stepNum}
                      </div>
                      <span className={`text-[11px] font-semibold hidden sm:block ${isCurrent ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[220px] flex flex-col justify-between">
              {currentStep === 1 && (
                <div>
                  <p className="font-title-md text-sm font-semibold text-on-surface mb-3">Which project are you uploading data for?</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MOCK_PROJECTS.map((proj, i) => (
                      <label key={i} className={`relative flex cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
                        selectedProject === i ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container'
                      }`}>
                        <input className="sr-only" type="radio" name="project_select" checked={selectedProject === i} onChange={() => setSelectedProject(i)} />
                        <span className="flex flex-col min-w-0">
                          <span className={`font-title-md text-sm font-bold mb-0.5 ${selectedProject === i ? 'text-primary' : 'text-on-surface'}`}>{proj.name}</span>
                          <span className="font-mono-data text-xs text-on-surface-variant mb-2">ID: {proj.id}</span>
                          <StatusBadge status={proj.dueSeverity === 'warn' ? 'Pending' : 'Active'} />
                        </span>
                        <span className={`absolute top-4 right-4 material-symbols-outlined text-[20px] ${selectedProject === i ? 'text-primary' : 'text-outline-variant'}`}>
                          {selectedProject === i ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div>
                  <p className="font-title-md text-sm font-semibold text-on-surface mb-3">Upload Drone Imagery or CSV Data</p>
                  <div
                    onClick={() => alert('Simulated File Picker: Select your GIS, Drone TIFF, or CSV dataset.')}
                    className="border-2 border-dashed border-outline-variant hover:border-primary rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-surface-container-low hover:bg-primary/5 transition-all cursor-pointer min-h-[160px]"
                  >
                    <span className="material-symbols-outlined text-[36px] text-primary mb-2">cloud_upload</span>
                    <p className="font-title-md font-semibold text-sm text-on-surface mb-0.5">Drag and drop files here or click to browse</p>
                    <p className="font-body-md text-xs text-on-surface-variant">Supports GeoTIFF, .zip, .csv, .geojson (Max 5GB)</p>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div>
                  <p className="font-title-md text-sm font-semibold text-on-surface mb-3">Add Field Notes &amp; Environmental Conditions</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-on-surface-variant uppercase mb-1 block">Survey Date</label>
                      <input type="date" defaultValue="2026-08-24" className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-on-surface-variant uppercase mb-1 block">Field Observations</label>
                      <textarea rows={3} defaultValue="Tidal condition: Mid-tide receding. High seedling survivorship noted in quad B2." className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 4 && (
                <div>
                  <p className="font-title-md text-sm font-semibold text-on-surface mb-3">Cryptographic Signature & Audit Ledger</p>
                  <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#00abc1] text-[24px]">verified_user</span>
                    <div className="min-w-0">
                      <p className="font-title-md text-sm font-bold text-on-surface m-0">Sign Payload to Polygon Amoy</p>
                      <p className="font-body-md text-xs text-on-surface-variant mb-2">This action creates an immutable SHA-256 evidence anchor on the blue carbon verification chain.</p>
                      <div className="bg-surface p-2 rounded-lg font-mono-data text-on-surface-variant text-[11px] break-all border border-outline-variant/20">
                        Payload Hash: 0x8f7b2c9d1a3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-outline-variant/20">
                {currentStep < 4 ? (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    {currentStep === 1 ? 'Continue to Upload' : 'Continue'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    icon="fingerprint"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    onClick={handleSubmitToLedger}
                  >
                    Sign &amp; Submit to Ledger
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Active Projects & Timeline Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Active Projects */}
          <Card>
            <CardHeader
              title="Active Projects"
              subtitle="Progress to next MRV verification"
              actions={
                <Link to="/admin/projects" className="text-xs font-semibold text-primary hover:underline">
                  View All
                </Link>
              }
            />
            <div className="space-y-3">
              {MOCK_ACTIVE_PROJECTS.map((proj, i) => (
                <div key={i} className="group bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/20 hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate(`/projects/${proj.id}`)}>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[16px]">forest</span>
                      </div>
                      <h4 className="font-title-md font-bold text-xs text-on-surface group-hover:text-primary transition-colors m-0">{proj.name}</h4>
                    </div>
                    <span className="font-mono-data text-on-surface text-xs font-bold">{proj.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-2 relative">
                    <div className={`absolute top-0 left-0 h-full ${proj.barColor} rounded-full`} style={{ width: `${proj.progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">{proj.step}</span>
                    <span className={`${proj.dueColor} font-semibold flex items-center gap-1`}>
                      {proj.dueText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Verification Activity */}
          <Card>
            <CardHeader
              title="Verification Timeline"
              subtitle="Auditor and ledger events"
            />
            <div className="relative pl-5 border-l-2 border-outline-variant/30 space-y-4 ml-1">
              {MOCK_TIMELINE.map((item, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ${item.dotColor} border-2 border-surface`} />
                  <p className="text-[10px] font-mono-data text-on-surface-variant uppercase mb-0.5">{item.time}</p>
                  <p className="font-title-md font-bold text-xs text-on-surface m-0">{item.title}</p>
                  {item.hash && (
                    <p className="font-mono-data text-[11px] text-on-surface-variant mt-0.5 m-0">Hash: <span className="bg-surface-container px-1 py-0.5 rounded text-xs">{item.hash}</span></p>
                  )}
                  {item.detail && (
                    <p className="font-body-md text-xs text-on-surface-variant mt-0.5 m-0">{item.detail}</p>
                  )}
                  {item.badge && (
                    <div className="mt-1.5">
                      <StatusBadge status={item.badge} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

