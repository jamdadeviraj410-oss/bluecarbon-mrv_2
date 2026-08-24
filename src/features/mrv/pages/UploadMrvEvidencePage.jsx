import { useState, useRef } from 'react';

const EVIDENCE_TYPES = [
  {
    id: 'FIELD_SURVEY',
    title: 'Mobile / Field Survey',
    description: 'Direct observation data from on-ground field agents.',
    icon: 'smartphone',
    accentColor: 'border-t-primary',
    iconBg: 'bg-primary-container text-on-primary-container',
    tags: ['Photos', 'GPS Tracks', 'CSV'],
    badgeStyle: 'bg-surface text-on-surface',
  },
  {
    id: 'DRONE_SURVEY',
    title: 'Drone Survey',
    description: 'High-resolution aerial imagery and point clouds.',
    icon: 'flight',
    accentColor: 'border-t-secondary',
    iconBg: 'bg-secondary-container text-on-secondary-container',
    tags: ['GeoTIFF', 'LAS/LAZ'],
    badgeStyle: 'bg-surface text-on-surface',
  },
  {
    id: 'GROUND_SENSORS',
    title: 'Ground Sensors',
    description: 'Continuous telemetry from deployed IoT devices.',
    icon: 'sensors',
    accentColor: 'border-t-tertiary-container',
    iconBg: 'bg-tertiary-container text-on-tertiary-container',
    tags: ['JSON', 'Telemetry Log'],
    badgeStyle: 'bg-surface text-on-surface',
  },
  {
    id: 'DOCUMENTS',
    title: 'Documents',
    description: 'Legal, land rights, and contextual reports.',
    icon: 'description',
    accentColor: 'border-t-surface-tint',
    iconBg: 'bg-surface-variant text-on-surface-variant',
    tags: ['PDF', 'DOCX'],
    badgeStyle: 'bg-surface text-on-surface',
  },
];

const INITIAL_PROJECTS = [
  { id: 'PRJ-2023-089', name: 'Maharashtra Mangrove Restoration', area: '128.0 ha', state: 'Maharashtra' },
  { id: 'PRJ-2023-104', name: 'Sundarbans Biosphere Reserve', area: '340.5 ha', state: 'West Bengal' },
  { id: 'PRJ-2024-012', name: 'Gulf of Mannar Seagrass Initiative', area: '85.0 ha', state: 'Tamil Nadu' },
  { id: 'PRJ-2024-031', name: 'Andaman Coral & Mangrove Project', area: '210.0 ha', state: 'Andaman & Nicobar' },
];

const INITIAL_UPLOADS = [
  {
    id: 'upl-001',
    name: 'field_survey_siteA_photos.zip',
    size: '42.5 MB',
    type: 'image',
    iconColor: 'text-secondary',
    status: 'VALIDATED',
    statusLabel: 'Validated',
    progress: 100,
  },
  {
    id: 'upl-002',
    name: 'drone_ortho_maharashtra.tif',
    size: '156 MB',
    type: 'map',
    iconColor: 'text-primary',
    status: 'PROCESSING',
    statusLabel: 'Processing',
    progress: 65,
  },
  {
    id: 'upl-003',
    name: 'salinity_ph_telemetry_oct.json',
    size: '4.8 MB',
    type: 'sensors',
    iconColor: 'text-tertiary-container',
    status: 'VALIDATED',
    statusLabel: 'Validated',
    progress: 100,
  },
];

export default function UploadMrvEvidencePage() {
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-2023-089');
  const [selectedType, setSelectedType] = useState('FIELD_SURVEY');
  const [uploads, setUploads] = useState(INITIAL_UPLOADS);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);

  const currentProject = INITIAL_PROJECTS.find((p) => p.id === selectedProjectId) || INITIAL_PROJECTS[0];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  };

  const addFiles = (files) => {
    const newItems = Array.from(files).map((f, idx) => ({
      id: `upl-${Date.now()}-${idx}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: selectedType === 'DRONE_SURVEY' ? 'map' : selectedType === 'GROUND_SENSORS' ? 'sensors' : selectedType === 'DOCUMENTS' ? 'description' : 'image',
      iconColor: selectedType === 'DRONE_SURVEY' ? 'text-secondary' : 'text-primary',
      status: 'VALIDATED',
      statusLabel: 'Validated',
      progress: 100,
    }));
    setUploads((prev) => [...newItems, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveUpload = (id) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmitEvidence = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 xl:p-8 gap-6 bg-background min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface font-bold mb-1">Upload MRV Evidence</h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl">
            Submit field, drone, sensor and supporting evidence for project verification.
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center justify-between gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl hover:bg-surface-container border border-outline-variant/40 transition-colors w-full sm:w-[320px] shadow-xs text-left"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                CURRENT PROJECT
              </span>
              <span className="font-title-md text-sm font-semibold text-on-surface truncate">
                {currentProject.name}
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">
              unfold_more
            </span>
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-full sm:w-[320px] bg-surface rounded-xl shadow-lg border border-outline-variant/30 z-30 py-1 overflow-hidden">
              {INITIAL_PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left flex flex-col hover:bg-surface-container-low transition-colors ${
                    proj.id === selectedProjectId ? 'bg-primary-container/20 font-bold' : ''
                  }`}
                >
                  <span className="font-title-md text-xs text-on-surface">{proj.name}</span>
                  <span className="font-mono-data text-[11px] text-on-surface-variant">
                    {proj.id} • {proj.area} • {proj.state}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Evidence Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {EVIDENCE_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer relative overflow-hidden border ${
                isSelected ? 'border-primary shadow-sm ring-1 ring-primary/20' : 'border-outline-variant/30'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${type.accentColor.replace('border-t-', 'bg-')}`}></div>
              <div className={`w-11 h-11 rounded-xl ${type.iconBg} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-[24px]">{type.icon}</span>
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="font-title-lg text-sm font-bold text-on-surface mb-1">{type.title}</h3>
                <p className="font-body-md text-xs text-on-surface-variant mb-3 line-clamp-2 leading-relaxed">
                  {type.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {type.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-surface-container text-on-surface font-mono-data text-[11px] rounded-md font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Files & Current Uploads (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-title-lg text-base font-bold text-on-surface">Upload Files</h2>
              <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Drag & Drop Supported
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors cursor-pointer group ${
                isDragging
                  ? 'border-primary bg-primary-container/10'
                  : 'border-outline-variant/60 bg-surface hover:bg-surface-container-low'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-on-primary-container">
                <span className="material-symbols-outlined text-[30px]">cloud_upload</span>
              </div>
              <h3 className="font-title-md text-sm font-bold text-on-surface mb-1">
                Select files or drag and drop here
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant mb-4">
                Supports CSV, GeoTIFF, JPG, PNG, PDF, JSON up to 500MB
              </p>
              <button
                type="button"
                className="bg-primary text-on-primary font-title-md text-xs font-bold py-2 px-5 rounded-full hover:bg-primary-container transition-all shadow-xs"
              >
                Browse Files
              </button>
            </div>

            {/* Current Uploads Section */}
            <div className="mt-6 flex flex-col gap-3">
              <h4 className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                Current Uploads ({uploads.length})
              </h4>

              {uploads.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3.5 bg-surface-container rounded-xl relative overflow-hidden border border-outline-variant/20"
                >
                  {file.progress < 100 && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  )}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`material-symbols-outlined ${file.iconColor} text-[22px]`}>
                      {file.type}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-title-md text-xs font-bold text-on-surface truncate">
                        {file.name}
                      </span>
                      <span className="font-mono-data text-[11px] text-on-surface-variant">
                        {file.size} {file.progress < 100 ? `• ${file.progress}% Uploading...` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {file.status === 'VALIDATED' ? (
                      <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full font-label-md text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Validated
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-surface-variant text-on-surface-variant rounded-full font-label-md text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        Processing
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveUpload(file.id)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1"
                      title="Remove file"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Data Validation Summary & Submission (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-6 flex flex-col">
            <h2 className="font-title-lg text-base font-bold text-on-surface mb-4">
              Data Validation Summary
            </h2>

            {/* Metric Tiles 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-surface-container p-3.5 rounded-xl flex flex-col">
                <span className="font-display-lg text-2xl font-bold text-on-surface mb-0.5">1,248</span>
                <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Records Detected
                </span>
              </div>
              <div className="bg-surface-container p-3.5 rounded-xl flex flex-col">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                  <span className="font-display-lg text-2xl font-bold text-on-surface">1,240</span>
                </div>
                <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Valid Records
                </span>
              </div>
              <div className="bg-surface-container p-3.5 rounded-xl flex flex-col">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-error text-[18px]">error</span>
                  <span className="font-display-lg text-2xl font-bold text-on-surface">6</span>
                </div>
                <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Invalid Records
                </span>
              </div>
              <div className="bg-surface-container p-3.5 rounded-xl flex flex-col">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">content_copy</span>
                  <span className="font-display-lg text-2xl font-bold text-on-surface">2</span>
                </div>
                <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Duplicates
                </span>
              </div>
            </div>

            {/* Submission Checklist */}
            <h3 className="font-title-md text-xs font-bold text-on-surface uppercase tracking-wider mb-3">
              Submission Checklist
            </h3>
            <ul className="flex flex-col gap-2.5 mb-6 flex-1">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <span className="font-body-md text-xs text-on-surface font-medium">Field Observation CSV</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                </div>
                <span className="font-body-md text-xs text-on-surface-variant">Drone Imagery (Optional)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                </div>
                <span className="font-body-md text-xs text-on-surface-variant">Sensor Telemetry (Optional)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <span className="font-body-md text-xs text-on-surface font-medium">Project Metadata Document</span>
              </li>
            </ul>

            {/* Primary Submit CTA */}
            <button
              onClick={handleSubmitEvidence}
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary font-title-md text-sm font-bold py-3 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  <span>Submitting Evidence...</span>
                </>
              ) : (
                <>
                  <span>Submit Evidence for MRV</span>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-outline-variant/30 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold text-on-surface mb-1">
              Evidence Submitted Successfully
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant mb-6 leading-relaxed">
              Your MRV evidence package for <strong>{currentProject.name}</strong> has been queued for verification and cryptographic hash computation.
            </p>
            <div className="bg-surface-container p-3 rounded-xl w-full mb-6 text-left">
              <div className="flex justify-between font-mono-data text-[11px] text-on-surface-variant mb-1">
                <span>BATCH ID</span>
                <span className="font-bold text-on-surface">EVD-2026-089-A</span>
              </div>
              <div className="flex justify-between font-mono-data text-[11px] text-on-surface-variant">
                <span>AUDIT QUEUE</span>
                <span className="text-secondary font-bold">NCCR Auditor Pool 1</span>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary text-on-primary font-title-md text-xs font-bold py-2.5 rounded-xl hover:bg-primary-container transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
