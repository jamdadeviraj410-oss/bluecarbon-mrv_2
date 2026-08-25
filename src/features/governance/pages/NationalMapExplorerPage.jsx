import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COASTAL_STATES, HIERARCHICAL_SPATIAL_DATA } from '../adapters/gisAdapter';
import { ROUTES } from '../../../utils/constants';

export default function NationalMapExplorerPage() {
  const [selectedStateName, setSelectedStateName] = useState('West Bengal');
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-2023-089');
  const [selectedMrvId, setSelectedMrvId] = useState('SUB-2023-001');
  const [activeLayer, setActiveLayer] = useState('ALL'); // 'ALL', 'CANOPY', 'SENSORS', 'DRONE'

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const stateData = HIERARCHICAL_SPATIAL_DATA.states[selectedStateName] || HIERARCHICAL_SPATIAL_DATA.states['West Bengal'];
  const projectData = stateData.projects.find((p) => p.id === selectedProjectId) || stateData.projects[0];
  const mrvData = projectData?.mrvSubmissions?.find((m) => m.id === selectedMrvId) || projectData?.mrvSubmissions?.[0];

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = projectData?.lat || stateData?.lat || 21.9497;
    const initialLng = projectData?.lng || stateData?.lng || 88.9006;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 11,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // CartoDB Voyager Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Viewport, Restoration Polygons, Sampling Plots, and Telemetry Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const targetLat = projectData?.lat || 21.9497;
    const targetLng = projectData?.lng || 88.9006;

    map.flyTo([targetLat, targetLng], 11, {
      duration: 1.0,
      easeLinearity: 0.25,
    });

    // 1. Draw Restoration GIS Polygon Area (offsets around center)
    const polyDeltaLat = 0.018;
    const polyDeltaLng = 0.024;
    const polygonCoords = [
      [targetLat + polyDeltaLat, targetLng - polyDeltaLng],
      [targetLat + polyDeltaLat * 1.2, targetLng + polyDeltaLng * 0.8],
      [targetLat - polyDeltaLat * 0.4, targetLng + polyDeltaLng * 1.3],
      [targetLat - polyDeltaLat * 1.1, targetLng - polyDeltaLng * 0.2],
      [targetLat - polyDeltaLat * 0.6, targetLng - polyDeltaLng * 1.1],
    ];

    const boundaryPolygon = L.polygon(polygonCoords, {
      color: '#1B6D24',
      weight: 2,
      dashArray: '4, 6',
      fillColor: '#1B6D24',
      fillOpacity: activeLayer === 'SENSORS' ? 0.08 : 0.22,
    }).addTo(layerGroup);

    boundaryPolygon.bindTooltip(
      `<strong>${projectData?.name}</strong><br/>Restoration Area: ${projectData?.areaHa || 450} ha`,
      { sticky: true }
    );

    // 2. Sampling Plots (P1, P2, P3...)
    if (activeLayer === 'ALL' || activeLayer === 'CANOPY' || activeLayer === 'SENSORS') {
      (mrvData?.plots || []).forEach((plot, idx) => {
        const plotLat = plot.lat || targetLat + (idx === 0 ? 0.004 : idx === 1 ? -0.005 : 0.006);
        const plotLng = plot.lng || targetLng + (idx === 0 ? 0.005 : idx === 1 ? -0.004 : 0.008);

        const plotIcon = L.divIcon({
          className: 'custom-mrv-plot-pin',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: #1B6D24;
              color: #ffffff;
              font-weight: 800;
              font-size: 11px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ffffff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              cursor: pointer;
            ">
              P${idx + 1}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([plotLat, plotLng], { icon: plotIcon }).addTo(layerGroup);

        marker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2px; min-width: 180px;">
            <div style="font-size: 11px; font-weight: 800; color: #1B6D24; margin-bottom: 2px;">${plot.plotId} (${plot.species})</div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 2px;"><strong>Biomass Density:</strong> ${plot.biomassDensity}</div>
            <div style="font-size: 11px; color: #334155;"><strong>Sediment Soil Carbon:</strong> ${plot.soilCarbon}</div>
          </div>
        `);
      });
    }

    // 3. Drone Flight Trajectory
    if (activeLayer === 'ALL' || activeLayer === 'DRONE' || activeLayer === 'CANOPY') {
      const dronePath = [
        [targetLat + 0.012, targetLng - 0.014],
        [targetLat + 0.008, targetLng + 0.002],
        [targetLat - 0.006, targetLng + 0.012],
        [targetLat - 0.010, targetLng - 0.008],
      ];

      L.polyline(dronePath, {
        color: '#f59e0b',
        weight: 2.5,
        dashArray: '5, 5',
      }).addTo(layerGroup);

      const droneIcon = L.divIcon({
        className: 'custom-drone-pin',
        html: `
          <div style="
            background: #f59e0b;
            color: #0f172a;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            border: 1px solid #ffffff;
          ">
            ✈️ Flight D-88 (NDVI 0.84)
          </div>
        `,
        iconSize: [120, 26],
        iconAnchor: [60, 13],
      });

      L.marker([targetLat + 0.008, targetLng + 0.002], { icon: droneIcon }).addTo(layerGroup);
    }

    // 4. IoT Salinity Sensors
    if (activeLayer === 'ALL' || activeLayer === 'SENSORS') {
      const sensorCoords = [
        [targetLat + 0.003, targetLng - 0.007],
        [targetLat - 0.004, targetLng + 0.006],
      ];

      sensorCoords.forEach((sc, i) => {
        const sensorIcon = L.divIcon({
          className: 'custom-sensor-pin',
          html: `
            <div style="
              width: 14px;
              height: 14px;
              background: #3b82f6;
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 8px rgba(59,130,246,0.8);
            "></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const sMarker = L.marker(sc, { icon: sensorIcon }).addTo(layerGroup);
        sMarker.bindPopup(`<strong>IoT Sensor #${i + 1}</strong><br/>Porewater Salinity: 28.4 ppt<br/>Redox: -142 mV`);
      });
    }
  }, [selectedStateName, selectedProjectId, selectedMrvId, activeLayer, projectData, mrvData]);

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header & Breadcrumb Hierarchy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <span className="shrink-0">India National Registry</span>
            <span className="text-outline shrink-0">/</span>
            <span className="text-primary shrink-0">{selectedStateName}</span>
            <span className="text-outline shrink-0">/</span>
            <span className="text-secondary truncate max-w-[300px] sm:max-w-md">{projectData ? projectData.name : 'Project'}</span>
          </div>
          <h1 className="font-headline-lg text-primary text-[26px] md:text-[30px] font-extrabold tracking-tight m-0 leading-tight">
            National Spatial & MRV Telemetry Explorer
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs md:text-sm m-0 leading-relaxed max-w-4xl">
            Interactive multi-tier spatial drilldown: National Map → Maritime State → Restoration Boundary → MRV Plots → Drone & Sensor Telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
        {/* Spatial Map Display */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[20px]">map</span>
              <span>GIS Boundary: {projectData?.name || selectedStateName}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono-data bg-secondary/15 text-secondary">
                Lat: {Number(projectData?.lat || 21.9497).toFixed(4)}, Lng: {Number(projectData?.lng || 88.9006).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono-data">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Live Telemetry Ingest
            </div>
          </div>

          <div className="relative w-full h-[520px] bg-slate-900 overflow-hidden">
            {/* Interactive Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Bottom Floating Spatial Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-[400] bg-black/75 backdrop-blur-md rounded-xl p-3 border border-white/10 text-white flex flex-wrap items-center justify-between gap-3 text-xs pointer-events-auto">
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
            <h3 className="font-headline-sm text-on-surface font-bold text-[16px] m-0">{mrvData?.title || 'Q3 2023 Periodic MRV Verification'}</h3>
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-on-surface-variant">Reporting Period:</span> <strong className="text-on-surface">{mrvData?.period || 'Jul 2023 - Sep 2023'}</strong></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Claimed Carbon:</span> <strong className="text-secondary font-mono-data">{mrvData?.carbonEstimate?.toLocaleString() || '12,450'} tCO2e</strong></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Project Area:</span> <strong className="text-on-surface font-mono-data">{projectData?.areaHa || 450} Hectares</strong></div>
            </div>
          </div>

          {/* Measurement Plots */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 m-0">
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 m-0">
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
