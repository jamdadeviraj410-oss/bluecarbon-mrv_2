import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, projectTypes, indianStates } from './projectsService';
import { ROUTES } from '../../utils/constants';

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedProject, setSubmittedProject] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Info
    name: '',
    type: 'Mangrove Restoration',
    organization: 'EcoTrust India',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    
    // Step 2: Location
    location: 'Ratnagiri, Maharashtra',
    state: 'Maharashtra',
    area: 145.2,
    lat: 16.9902,
    lng: 73.3120,
    
    // Step 3: Restoration
    treeDensity: 1800,
    targetPlants: 260000,
    species: 'Avicennia marina, Rhizophora mucronata',
    estCO2e: 18500,
    socBaseline: 2.8,
    
    // Step 4: Community
    communityName: 'Ratnagiri Coastal Fisherfolk Co-operative',
    communityContact: 'Suresh Patil (+91 98201 54321)',
    revenueShare: 35,
    localJobs: 120,
    
    // Step 5: Documents
    crzClearance: 'CRZ-Clearance-MH-2026.pdf',
    pddDoc: 'Project-Design-Doc-Draft-v1.pdf',
    consentDeed: 'Gram-Panchayat-Resolution-2026.pdf',
  });

  const totalSteps = 6;

  const stepMeta = [
    { num: 1, title: 'Project Info', subtitle: 'Basic details & scope' },
    { num: 2, title: 'Location', subtitle: 'Geospatial boundary' },
    { num: 3, title: 'Restoration', subtitle: 'Ecological metrics' },
    { num: 4, title: 'Community', subtitle: 'Local stakeholders' },
    { num: 5, title: 'Documents', subtitle: 'Clearances & proposals' },
    { num: 6, title: 'Review', subtitle: 'Confirm & submit' },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPrj = createProject(formData);
    setSubmittedProject(newPrj);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-var(--topbar-height,64px))] bg-surface font-body-md text-on-surface overflow-hidden">
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Left Sidebar: Step Indicator */}
        <div className="w-80 bg-surface-container-low flex flex-col pt-8 px-6 shadow-sm z-10 hidden lg:flex border-r border-outline-variant/30">
          <h2 className="font-headline-md text-primary mb-6">New Project</h2>
          
          <nav className="flex flex-col gap-6">
            {stepMeta.map((s, index) => {
              const isCompleted = s.num < currentStep;
              const isCurrent = s.num === currentStep;

              return (
                <div
                  key={s.num}
                  onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  className={`flex items-start gap-4 relative group ${
                    isCompleted ? 'cursor-pointer' : isCurrent ? 'cursor-default' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Vertical Connector Line */}
                  {index < stepMeta.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-[32px] bottom-[-24px] w-[2px] transition-colors ${
                        isCompleted ? 'bg-primary' : 'bg-outline-variant'
                      }`}
                    ></div>
                  )}

                  {/* Step Number Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-primary text-on-primary'
                        : isCurrent
                        ? 'bg-primary text-on-primary shadow-md scale-110'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      <span className="font-label-md text-xs">{s.num}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="pt-0.5">
                    <div
                      className={`font-title-md text-sm ${
                        isCurrent ? 'text-primary font-semibold' : 'text-on-surface'
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="font-body-md text-on-surface-variant text-xs">{s.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Draft Save Badge at Bottom */}
          <div className="mt-auto pb-8">
            <div className="bg-primary-container/10 p-3.5 rounded-xl flex items-center gap-3 border border-primary-container/20">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <p className="font-body-md text-xs text-on-surface-variant">
                Your progress is automatically saved as a draft.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-surface relative overflow-y-auto">
          {/* Top Progress Bar */}
          <div className="w-full h-1 bg-surface-variant absolute top-0 left-0 z-20">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full flex flex-col">
            {/* STEP 1: Project Information */}
            {currentStep === 1 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Project Information</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Define the basic parameters and scope of your coastal restoration initiative.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Project Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Sundarbans Mangrove Revival"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Restoration Type <span className="text-error">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
                      >
                        {projectTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Implementing Organization
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                        placeholder="Organization name"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="font-label-md text-xs text-on-surface uppercase">
                      Project Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Provide a detailed overview of the project objectives, methodology, and expected ecological outcomes..."
                      className="w-full px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location & Boundary */}
            {currentStep === 2 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Location & Boundary</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Define the geospatial boundary and geographic zone of the restoration area.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
                  {/* Toolbar */}
                  <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-b border-outline-variant/30 z-10">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-title-md text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">polyline</span>
                        <span>Draw Boundary</span>
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-variant text-on-surface font-title-md text-xs flex items-center gap-1.5 border border-outline-variant/40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        <span>Drop Marker</span>
                      </button>
                    </div>

                    <div className="relative w-60 hidden sm:block">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Search location..."
                        className="w-full pl-9 pr-3 py-1.5 bg-surface rounded-lg font-body-md text-on-surface text-xs border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Simulated Map Area */}
                  <div className="h-80 relative bg-[#0b1c30] overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full absolute inset-0 opacity-40" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="createGisGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#3a5f94" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="#001e40" />
                      <rect width="100%" height="100%" fill="url(#createGisGrid)" />
                      <polygon
                        points="150,80 320,60 380,180 250,220 120,150"
                        fill="#1b6d24"
                        fillOpacity="0.5"
                        stroke="#88d982"
                        strokeWidth="2"
                      />
                      <circle cx="240" cy="140" r="5" fill="#ba1a1a" stroke="#fff" strokeWidth="1.5" />
                    </svg>

                    {/* Overlay Stats Box */}
                    <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-xl shadow-md w-60 border border-outline-variant/30 flex flex-col gap-2 z-10">
                      <h3 className="font-title-md text-xs text-on-surface flex items-center gap-1.5 border-b border-outline-variant/20 pb-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">layers</span>
                        Boundary Stats
                      </h3>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-label-md text-on-surface-variant">TOTAL AREA</span>
                        <span className="font-mono-data text-primary font-bold text-sm">
                          {formData.area} ha
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-label-md text-on-surface-variant">PERIMETER</span>
                        <span className="font-mono-data text-on-surface">4.8 km</span>
                      </div>
                      <div className="mt-1 pt-1.5 border-t border-outline-variant/20 text-[10px] font-mono-data text-on-surface-variant text-right">
                        {formData.lat}°N, {formData.lng}°E
                      </div>
                    </div>
                  </div>

                  {/* Input Fields for Location */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-container-lowest">
                    <div>
                      <label className="font-label-md text-xs text-on-surface uppercase">State</label>
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-surface rounded-xl border border-outline-variant/50 text-xs font-title-md cursor-pointer"
                      >
                        {indianStates.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label-md text-xs text-on-surface uppercase">Total Area (ha)</label>
                      <input
                        type="number"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 bg-surface rounded-xl border border-outline-variant/50 text-xs font-mono-data"
                      />
                    </div>
                    <div>
                      <label className="font-label-md text-xs text-on-surface uppercase">Est. CO2e (tonnes)</label>
                      <input
                        type="number"
                        value={formData.estCO2e}
                        onChange={(e) => handleInputChange('estCO2e', parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 bg-surface rounded-xl border border-outline-variant/50 text-xs font-mono-data text-primary font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Restoration Metrics */}
            {currentStep === 3 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Restoration & Ecological Metrics</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Define planting density, target species, and baseline carbon parameters.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Tree Planting Density (stems/ha)
                      </label>
                      <input
                        type="number"
                        value={formData.treeDensity}
                        onChange={(e) => handleInputChange('treeDensity', parseInt(e.target.value) || 0)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Total Seedlings to Plant
                      </label>
                      <input
                        type="number"
                        value={formData.targetPlants}
                        onChange={(e) => handleInputChange('targetPlants', parseInt(e.target.value) || 0)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Native Plant Species (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.species}
                        onChange={(e) => handleInputChange('species', e.target.value)}
                        placeholder="e.g. Avicennia marina, Rhizophora mucronata, Ceriops tagal"
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Baseline Soil Organic Carbon (SOC %)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.socBaseline}
                        onChange={(e) => handleInputChange('socBaseline', parseFloat(e.target.value) || 0)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Verification Standard
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Verra VM0033 Methodology (Blue Carbon)"
                        className="px-4 py-2.5 bg-surface-container rounded-xl font-body-md text-on-surface-variant text-sm border border-outline-variant/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Community Stakeholders */}
            {currentStep === 4 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Community & Social Safeguards</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Record local Gram Panchayat engagement and equitable benefit-sharing plans.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Panchayat / Community Council Name
                      </label>
                      <input
                        type="text"
                        value={formData.communityName}
                        onChange={(e) => handleInputChange('communityName', e.target.value)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Community Representative Contact
                      </label>
                      <input
                        type="text"
                        value={formData.communityContact}
                        onChange={(e) => handleInputChange('communityContact', e.target.value)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-body-md text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Carbon Revenue Community Share (%)
                      </label>
                      <input
                        type="number"
                        value={formData.revenueShare}
                        onChange={(e) => handleInputChange('revenueShare', parseInt(e.target.value) || 0)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-primary font-bold border border-outline-variant/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-xs text-on-surface uppercase">
                        Direct Local Jobs Created
                      </label>
                      <input
                        type="number"
                        value={formData.localJobs}
                        onChange={(e) => handleInputChange('localJobs', parseInt(e.target.value) || 0)}
                        className="px-4 py-2.5 bg-surface rounded-xl font-mono-data text-on-surface border border-outline-variant/50 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Clearances & Documents */}
            {currentStep === 5 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Clearances & Documentation</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Attach required government environmental clearances and project design documents.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 border border-outline-variant/30">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          description
                        </span>
                        <div>
                          <div className="font-title-md text-sm text-on-surface">
                            CRZ & Forest Department Clearance
                          </div>
                          <div className="text-xs font-mono-data text-on-surface-variant">
                            {formData.crzClearance} (Uploaded)
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono-data text-secondary bg-[#e8f5e9] px-2.5 py-1 rounded">
                        Attached
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          picture_as_pdf
                        </span>
                        <div>
                          <div className="font-title-md text-sm text-on-surface">
                            Project Design Document (PDD)
                          </div>
                          <div className="text-xs font-mono-data text-on-surface-variant">
                            {formData.pddDoc} (Uploaded)
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono-data text-secondary bg-[#e8f5e9] px-2.5 py-1 rounded">
                        Attached
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[28px]">
                          approval
                        </span>
                        <div>
                          <div className="font-title-md text-sm text-on-surface">
                            Gram Panchayat Free & Prior Informed Consent (FPIC)
                          </div>
                          <div className="text-xs font-mono-data text-on-surface-variant">
                            {formData.consentDeed} (Uploaded)
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono-data text-secondary bg-[#e8f5e9] px-2.5 py-1 rounded">
                        Attached
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Review & Submit */}
            {currentStep === 6 && (
              <div className="flex flex-col w-full">
                <div className="mb-6">
                  <h1 className="font-headline-lg text-primary mb-1.5">Review & Confirm</h1>
                  <p className="font-body-lg text-on-surface-variant">
                    Please verify all project details prior to registration on the BlueCarbon MRV ledger.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 border border-outline-variant/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Project Name
                      </div>
                      <div className="font-title-md text-primary font-semibold">
                        {formData.name || 'Maharashtra Mangrove Restoration'}
                      </div>
                    </div>

                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Restoration Type
                      </div>
                      <div className="font-title-md text-on-surface font-semibold">{formData.type}</div>
                    </div>

                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Location & Area
                      </div>
                      <div className="font-title-md text-on-surface">
                        {formData.location} • <strong className="font-mono-data">{formData.area} ha</strong>
                      </div>
                    </div>

                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/30">
                      <div className="text-xs font-label-md text-on-surface-variant uppercase mb-1">
                        Est. Sequestration
                      </div>
                      <div className="font-headline-md text-primary font-bold">
                        {formData.estCO2e} <span className="text-xs font-normal">tCO2e</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-low rounded-xl text-xs text-on-surface-variant space-y-2 border border-outline-variant/20">
                    <div className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                      Regulatory Declaration
                    </div>
                    <p>
                      By submitting this registration, you certify that all geospatial boundaries,
                      ecological baseline metrics, and stakeholder agreements conform to national coastal
                      wetland governance protocols.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer / Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-xl font-title-md text-primary border border-primary hover:bg-primary/5 transition-colors text-sm"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-2.5 rounded-xl font-title-md bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 text-sm shadow-sm ml-auto"
                >
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-8 py-2.5 rounded-xl font-title-md bg-secondary text-white hover:bg-[#14521b] transition-all flex items-center gap-2 text-sm shadow-sm ml-auto"
                >
                  <span>Submit Registration</span>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog Overlay */}
      {submittedProject && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full text-center flex flex-col items-center border border-outline-variant/30">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[40px] text-on-secondary-container">
                check_circle
              </span>
            </div>
            <h2 className="font-headline-md text-on-surface mb-2">Project Registered</h2>
            <p className="font-body-md text-on-surface-variant mb-6 text-sm">
              Your restoration project has been successfully submitted to the registry pending initial verification.
            </p>
            <div className="bg-surface p-4 rounded-xl w-full mb-6 border border-outline-variant/30">
              <div className="font-label-md text-on-surface-variant mb-1 text-xs">REGISTRY ID</div>
              <div className="font-mono-data text-primary text-lg font-bold tracking-wider">
                {submittedProject.id}
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate(ROUTES.ADMIN_PROJECTS || '/admin/projects')}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-title-md text-sm hover:bg-primary-container transition-colors shadow-sm"
              >
                View Projects
              </button>
              <button
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD || '/admin/dashboard')}
                className="flex-1 py-3 rounded-xl border border-primary text-primary font-title-md text-sm hover:bg-primary/5 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
