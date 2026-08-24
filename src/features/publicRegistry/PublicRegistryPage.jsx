import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import {
  publicRegistryProjects,
  getPublicRegistryProjects,
} from './publicRegistryService';

export default function PublicRegistryPage() {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(45);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'cards'
  const [zoomLevel, setZoomLevel] = useState(1);

  // Detail Drawer State
  const [selectedProject, setSelectedProject] = useState(publicRegistryProjects[0]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return getPublicRegistryProjects({
      search: searchTerm,
      country: selectedCountry,
      type: selectedType,
      maxPrice: maxPrice,
    });
  }, [searchTerm, selectedCountry, selectedType, maxPrice]);

  // Handle Pin / Project Select
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedType('All');
    setMaxPrice(45);
  };

  // Handle Download Project Data
  const handleDownloadProjectData = (project) => {
    const data = {
      registryId: project.id,
      projectName: project.name,
      location: project.location,
      country: project.countryName,
      restorationType: project.type,
      establishedYear: project.estYear,
      developer: project.developer,
      totalSequestered: `${project.totalSequestered} tCO2e`,
      areaCoverage: `${project.areaCoverage} ha`,
      creditPrice: project.priceDisplay,
      status: project.status,
      ledgerVerification: project.ledgerTimeline,
      verificationAuthority: 'National Centre for Coastal Research (NCCR)',
      dltNetwork: 'Polygon Mainnet (ERC-1155 EcoToken)',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.id}-public-record.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      type: 'success',
      message: `Downloaded public dataset for ${project.id}`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface bg-surface min-h-screen">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-primary text-on-primary rounded-xl shadow-xl border border-outline-variant/30 animate-in fade-in">
          <span className="material-symbols-outlined text-secondary-fixed text-[22px]">check_circle</span>
          <span className="text-xs sm:text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-on-primary/70 hover:text-on-primary p-0.5 rounded"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative w-full min-h-[380px] sm:h-[420px] overflow-hidden bg-surface-container-low flex items-center justify-center py-12">
        {/* Abstract gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest via-surface-container-high to-surface-variant opacity-60 z-0"></div>

        {/* Decorative subtle grid shapes */}
        <svg className="absolute inset-0 w-full h-full text-primary-fixed-dim/25 z-0" xmlns="http://www.w3.org/2000/svg">
          <pattern height="40" id="registryGrid" patternUnits="userSpaceOnUse" width="40">
            <circle cx="2" cy="2" fill="currentColor" r="1.5"></circle>
          </pattern>
          <rect fill="url(#registryGrid)" height="100%" width="100%"></rect>
        </svg>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center gap-4 sm:gap-5">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-full shadow-sm transition-transform hover:scale-105 duration-300">
            <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">verified_user</span>
            <span className="font-label-md text-xs font-semibold uppercase tracking-wider">
              NCCR Certified Trust Framework
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display-lg text-2xl sm:text-4xl md:text-5xl font-bold text-on-surface tracking-tight text-balance drop-shadow-sm m-0 leading-tight">
            A Transparent Ledger for Global Coastal Restoration
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-sm sm:text-base text-on-surface-variant max-w-2xl text-balance m-0">
            Explore verified mangrove and seagrass sequestration projects worldwide. Every metric backed by immutable blockchain audit trails.
          </p>

          {/* Highlights KPI Cards */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <div className="bg-surface rounded-xl shadow-md p-4 flex flex-col items-center justify-center min-w-[150px] relative overflow-hidden group border border-outline-variant/40">
              <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="font-title-md text-xs text-primary z-10 relative font-semibold">Total Volume</span>
              <span className="font-headline-lg text-2xl font-bold text-on-surface z-10 relative">14.2M</span>
              <span className="font-mono-data text-[11px] text-on-surface-variant z-10 relative">tCO2e Verified</span>
            </div>

            <div className="bg-surface rounded-xl shadow-md p-4 flex flex-col items-center justify-center min-w-[150px] relative overflow-hidden group border border-outline-variant/40">
              <div className="absolute inset-0 bg-secondary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="font-title-md text-xs text-secondary z-10 relative font-semibold">Active Projects</span>
              <span className="font-headline-lg text-2xl font-bold text-on-surface z-10 relative">342</span>
              <span className="font-mono-data text-[11px] text-on-surface-variant z-10 relative">Global Sites</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Explorer Section */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6 relative z-20">
        {/* Search & Filter Sidebar (Left, w-80 on lg) */}
        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-5 bg-surface rounded-2xl shadow-lg p-5 sm:p-6 z-10 border border-outline-variant/60">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline-md text-xl font-bold text-on-surface m-0">Explore Registry</h2>
            <p className="font-body-md text-xs text-on-surface-variant m-0">
              Filter by project parameters to discover specific verified assets.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search projects, regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest rounded-xl text-on-surface font-body-md text-xs sm:text-sm shadow-sm outline-none border border-outline-variant hover:bg-surface-container-low focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Filters List */}
          <div className="flex flex-col gap-4">
            {/* Country / Region Filter */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="font-label-md text-xs font-semibold text-on-surface uppercase tracking-wider">
                Country / Region
              </label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl text-on-surface font-body-md text-xs sm:text-sm shadow-sm outline-none border border-outline-variant appearance-none cursor-pointer pr-8"
                >
                  <option value="">All Regions</option>
                  <option value="in">India</option>
                  <option value="id">Indonesia</option>
                  <option value="mg">Madagascar</option>
                  <option value="co">Colombia</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center">
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* Restoration Type Filter Pills */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs font-semibold text-on-surface uppercase tracking-wider">
                Restoration Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Mangrove', 'Seagrass', 'Tidal Marsh'].map((type) => {
                  const isActive = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-colors cursor-pointer shadow-sm ${
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-highest text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Credit Price Range Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-label-md text-xs font-semibold text-on-surface uppercase tracking-wider">
                <span>Credit Price</span>
                <span className="text-primary font-mono-data font-bold">${maxPrice} / tCO2e</span>
              </div>
              <input
                type="range"
                min="15"
                max="45"
                step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-variant rounded-full accent-primary cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-mono-data">
                <span>$15</span>
                <span>$30</span>
                <span>$45</span>
              </div>
            </div>
          </div>

          {/* Active Filters Summary & Clear */}
          <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center text-xs">
            <span className="font-label-md font-semibold text-on-surface-variant">
              Showing {filteredProjects.length} Projects
            </span>
            <button
              onClick={handleClearFilters}
              className="text-primary font-label-md font-semibold hover:text-primary-container transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list_off</span>
              Clear
            </button>
          </div>
        </aside>

        {/* Main Map & Explorer Area (Right) */}
        <div className="flex-1 flex flex-col relative min-h-[580px] lg:h-[700px] bg-surface-container-lowest rounded-2xl shadow-lg overflow-hidden border border-outline-variant/60">
          {viewMode === 'map' ? (
            /* Interactive Satellite Map View */
            <div className="w-full h-full relative overflow-hidden group/map flex-1">
              {/* Map Background with zoom transform */}
              <div
                className="w-full h-full bg-cover bg-center absolute inset-0 z-0 transition-transform duration-700"
                style={{
                  transform: `scale(${zoomLevel})`,
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBuXD9_qXDdzhEOJUeUp4m7Q75K83Ee9Mc1jT-jPtBCyK65ziXOOpNn7KpDndZ1B47zznrWGzzDKb8POTlY9bukfBT5m85JP4hYaiVVl4i4_hUuzF1wN-TwXeKa3yoCW87ogsavvD313MEVpdzj-ET1Z_S2fV0L-Ugdg2KGolg7EnsQUM6zMUhi787e5gzeC1MLHqy5gAF-X4wn2DipXWMj1CWR_qFTuZKe0XskzXvxFmuYZM-ICIdmRA')`,
                }}
              ></div>

              {/* Overlay Controls (Top Right) */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <div className="flex bg-surface rounded-xl shadow-md p-1 border border-outline-variant/40">
                  <button
                    onClick={() => setViewMode('map')}
                    title="Map View"
                    className="p-1.5 rounded-lg bg-primary text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    title="Grid Cards View"
                    className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  </button>
                </div>

                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                  aria-label="Zoom In"
                  className="w-9 h-9 bg-surface text-on-surface rounded-xl shadow-md flex items-center justify-center hover:bg-surface-container transition-colors hover:text-primary cursor-pointer border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.9, z - 0.1))}
                  aria-label="Zoom Out"
                  className="w-9 h-9 bg-surface text-on-surface rounded-xl shadow-md flex items-center justify-center hover:bg-surface-container transition-colors hover:text-primary cursor-pointer border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  aria-label="Reset View"
                  className="w-9 h-9 bg-surface text-on-surface rounded-xl shadow-md flex items-center justify-center hover:bg-surface-container transition-colors hover:text-primary cursor-pointer border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[18px]">my_location</span>
                </button>
              </div>

              {/* Map Legend (Bottom Left) */}
              <div className="absolute bottom-4 left-4 z-20 bg-surface/90 backdrop-blur-md rounded-xl shadow-md p-3 flex flex-col gap-1.5 max-w-[210px] border border-outline-variant/50">
                <span className="font-label-md text-[11px] font-semibold text-on-surface uppercase tracking-wider">
                  Status Overlay
                </span>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_6px_rgba(27,109,36,0.8)]"></div>
                  <span>Verified Issuance</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00abc1] shadow-[0_0_6px_rgba(0,188,212,0.8)]"></div>
                  <span>Monitoring Phase</span>
                </div>
              </div>

              {/* Simulated Map Pins */}
              {filteredProjects.map((proj) => {
                const isSelected = selectedProject?.id === proj.id && isDetailOpen;
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    style={{
                      top: proj.mapPosition?.top || '50%',
                      left: proj.mapPosition?.left || '50%',
                    }}
                    title={`${proj.name} (${proj.totalSequestered} tCO2e)`}
                    className="absolute z-30 group cursor-pointer -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  >
                    <div
                      className={`w-4 h-4 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_4px_10px_rgba(0,0,0,0.3)] transition-transform duration-300 relative group-hover:scale-130 ${
                        proj.statusCategory === 'verified' ? 'bg-secondary' : 'bg-[#00abc1]'
                      } ${isSelected ? 'scale-125 ring-2 ring-primary' : ''}`}
                    >
                      {proj.statusCategory === 'verified' && (
                        <div className="absolute inset-0 bg-secondary rounded-full animate-ping opacity-60 pointer-events-none"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Grid Cards View */
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-title-lg text-base font-bold text-on-surface">Registered Projects</h3>
                <div className="flex bg-surface rounded-xl shadow-md p-1 border border-outline-variant/40">
                  <button
                    onClick={() => setViewMode('map')}
                    className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className="p-1.5 rounded-lg bg-primary text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className="bg-surface rounded-xl border border-outline-variant/60 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col group"
                  >
                    <div className="h-32 w-full bg-cover bg-center relative" style={{ backgroundImage: `url('${proj.imageUrl}')` }}>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-white text-[11px] font-label-md font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {proj.status}
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-surface/90 font-mono-data text-primary text-[10px] font-bold">
                        {proj.id}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                      <div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>{proj.location}</span>
                        </div>
                        <h4 className="font-title-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors mt-0.5 truncate">
                          {proj.name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30 text-xs">
                        <div>
                          <span className="text-on-surface-variant block text-[10px]">Sequestered</span>
                          <span className="font-bold text-secondary">{proj.totalSequestered} tCO2e</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block text-[10px]">Area</span>
                          <span className="font-bold text-on-surface">{proj.areaCoverage} ha</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Detail Slide-Out Panel */}
          <div
            id="project-detail-panel"
            className={`absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-surface z-40 shadow-[-8px_0_24px_rgba(0,0,0,0.08)] transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col overflow-y-auto border-l border-outline-variant/60 ${
              isDetailOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
            }`}
          >
            {selectedProject && (
              <>
                {/* Detail Header Image */}
                <div className="relative w-full h-48 bg-surface-variant flex-shrink-0">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${selectedProject.imageUrl}')` }}
                  ></div>

                  {/* Close Button */}
                  <button
                    aria-label="Close panel"
                    onClick={() => setIsDetailOpen(false)}
                    className="absolute top-3 right-3 w-8 h-8 bg-surface/80 backdrop-blur text-on-surface rounded-full flex items-center justify-center shadow-sm hover:bg-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>

                  {/* Status Badge Overlaid */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-[rgba(76,175,80,0.9)] backdrop-blur text-[#ffffff] rounded-md shadow-sm flex items-center gap-1 font-label-md text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {selectedProject.status}
                  </div>
                </div>

                {/* Detail Content */}
                <div className="p-5 flex flex-col gap-5 flex-grow text-xs sm:text-sm">
                  {/* Title & Meta */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-xs">
                      <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                      <span>{selectedProject.location}</span>
                    </div>
                    <h3 className="font-headline-lg text-lg sm:text-xl font-bold text-on-surface leading-tight m-0">
                      {selectedProject.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface rounded font-mono-data text-xs font-semibold">
                        ID: {selectedProject.id}
                      </span>
                      <span className="font-body-md text-xs text-on-surface-variant">
                        Est. {selectedProject.estYear}
                      </span>
                    </div>
                  </div>

                  {/* Project Developer Card */}
                  <div className="flex items-center gap-3 p-3 bg-surface-container-lowest shadow-sm rounded-xl border border-outline-variant/40">
                    <div className="w-10 h-10 bg-surface-variant rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                    </div>
                    <div className="flex flex-col flex-grow min-w-0">
                      <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {selectedProject.developerRole}
                      </span>
                      <span className="font-title-md text-xs font-bold text-on-surface truncate">
                        {selectedProject.developer}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-0.5">
                      <span className="font-label-md text-[11px] text-on-surface-variant">Total Sequestered</span>
                      <span className="font-headline-md text-lg font-bold text-secondary">
                        {selectedProject.totalSequestered}{' '}
                        <span className="text-xs font-title-md font-semibold">tCO2e</span>
                      </span>
                    </div>

                    <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-0.5">
                      <span className="font-label-md text-[11px] text-on-surface-variant">Area Coverage</span>
                      <span className="font-headline-md text-lg font-bold text-on-surface">
                        {selectedProject.areaCoverage}{' '}
                        <span className="text-xs font-title-md font-semibold">ha</span>
                      </span>
                    </div>
                  </div>

                  {/* Blockchain Audit Trail / Ledger Verification */}
                  <div className="flex flex-col gap-2">
                    <h4 className="font-title-md text-xs font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-primary text-[18px]">link</span>
                      Ledger Verification
                    </h4>

                    <div className="relative pl-5 py-1 border-l-2 border-outline-variant/60 ml-2 flex flex-col gap-4">
                      {(selectedProject.ledgerTimeline || []).map((node) => (
                        <div key={node.id} className="relative">
                          <div
                            className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full shadow-[0_0_0_3px_#f8f9ff] ${
                              node.active ? 'bg-primary' : 'bg-outline'
                            }`}
                          ></div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-start">
                              <span className="font-label-md text-xs font-bold text-on-surface">
                                {node.title}
                              </span>
                              <span className="font-mono-data text-[10px] text-on-surface-variant">
                                {node.date}
                              </span>
                            </div>
                            <p className="font-body-md text-xs text-on-surface-variant m-0 leading-relaxed">
                              {node.description}
                            </p>
                            {node.txShort && (
                              <a
                                href={`https://polygonscan.com/tx/${node.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-primary font-mono-data text-[11px] hover:underline mt-1 bg-primary/5 px-2 py-0.5 rounded w-fit"
                              >
                                {node.txShort}
                                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="sticky bottom-0 left-0 right-0 p-4 bg-surface border-t border-outline-variant/40 flex flex-col gap-2 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                  <div className="flex gap-2">
                    <Link
                      to={ROUTES.PUBLIC_PROVENANCE_DETAIL.replace(':id', selectedProject.id)}
                      className="flex-1 py-2.5 px-4 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-xs font-bold rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                      Credit DNA Provenance
                    </Link>
                    <button
                      onClick={() => handleDownloadProjectData(selectedProject)}
                      aria-label="Download Data"
                      title="Download Project Record"
                      className="p-2.5 bg-surface text-primary border border-primary font-label-md rounded-xl shadow-sm hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
