import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COASTAL_STATES, HIERARCHICAL_SPATIAL_DATA } from '../adapters/gisAdapter';
import { ROUTES } from '../../../utils/constants';

export default function NationalMapExplorerPage() {
  const [selectedStateName, setSelectedStateName] = useState('West Bengal');
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-2023-089');
  const [selectedMrvId, setSelectedMrvId] = useState('SUB-2023-001');
  const [activeLayer, setActiveLayer] = useState('ALL'); // 'ALL', 'CANOPY', 'SENSORS', 'DRONE'

  const stateData = HIERARCHICAL_SPATIAL_DATA.states[selectedStateName] || HIERARCHICAL_SPATIAL_DATA.states['West Bengal'];
  const projectData = stateData.projects.find((p) => p.id === selectedProjectId) || stateData.projects[0];
  const mrvData = projectData?.mrvSubmissions?.find((m) => m.id === selectedMrvId) || projectData?.mrvSubmissions?.[0];

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header & Breadcrumb Hierarchy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            <span>India National Registry</span>
            <span className="text-outline">/</span>
            <span className="text-primary">{selectedStateName}</span>
            <span className="text-outline">/</span>
            <span className="text-secondary">{projectData ? projectData.name : 'Project'}</span>
          </div>
          <h1 className="font-headline-lg text-primary text-[26px] md:text-[30px] font-extrabold tracking-tight">
            National Spatial & MRV Telemetry Explorer
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs md:text-sm">
            Interactive multi-tier spatial drilldown: National Map → Maritime State → Restoration Boundary → MRV Plots → Drone & Sensor Telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.ADMIN_GOVERNANCE}
            className="px-4 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-title-sm text-xs font-bold hover:bg-surface-container flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Governance Hub
          </Link>
          <Link
            to={ROUTES.ADMIN_MRV_WORKSPACE.replace(':projectId', selectedProjectId || 'PRJ-2023-089')}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-sm text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">biotech</span>
            MRV Workspace
          </Link>
        </div>
      </div>

      {/* Layer Toggles & State Carousel */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
        {/* Coastal States Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap mr-1">
            Coastal States:
          </span>
          {COASTAL_STATES.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setSelectedStateName(st.name);
                const nextState = HIERARCHICAL_SPATIAL_DATA.states[st.name];
                if (nextState && nextState.projects[0]) {
                  setSelectedProjectId(nextState.projects[0].id);
                  if (nextState.projects[0].mrvSubmissions?.[0]) {
                    setSelectedMrvId(nextState.projects[0].mrvSubmissions[0].id);
                  }
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedStateName === st.name
                  ? 'bg-primary text-on-primary shadow-sm scale-105'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }}></span>
              {st.name} ({st.projectsCount})
            </button>
          ))}
        </div>

        {/* Spatial Layer Controls */}
        <div className="flex items-center gap-1.5 self-end lg:self-auto bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/30">
          {[
            { id: 'ALL', label: 'All Layers', icon: 'layers' },
            { id: 'CANOPY', label: 'Canopy NDVI', icon: 'nature' },
            { id: 'SENSORS', label: 'IoT Sensors', icon: 'sensors' },
            { id: 'DRONE', label: 'Drone Flights', icon: 'flight' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                activeLayer === layer.id
                  ? 'bg-surface text-primary shadow-sm border border-outline-variant/40'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{layer.icon}</span>
              <span>{layer.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map & Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spatial Map Display (Simulated with rich GIS vector overlays) */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[20px]">map</span>
              <span>GIS GIS-Boundary: {projectData?.name || selectedStateName}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono-data bg-secondary/15 text-secondary">
                Lat: {projectData?.lat || 21.9497}, Lng: {projectData?.lng || 88.9006}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono-data">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Live Telemetry Ingest
            </div>
          </div>

          <div className="relative w-full h-[520px] bg-slate-900 overflow-hidden group">
            {/* Satellite Base Layer */}
            <div 
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFP2ZKxjWPZy2p8VQLUC-WABJ7EeqQ_3mxsXLua_dM6iXYAqdfwZ58Y5od3LoxfoCGjl9fAYvF44XKqF-ZMO2y_jiO2uo3ExfVkiOkUAwGMizsb2dapPELg8hCUMZvFzIzGyInWekFDkQvRR0yZzpnfPp0_e3fiv3oTu6R2TlYUREX6rbXB7kzfEiyPANNZVTBeSCME22eLl7svQCGTt7_pTQMgz-VoHQP1TbXM3Yon6gkMG7GLV27Iw')`,
              }}
            ></div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b6d2415_1px,transparent_1px),linear-gradient(to_bottom,#1b6d2415_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

            {/* SVG Polygon Restoration Area */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polygon
                points="240,160 480,180 540,320 380,390 210,300"
                className="fill-secondary/25 stroke-secondary stroke-2 stroke-dasharray-4 animate-pulse"
              />
              <polyline
                points="260,220 340,260 420,240 490,290"
                className="stroke-amber-400 stroke-2 fill-none"
              />
            </svg>

            {/* Spatial Markers (Plots & Evidence) */}
            {mrvData?.plots?.map((plot, idx) => (
              <div
                key={plot.plotId}
                className="absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
                style={{
                  top: `${35 + idx * 18}%`,
                  left: `${40 + idx * 12}%`,
                }}
                title={`${plot.plotId}: ${plot.species} (${plot.biomassDensity})`}
              >
                <div className="w-8 h-8 rounded-full bg-secondary/90 text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
                  P{idx + 1}
                </div>
                <div className="hidden group-hover:block absolute left-10 top-0 bg-black/90 text-white text-xs p-2 rounded-lg backdrop-blur-md whitespace-nowrap shadow-xl">
                  <strong>{plot.plotId}</strong> ({plot.species})<br/>
                  Biomass: {plot.biomassDensity} | Soil C: {plot.soilCarbon}
                </div>
              </div>
            ))}

            {/* Drone Telemetry Flight Path Marker */}
            <div className="absolute top-[28%] left-[58%] z-20 transform -translate-x-1/2 -translate-y-1/2">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xl font-bold text-xs animate-bounce">
                <span className="material-symbols-outlined text-[16px]">flight</span>
                <span>Drone Flight D-88 (NDVI 0.84)</span>
              </div>
            </div>

            {/* Bottom Floating Spatial Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-30 bg-black/75 backdrop-blur-md rounded-xl p-3 border border-white/10 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary"></span> Verified Plots</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Drone Orthomosaic</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400"></span> IoT Porewater Salinity</div>
              </div>
              <div className="font-mono-data text-white/70">
                Resolution: 0.5m/px • Coordinate System: WGS 84 / UTM Zone 45N
              </div>
            </div>
          </div>
        </div>

        {/* Right Hierarchical Breakdown: Plots, Soil Samples, and Evidence Proofs */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active MRV Card */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active MRV Submission</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                {mrvData?.status || 'VERIFIED'}
              </span>
            </div>
            <h3 className="font-headline-sm text-on-surface font-bold text-[16px]">{mrvData?.title || 'Q3 2023 Periodic MRV Verification'}</h3>
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-on-surface-variant">Reporting Period:</span> <strong className="text-on-surface">{mrvData?.period || 'Jul 2023 - Sep 2023'}</strong></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Claimed Carbon:</span> <strong className="text-secondary font-mono-data">{mrvData?.carbonEstimate?.toLocaleString() || '12,450'} tCO2e</strong></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Project Area:</span> <strong className="text-on-surface font-mono-data">{projectData?.areaHa || 450} Hectares</strong></div>
            </div>
          </div>

          {/* Measurement Plots */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">science</span>
                Sampling Plots & Biomass Density
              </h4>
              <span className="text-xs font-mono-data text-on-surface-variant">{mrvData?.plots?.length || 0} Plots</span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {mrvData?.plots?.map((plot) => (
                <div key={plot.plotId} className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-on-surface">
                    <span className="font-mono-data text-primary">{plot.plotId}</span>
                    <span className="text-secondary">{plot.biomassDensity}</span>
                  </div>
                  <div className="text-on-surface-variant italic">{plot.species}</div>
                  <div className="text-[11px] text-on-surface-variant flex justify-between pt-0.5">
                    <span>Sediment Soil Carbon: {plot.soilCarbon}</span>
                    <span className="font-mono-data">95% Conf</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Telemetry Files */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              Multi-Source Telemetry Evidence
            </h4>
            <div className="space-y-2">
              {mrvData?.evidencePoints?.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {ev.type === 'DRONE_NDVI' ? 'flight' : ev.type === 'SOIL_CORE' ? 'biotech' : 'pin_drop'}
                    </span>
                    <div>
                      <div className="font-bold text-on-surface">{ev.title}</div>
                      <div className="text-on-surface-variant text-[11px] font-mono-data">{ev.id} • {new Date(ev.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary/10 text-secondary">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
