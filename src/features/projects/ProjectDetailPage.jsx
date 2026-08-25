import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getProjectById, getProjects, fetchProjectById } from './projectsService';
import { getProjectSpatialDetails } from '../governance/adapters/gisAdapter';
import { INITIAL_SENSORS } from '../../services/sensorService';
import { getDroneSurveys } from '../../services/droneService';
import StatusBadge from '../../components/common/StatusBadge';
import { formatNumber, formatCarbon, formatArea, formatDate } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [activeLayer, setActiveLayer] = useState('ALL'); // 'ALL' | 'BOUNDARY' | 'PLOTS' | 'SENSORS'

  // Fetch project or fallback to matching project in cache
  const allProjects = getProjects();
  const [project, setProject] = useState(() => getProjectById(id) || allProjects.find((p) => p.id === id) || allProjects[0]);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Sync project when route id changes or when live data loads
  useEffect(() => {
    let isMounted = true;
    const current = getProjectById(id) || allProjects.find((p) => p.id === id);
    if (current) {
      setProject(current);
    }
    fetchProjectById(id).then((data) => {
      if (isMounted && data) {
        setProject(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const lat = project?.coordinates?.lat ?? project?.latitude;
  const lng = project?.coordinates?.lng ?? project?.longitude;
  const hasValidCoords = lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng));

  // Initialize interactive Leaflet map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (!hasValidCoords) return;

    const numLat = Number(lat);
    const numLng = Number(lng);

    const map = L.map(mapContainerRef.current, {
      center: [numLat, numLng],
      zoom: 13,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // CartoDB Voyager basemap
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
    }, 150);

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
  }, [project?.id, hasValidCoords, lat, lng]);

  // Update dynamic layers (Boundary, Plots, Sensors) on project / layer change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !hasValidCoords) return;

    layerGroup.clearLayers();

    const numLat = Number(lat);
    const numLng = Number(lng);

    // 1. Determine Project Boundary Polygon
    const droneSurveys = getDroneSurveys(project.id) || [];
    let boundaryCoords = null;

    if (droneSurveys.length > 0 && droneSurveys[0].geojson_data?.features?.[0]?.geometry?.coordinates) {
      const rawCoords = droneSurveys[0].geojson_data.features[0].geometry.coordinates[0];
      boundaryCoords = rawCoords.map(([gLng, gLat]) => [gLat, gLng]);
    }

    if (!boundaryCoords || boundaryCoords.length < 3) {
      const areaHa = Number(project.area) || 128;
      const scale = Math.sqrt(areaHa / 100) * 0.008;
      boundaryCoords = [
        [numLat + scale * 1.1, numLng - scale * 1.3],
        [numLat + scale * 1.3, numLng + scale * 0.9],
        [numLat - scale * 0.4, numLng + scale * 1.4],
        [numLat - scale * 1.2, numLng - scale * 0.3],
        [numLat - scale * 0.7, numLng - scale * 1.2],
      ];
    }

    if (activeLayer === 'ALL' || activeLayer === 'BOUNDARY') {
      const boundaryPolygon = L.polygon(boundaryCoords, {
        color: '#006a6a',
        weight: 2.5,
        dashArray: '5, 5',
        fillColor: '#006a6a',
        fillOpacity: 0.2,
      }).addTo(layerGroup);

      boundaryPolygon.bindTooltip(
        `<strong>${project.name}</strong><br/>Boundary Area: ${project.area} ha`,
        { sticky: true }
      );
    }

    // 2. Render Project-specific Plantation Plots
    if (activeLayer === 'ALL' || activeLayer === 'PLOTS') {
      const spatialDetails = getProjectSpatialDetails(project.id);
      const plots = spatialDetails?.mrvSubmissions?.[0]?.plots;

      if (plots && plots.length > 0) {
        plots.forEach((plot, idx) => {
          const pLat = plot.lat || numLat + (idx === 0 ? 0.003 : idx === 1 ? -0.004 : 0.005);
          const pLng = plot.lng || numLng + (idx === 0 ? 0.004 : idx === 1 ? -0.003 : 0.006);

          const plotIcon = L.divIcon({
            className: 'custom-mrv-plot-marker',
            html: `
              <div style="
                width: 22px;
                height: 22px;
                background: #1B6D24;
                color: #ffffff;
                font-weight: 800;
                font-size: 10px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                cursor: pointer;
              ">
                P${idx + 1}
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const pMarker = L.marker([pLat, pLng], { icon: plotIcon }).addTo(layerGroup);
          pMarker.bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
              <strong style="color: #1B6D24;">${plot.plotId || `Plot P${idx + 1}`}</strong><br/>
              ${plot.species ? `Species: <em>${plot.species}</em><br/>` : ''}
              ${plot.biomassDensity ? `Biomass: ${plot.biomassDensity}<br/>` : ''}
              ${plot.soilCarbon ? `Soil Carbon: ${plot.soilCarbon}` : ''}
            </div>
          `);
        });
      } else {
        const defaultPlots = [
          { id: 'P1', lat: numLat + 0.003, lng: numLng + 0.003, species: 'Avicennia marina' },
          { id: 'P2', lat: numLat - 0.003, lng: numLng - 0.002, species: 'Rhizophora mucronata' },
        ];
        defaultPlots.forEach((sp) => {
          const plotIcon = L.divIcon({
            className: 'custom-mrv-plot-marker',
            html: `
              <div style="
                width: 22px;
                height: 22px;
                background: #1B6D24;
                color: #ffffff;
                font-weight: 800;
                font-size: 10px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                cursor: pointer;
              ">
                ${sp.id}
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          const pMarker = L.marker([sp.lat, sp.lng], { icon: plotIcon }).addTo(layerGroup);
          pMarker.bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
              <strong style="color: #1B6D24;">Plot ${sp.id}</strong><br/>
              Species: <em>${sp.species}</em><br/>
              Status: Active Monitoring
            </div>
          `);
        });
      }
    }

    // 3. Render Project-specific Sensor Nodes
    if (activeLayer === 'ALL' || activeLayer === 'SENSORS') {
      const projectSensors = INITIAL_SENSORS.filter((s) => s.projectId === project.id);
      if (projectSensors.length > 0) {
        projectSensors.forEach((sensor, idx) => {
          const sLat = sensor.latitude;
          const sLng = sensor.longitude;
          const sensorIcon = L.divIcon({
            className: 'custom-sensor-node-pin',
            html: `
              <div style="
                width: 14px;
                height: 14px;
                background: #ba1a1a;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(186,26,26,0.8);
                cursor: pointer;
              "></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const sMarker = L.marker([sLat, sLng], { icon: sensorIcon }).addTo(layerGroup);
          sMarker.bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
              <strong style="color: #ba1a1a;">${sensor.name || `Sensor Node #${idx + 1}`}</strong><br/>
              ID: ${sensor.sensorId}<br/>
              Type: ${sensor.type}<br/>
              Status: <span style="color: #16a34a; font-weight: bold;">${sensor.status}</span> (Battery: ${sensor.battery}%)
            </div>
          `);
        });
      } else {
        const defaultSensors = [
          { name: 'Tidal Hydrology Node', lat: numLat + 0.002, lng: numLng - 0.003, type: 'Hydrology Probe' },
          { name: 'Sediment Salinity Array', lat: numLat - 0.002, lng: numLng + 0.004, type: 'Salinity Probe' },
        ];
        defaultSensors.forEach((ds) => {
          const sensorIcon = L.divIcon({
            className: 'custom-sensor-node-pin',
            html: `
              <div style="
                width: 14px;
                height: 14px;
                background: #ba1a1a;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(186,26,26,0.8);
                cursor: pointer;
              "></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const sMarker = L.marker([ds.lat, ds.lng], { icon: sensorIcon }).addTo(layerGroup);
          sMarker.bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
              <strong style="color: #ba1a1a;">${ds.name}</strong><br/>
              Type: ${ds.type}<br/>
              Status: <span style="color: #16a34a; font-weight: bold;">ACTIVE</span>
            </div>
          `);
        });
      }
    }

    // Fit map bounds to boundary polygon
    if (boundaryCoords && boundaryCoords.length > 0) {
      const bounds = L.latLngBounds(boundaryCoords);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }
  }, [project, hasValidCoords, lat, lng, activeLayer]);

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: 'info' },
    { id: 'MRV Evidence', label: 'MRV Evidence', icon: 'verified_user' },
    { id: 'Drone Data', label: 'Drone Data', icon: 'sensors' },
    { id: 'Carbon', label: 'Carbon', icon: 'eco' },
    { id: 'Blockchain', label: 'Blockchain', icon: 'link' },
    { id: 'Audit Trail', label: 'Audit Trail', icon: 'history_edu' },
  ];

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">
          search_off
        </span>
        <h2 className="font-headline-md text-on-surface mb-2">Project Not Found</h2>
        <p className="font-body-md text-on-surface-variant mb-6">
          The requested project could not be found in the registry.
        </p>
        <Link
          to={ROUTES.ADMIN_PROJECTS || '/admin/projects'}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-title-md"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface">
      {/* Breadcrumb / Back Link */}
      <div className="flex items-center gap-2 text-xs font-mono-data text-on-surface-variant">
        <Link
          to={ROUTES.ADMIN_PROJECTS || '/admin/projects'}
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>PROJECTS</span>
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold truncate">{project.id}</span>
      </div>

      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-on-surface-variant font-mono-data text-xs">
            <span className="bg-surface-container px-2.5 py-1 rounded-md text-primary font-semibold">
              PROJECT ID: {project.id}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant hidden sm:inline-block"></span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">corporate_fare</span>
              {project.organization}
            </span>
          </div>

          <div>
            <h1 className="font-headline-lg text-primary tracking-tight">
              {project.name}{' '}
              <span className="font-light text-on-surface-variant text-headline-md block sm:inline">
                – {project.type}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-body-md text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                {project.location}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <StatusBadge status={project.status} />
              {project.verificationDate && (
                <>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span className="text-xs font-mono-data text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Verified on {formatDate(project.verificationDate)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={ROUTES.ORG_CREATE_PROJECT || '/organization/projects/new'}
            className="px-4 py-2 rounded-xl border border-primary text-primary font-title-md hover:bg-primary/5 transition-colors text-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Project
          </Link>
          <button
            onClick={() => alert(`Downloading registry dossier for ${project.id}...`)}
            className="px-4 py-2 rounded-xl border border-primary text-primary font-title-md hover:bg-primary/5 transition-colors text-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download Report
          </button>
          <button
            onClick={() => setShowBlockchainModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-title-md hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5 text-sm"
          >
            <span>View Blockchain Record</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Restoration Area */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-t-4 border-t-primary-container border-x border-b border-outline-variant/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Restoration Area</div>
          <div className="font-headline-md text-on-surface">
            {formatNumber(project.area)}{' '}
            <span className="text-body-md text-on-surface-variant font-normal">ha</span>
          </div>
        </div>

        {/* Plants Recorded */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-t-4 border-t-secondary border-x border-b border-outline-variant/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Plants Recorded</div>
          <div className="font-headline-md text-on-surface">
            {formatNumber(Math.round(project.area * 1440))}
          </div>
        </div>

        {/* Survival Rate */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-t-4 border-t-tertiary-container border-x border-b border-outline-variant/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Survival Rate</div>
          <div className="font-headline-md text-on-surface">
            91.6<span className="text-title-md text-on-surface-variant font-normal">%</span>
          </div>
        </div>

        {/* Est. CO2e */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-t-4 border-t-outline border-x border-b border-outline-variant/30 relative overflow-hidden group">
          <div className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Est. CO2e</div>
          <div className="font-headline-md text-on-surface">
            {formatNumber(project.estCO2e)}{' '}
            <span className="text-body-md text-on-surface-variant font-normal">t</span>
          </div>
        </div>

        {/* Verified CO2e */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-t-4 border-t-secondary border-x border-b border-outline-variant/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Verified CO2e</div>
          <div className="font-headline-md text-secondary">
            {project.status === 'Verified' ? formatNumber(project.estCO2e) : '0'}{' '}
            <span className="text-body-md text-secondary/70 font-normal">t</span>
          </div>
        </div>

        {/* Carbon Credits */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-t-4 border-t-primary border-x border-b border-outline-variant/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="text-label-md text-primary uppercase tracking-wider mb-1 font-bold">Carbon Credits</div>
          <div className="font-headline-md text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[22px]">token</span>
            {formatNumber(project.totalCredits || (project.status === 'Verified' ? project.estCO2e : 0))}
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid (12 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* Left Column: Map & Tabs (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* GIS Map Container */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden relative h-[380px] sm:h-[420px] flex flex-col">
            {/* Map Visual Background Canvas */}
            <div className="w-full h-full relative bg-[#0b1c30] overflow-hidden flex items-center justify-center">
              {hasValidCoords ? (
                <div ref={mapContainerRef} className="w-full h-full z-10" />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white/60 z-10 space-y-2 font-mono-data text-xs">
                  <span className="material-symbols-outlined text-[36px] text-white/40">location_off</span>
                  <p>No registered coordinates or spatial boundary for {project.id}</p>
                </div>
              )}

              {/* Center Map Location & Coordinate Badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] text-center pointer-events-none p-2 max-w-[90%]">
                <span className="font-mono-data text-xs text-primary-fixed uppercase tracking-widest bg-primary/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary-fixed/20 shadow-md inline-block truncate max-w-full">
                  {project.location} • Lat: {hasValidCoords ? Number(lat).toFixed(4) : 'N/A'}°N, Lng: {hasValidCoords ? Number(lng).toFixed(4) : 'N/A'}°E
                </span>
              </div>
            </div>

            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg shadow-md border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg shadow-md border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-[20px]">remove</span>
              </button>
              <button
                onClick={() => {
                  setActiveLayer((prev) => {
                    if (prev === 'ALL') return 'BOUNDARY';
                    if (prev === 'BOUNDARY') return 'PLOTS';
                    if (prev === 'PLOTS') return 'SENSORS';
                    return 'ALL';
                  });
                }}
                className={`w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg shadow-md border border-outline-variant/30 flex items-center justify-center transition-colors cursor-pointer ${
                  activeLayer !== 'ALL' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface hover:text-primary'
                }`}
                title={`Filter Map Layers (Current: ${activeLayer})`}
              >
                <span className="material-symbols-outlined text-[20px]">layers</span>
              </button>
            </div>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-xl shadow-md border border-outline-variant/30 text-xs font-mono-data z-[400]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded bg-primary border border-primary-container"></div>
                <span>Project Boundary</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded bg-secondary border border-secondary-container"></div>
                <span>Plantation Plots ({formatArea(project.area)})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-error border border-error-container"></div>
                <span>Sensor Nodes (Active)</span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-outline-variant/30 overflow-x-auto">
            <nav className="-mb-px flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap pb-3 px-1 font-title-md text-sm border-b-2 flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Panels */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-title-lg text-primary mb-2">Project Description</h2>
                  <p className="text-body-lg text-on-surface-variant leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-outline-variant/20 pt-6">
                  <div className="p-3.5 rounded-xl bg-surface-container-low/40">
                    <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-1 text-xs">
                      Target Ecosystem
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[20px]">
                        water
                      </span>
                      <span className="font-title-md text-on-surface text-sm">
                        Coastal Intertidal & Estuaries
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-low/40">
                    <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-1 text-xs">
                      Primary Native Species
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        park
                      </span>
                      <span className="font-title-md text-on-surface text-sm italic">
                        Avicennia marina, Rhizophora mucronata
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-low/40">
                    <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-1 text-xs">
                      Managed Plantation Plots
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-container text-[20px]">
                        format_list_numbered
                      </span>
                      <span className="font-title-md text-on-surface text-sm">
                        12 Monitored Planting Zones
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-low/40">
                    <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-1 text-xs">
                      Community Stakeholders
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-surface text-[20px]">
                        groups
                      </span>
                      <span className="font-title-md text-on-surface text-sm">
                        Local Gram Panchayat & Coastal Self-Help Groups
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'MRV Evidence' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-title-lg text-primary">MRV Evidence Submissions</h3>
                  <span className="text-xs font-mono-data bg-surface-container px-2.5 py-1 rounded-md text-on-surface-variant">
                    Methodology: Verra VM0033
                  </span>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  <div className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[28px]">
                        satellite_alt
                      </span>
                      <div>
                        <div className="font-title-md text-sm text-on-surface">
                          Sentinel-2 Multispectral Baseline
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          Resolved at 10m/px • Validated 2023-09-15
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono-data text-secondary bg-[#e8f5e9] px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[28px]">
                        flight_takeoff
                      </span>
                      <div>
                        <div className="font-title-md text-sm text-on-surface">
                          Drone RGB & Multispectral Canopy Survey
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          0.5m/px resolution orthomosaic • 420 hectares mapped
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono-data text-secondary bg-[#e8f5e9] px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary-container text-[28px]">
                        science
                      </span>
                      <div>
                        <div className="font-title-md text-sm text-on-surface">
                          Soil Organic Carbon (SOC) Core Sample Logs
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          32 sample points depth 100cm • Lab verified by NCCR
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono-data text-secondary bg-[#e8f5e9] px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Drone Data' && (
              <div className="space-y-4">
                <h3 className="font-title-lg text-primary">Drone & Sensor Telemetry</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <div className="text-xs font-label-md text-on-surface-variant uppercase">
                      Mean NDVI Index
                    </div>
                    <div className="font-headline-md text-secondary mt-1">0.782</div>
                    <div className="text-xs text-on-surface-variant mt-1">Healthy dense canopy</div>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <div className="text-xs font-label-md text-on-surface-variant uppercase">
                      Mean Canopy Height
                    </div>
                    <div className="font-headline-md text-primary mt-1">4.2 m</div>
                    <div className="text-xs text-on-surface-variant mt-1">+0.6m annual growth</div>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <div className="text-xs font-label-md text-on-surface-variant uppercase">
                      Stem Density
                    </div>
                    <div className="font-headline-md text-on-surface mt-1">1,440 /ha</div>
                    <div className="text-xs text-on-surface-variant mt-1">Target: 1,500 /ha</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Carbon' && (
              <div className="space-y-4">
                <h3 className="font-title-lg text-primary">Carbon Accounting Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-label-md text-on-surface-variant">
                        <th className="py-2">Pool</th>
                        <th className="py-2">Baseline (tCO2e)</th>
                        <th className="py-2">Projected (tCO2e)</th>
                        <th className="py-2 text-right">Net Sequestration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-mono-data">
                      <tr>
                        <td className="py-2.5 font-sans font-medium">Aboveground Biomass</td>
                        <td className="py-2.5">1,200</td>
                        <td className="py-2.5">7,400</td>
                        <td className="py-2.5 text-right text-secondary">+6,200 tCO2e</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-sans font-medium">Belowground Biomass</td>
                        <td className="py-2.5">800</td>
                        <td className="py-2.5">3,600</td>
                        <td className="py-2.5 text-right text-secondary">+2,800 tCO2e</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-sans font-medium">Soil Organic Carbon</td>
                        <td className="py-2.5">2,400</td>
                        <td className="py-2.5">7,600</td>
                        <td className="py-2.5 text-right text-secondary">+5,200 tCO2e</td>
                      </tr>
                      <tr className="font-bold text-primary">
                        <td className="py-2.5 font-sans">Total Net Carbon</td>
                        <td className="py-2.5">4,400</td>
                        <td className="py-2.5">18,600</td>
                        <td className="py-2.5 text-right font-sans">{formatCarbon(project.estCO2e)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Blockchain' && (
              <div className="space-y-4 font-mono-data text-xs">
                <h3 className="font-title-lg text-primary font-sans">On-Chain Smart Contract Records</h3>
                <div className="p-4 bg-surface rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Registry Contract:</span>
                    <span className="text-primary font-bold">0x4F9B73d2Ac987E12D45b882Ef8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Token Standard:</span>
                    <span>ERC-1155 (Marine Carbon Units)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Network:</span>
                    <span>Polygon PoS (Chain ID: 137)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">IPFS Verification CID:</span>
                    <span className="truncate max-w-[200px]">QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Audit Trail' && (
              <div className="space-y-4">
                <h3 className="font-title-lg text-primary">Audit & Verification Log</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-outline-variant/20">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">
                      check_circle
                    </span>
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-on-surface">MRV Dossier Approved</div>
                      <div className="text-xs text-on-surface-variant">
                        By NCCR Lead Auditor • 2023-10-12 14:32 IST
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                      upload_file
                    </span>
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-on-surface">Annual Drone Telemetry Uploaded</div>
                      <div className="text-xs text-on-surface-variant">
                        By {project.teamLead || 'Field Team'} • 2023-09-28 10:15 IST
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Vital Stats & Timeline (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Vital Stats Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="bg-surface-container p-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-title-md text-primary">Project Vital Stats</h2>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
            </div>
            <table className="w-full text-left border-collapse">
              <tbody className="font-body-md text-sm">
                <tr className="border-b border-outline-variant/20 hover:bg-primary/5 transition-colors">
                  <th className="py-3 px-4 text-on-surface-variant font-normal w-1/2">Start Date</th>
                  <td className="py-3 px-4 text-on-surface font-mono-data font-medium">
                    {project.startDate || '2023-01-15'}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/20 hover:bg-primary/5 transition-colors">
                  <th className="py-3 px-4 text-on-surface-variant font-normal w-1/2">Methodology</th>
                  <td className="py-3 px-4 text-on-surface font-mono-data font-medium">VM0033 (VCS)</td>
                </tr>
                <tr className="border-b border-outline-variant/20 hover:bg-primary/5 transition-colors">
                  <th className="py-3 px-4 text-on-surface-variant font-normal w-1/2">Crediting Period</th>
                  <td className="py-3 px-4 text-on-surface font-mono-data font-medium">
                    {project.startDate ? `${project.startDate.substring(0, 4)}–${project.endDate ? project.endDate.substring(0, 4) : '2028'}` : '2023–2028'}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/20 hover:bg-primary/5 transition-colors">
                  <th className="py-3 px-4 text-on-surface-variant font-normal w-1/2">Verification Date</th>
                  <td className="py-3 px-4 text-on-surface font-mono-data font-medium">
                    {project.verificationDate ? formatDate(project.verificationDate) : 'Pending'}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/20 hover:bg-primary/5 transition-colors">
                  <th className="py-3 px-4 text-on-surface-variant font-normal w-1/2">Project Lead</th>
                  <td className="py-3 px-4 text-on-surface font-medium">
                    {project.teamLead || 'Priya Sharma'}
                  </td>
                </tr>
                <tr className="hover:bg-primary/5 transition-colors">
                  <th className="py-3 px-4 text-on-surface-variant font-normal w-1/2">Next Audit Due</th>
                  <td className="py-3 px-4 text-error font-mono-data font-medium">2026-11-02</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mini Blockchain Status Card */}
          <div className="bg-primary p-5 rounded-2xl shadow-md text-on-primary relative overflow-hidden">
            <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
              <svg fill="currentColor" height="130" viewBox="0 0 24 24" width="130">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
                <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim">link</span>
                <h3 className="font-title-md text-white">Blockchain Status</h3>
              </div>
              <div className="space-y-2.5 font-mono-data text-xs">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white/70">Network</span>
                  <span className="font-medium text-white">Polygon PoS</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white/70">Contract</span>
                  <span className="truncate w-28 text-right text-tertiary-fixed">0x4F9...b2E</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-white/70">Minted Credits</span>
                  <span className="font-bold text-secondary-fixed">
                    {formatNumber(project.totalCredits || (project.status === 'Verified' ? project.estCO2e : 0))} vMRV
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBlockchainModal(true)}
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-title-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Verify Proof on Explorer</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Modal */}
      {showBlockchainModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-xl border border-outline-variant/30 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <h3 className="font-title-lg text-primary">On-Chain Verification Record</h3>
              </div>
              <button
                onClick={() => setShowBlockchainModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 font-mono-data text-xs">
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/30 space-y-1.5">
                <div className="text-on-surface-variant uppercase text-[10px] tracking-wider">Transaction Hash</div>
                <div className="text-primary font-bold break-all">
                  0x8f23b1c4e97a2d3489fe01c79a528e4691bc2d4e8712ab9901ef6c7812903abc
                </div>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-outline-variant/30 space-y-1.5">
                <div className="text-on-surface-variant uppercase text-[10px] tracking-wider">Block Number</div>
                <div className="text-on-surface font-bold">#49,281,904 (Polygon PoS)</div>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-outline-variant/30 space-y-1.5">
                <div className="text-on-surface-variant uppercase text-[10px] tracking-wider">Metadata IPFS Hash</div>
                <div className="text-secondary font-bold break-all">
                  ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBlockchainModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-title-md text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
