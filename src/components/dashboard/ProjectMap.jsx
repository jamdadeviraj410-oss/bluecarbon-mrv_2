import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ROUTES } from '../../utils/constants';
import { getProjects, fetchProjects } from '../../features/projects/projectsService';

export default function ProjectMap() {
  const [projectsList, setProjectsList] = useState(() => getProjects());
  const [activeSite, setActiveSite] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Eagerly fetch latest live projects
  useEffect(() => {
    let isMounted = true;
    fetchProjects().then((data) => {
      if (isMounted && data && data.length > 0) {
        setProjectsList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize & update Leaflet interactive map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if container re-rendered
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [19.5, 79.5],
      zoom: 4.8,
      minZoom: 4,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // CartoDB Voyager Tiles (Clean maritime & topography styling)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Marker bounds tracker
    const validMarkers = [];

    projectsList.forEach((project) => {
      const lat = project.coordinates?.lat || project.latitude;
      const lng = project.coordinates?.lng || project.longitude;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const normStatus = (project.status || project.dbStatus || 'Pending').toLowerCase();
      let color = '#f59e0b'; // Pending
      let statusLabel = 'Pending';
      let badgeClass = 'background:#fef3c7;color:#b45309;';

      if (normStatus.includes('verif') || normStatus === 'active') {
        color = '#16a34a'; // Verified
        statusLabel = 'Verified';
        badgeClass = 'background:#dcfce7;color:#15803d;';
      } else if (normStatus.includes('review')) {
        color = '#006a6a'; // Under Review
        statusLabel = 'Under Review';
        badgeClass = 'background:#ccfbf1;color:#0f766e;';
      } else if (normStatus.includes('reject')) {
        color = '#dc2626';
        statusLabel = 'Rejected';
        badgeClass = 'background:#fee2e2;color:#b91c1c;';
      }

      // Custom SVG Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-project-pin',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            background-color: ${color};
            border: 2.5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      validMarkers.push([lat, lng]);

      const areaText = project.area ? `${project.area} ha` : 'N/A';
      const carbonText = project.estCO2e || project.est_co2e ? `${Number(project.estCO2e || project.est_co2e).toLocaleString()} tCO2e` : '';

      const popupContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; min-width: 200px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; font-family: monospace; color: #64748b;">${project.id || project.project_code}</span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; ${badgeClass}">${statusLabel}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${project.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">${project.location || project.state || 'India'}</p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px; color: #334155; display:flex; flex-direction:column; gap: 2px;">
            <div><strong>Ecosystem:</strong> ${project.type || 'Mangrove'}</div>
            <div><strong>Restoration Area:</strong> ${areaText}</div>
            ${carbonText ? `<div><strong>Estimated Yield:</strong> ${carbonText}</div>` : ''}
          </div>
          <a href="/projects/${project.id || project.project_code}" style="display:inline-block; margin-top: 8px; font-size: 11px; font-weight: 700; color: #006a6a; text-decoration: none;">
            View Project Details &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-leaflet-popup',
      });

      marker.on('mouseover', () => {
        setActiveSite({
          name: project.name,
          lat: Number(lat).toFixed(4),
          lng: Number(lng).toFixed(4),
        });
      });

      marker.on('mouseout', () => {
        setActiveSite(null);
      });
    });

    // Invalidate size to ensure complete canvas tile rendering
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

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [projectsList]);

  return (
    <div className="lg:col-span-8 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col overflow-hidden">
      {/* Card Header (Preserved Exactly) */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest border-b border-outline-variant/30">
        <div>
          <h2 className="font-headline-sm text-on-surface text-[18px] font-bold m-0">National Coastal Project Distribution</h2>
          <p className="text-xs text-on-surface-variant m-0">Live spatial status across India's maritime mangrove & seagrass ecosystems</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-3 text-xs font-bold text-on-surface-variant">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>Verified</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Pending</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span>Under Review</div>
          </div>
          <Link
            to={ROUTES.ADMIN_NATIONAL_MAP}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_full</span>
            National Explorer
          </Link>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-[460px] overflow-hidden bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Map Footer Bar (Preserved Exactly) */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-white flex items-center justify-between text-xs z-[400] pointer-events-auto">
          <div className="flex items-center gap-2 font-mono-data">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            {activeSite ? `${activeSite.name} (${activeSite.lat}° N, ${activeSite.lng}° E)` : `${projectsList.length} Coastal Restoration Sites Monitored`}
          </div>
          <Link
            to={ROUTES.ADMIN_NATIONAL_MAP}
            className="text-tertiary-fixed font-bold hover:underline flex items-center gap-1"
          >
            Drilldown to Plots
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
