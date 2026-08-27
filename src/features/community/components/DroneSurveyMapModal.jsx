import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';

export default function DroneSurveyMapModal({ survey, isOpen, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const imageOverlayRef = useRef(null);

  const [activeLayerMode, setActiveLayerMode] = useState('VECTOR'); // 'VECTOR', 'ORTHO', 'NDVI'
  const [overlayError, setOverlayError] = useState(null);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!isOpen || !survey || !mapContainerRef.current) return;

    // Reset overlay error state
    setOverlayError(null);

    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center / fallback
    const defaultCenter = [16.9905, 73.3125];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 16,
      minZoom: 5,
      maxZoom: 20,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Base Tile Layer: CartoDB Voyager
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    // Parse GeoJSON Data safely
    let geojson = survey.geojson_data;
    if (typeof geojson === 'string') {
      try {
        geojson = JSON.parse(geojson);
      } catch (err) {
        console.error('Failed to parse survey geojson_data:', err);
        geojson = null;
      }
    }

    let calculatedBounds = null;

    if (geojson && (geojson.type === 'FeatureCollection' || geojson.type === 'Feature' || geojson.type === 'Polygon')) {
      const isRestoration = survey.stage === 'AFTER' || survey.stage === 'RESTORATION_MONITORING';
      const strokeColor = isRestoration ? '#16a34a' : '#0284c7';
      const fillColor = isRestoration ? '#22c55e' : '#38bdf8';

      const geoLayer = L.geoJSON(geojson, {
        style: {
          color: strokeColor,
          weight: 3,
          opacity: 0.95,
          fillColor: fillColor,
          fillOpacity: 0.25,
          dashArray: isRestoration ? null : '6, 6',
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          const popupHtml = `
            <div style="font-family: inherit; padding: 4px; min-width: 180px;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #0f172a;">
                ${props.name || survey.survey_code}
              </div>
              <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 2px;">
                <div><strong>Stage:</strong> ${survey.stage || 'N/A'}</div>
                <div><strong>Canopy Cover:</strong> ${survey.canopy_cover_percent || props.canopyCover || 'N/A'}%</div>
                <div><strong>NDVI Mean:</strong> ${survey.health_ndvi_mean || props.ndviMean || 'N/A'}</div>
                <div><strong>Date:</strong> ${survey.survey_date || props.surveyDate || 'N/A'}</div>
              </div>
            </div>
          `;
          layer.bindPopup(popupHtml, { maxWidth: 260 });
        },
      }).addTo(map);

      geojsonLayerRef.current = geoLayer;

      try {
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          calculatedBounds = bounds;
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
        }
      } catch (err) {
        console.warn('Error fitting bounds to geojson layer:', err);
      }
    }

    // Default bounds if not derived from geojson
    if (!calculatedBounds) {
      calculatedBounds = L.latLngBounds([16.9880, 73.3100], [16.9930, 73.3150]);
      map.fitBounds(calculatedBounds, { padding: [40, 40] });
    }

    // Render bounded image overlay if active
    if (activeLayerMode !== 'VECTOR') {
      const imageUrl = activeLayerMode === 'ORTHO' ? survey.orthomosaic_url : survey.ndvi_map_url;
      if (imageUrl && calculatedBounds) {
        try {
          const overlay = L.imageOverlay(imageUrl, calculatedBounds, {
            opacity: 0.85,
            interactive: false,
          }).addTo(map);
          imageOverlayRef.current = overlay;
        } catch (err) {
          console.warn('Could not initialize raster overlay:', err);
          setOverlayError('Raster overlay could not be rendered over this bounding box.');
        }
      } else {
        setOverlayError(`No ${activeLayerMode === 'ORTHO' ? 'orthomosaic' : 'NDVI'} raster available for this survey.`);
      }
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, survey, activeLayerMode]);

  if (!isOpen || !survey) return null;

  const hasOrtho = Boolean(survey.orthomosaic_url);
  const hasNdvi = Boolean(survey.ndvi_map_url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drone-map-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">flight</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="drone-map-title" className="font-headline-sm font-bold text-on-surface text-base sm:text-lg">
                  {survey.survey_code}
                </h3>
                <StatusBadge status={survey.stage || 'Verified'} />
              </div>
              <p className="text-xs text-on-surface-variant font-mono-data">
                Survey Date: {survey.survey_date} • {survey.survey_type || 'UAV Photogrammetry'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Layer Mode Switcher */}
            <div className="hidden sm:flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/40 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveLayerMode('VECTOR')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeLayerMode === 'VECTOR'
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                Polygon Boundary
              </button>
              {hasOrtho && (
                <button
                  type="button"
                  onClick={() => setActiveLayerMode('ORTHO')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeLayerMode === 'ORTHO'
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Orthomosaic
                </button>
              )}
              {hasNdvi && (
                <button
                  type="button"
                  onClick={() => setActiveLayerMode('NDVI')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeLayerMode === 'NDVI'
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  NDVI Map
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant/30"
              aria-label="Close survey map"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Layer Mode Selector for Mobile */}
        <div className="sm:hidden flex items-center justify-around bg-surface-container-low px-3 py-2 border-b border-outline-variant/30 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveLayerMode('VECTOR')}
            className={`px-2.5 py-1 rounded-lg ${activeLayerMode === 'VECTOR' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
          >
            Polygon
          </button>
          {hasOrtho && (
            <button
              type="button"
              onClick={() => setActiveLayerMode('ORTHO')}
              className={`px-2.5 py-1 rounded-lg ${activeLayerMode === 'ORTHO' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
            >
              Orthomosaic
            </button>
          )}
          {hasNdvi && (
            <button
              type="button"
              onClick={() => setActiveLayerMode('NDVI')}
              className={`px-2.5 py-1 rounded-lg ${activeLayerMode === 'NDVI' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
            >
              NDVI Map
            </button>
          )}
        </div>

        {overlayError && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>{overlayError} Falling back to vector boundary.</span>
          </div>
        )}

        {/* Map Canvas Area */}
        <div className="relative w-full h-[380px] sm:h-[480px] bg-slate-900 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Map Legend Overlay */}
          <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-md rounded-xl p-2.5 border border-outline-variant/40 shadow-md text-xs text-on-surface z-[400] pointer-events-auto">
            <div className="font-bold flex items-center gap-1.5 mb-1.5 text-on-surface">
              <span className={`w-2.5 h-2.5 rounded-full ${survey.stage === 'AFTER' ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
              <span>{survey.stage === 'AFTER' ? 'Restoration Canopy (3-Yr)' : 'Baseline Pre-Restoration'}</span>
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono-data">
              GSD: {survey.resolution_cm_per_pixel || 2.5} cm/px • Alt: {survey.flight_altitude_m || 60}m
            </div>
          </div>
        </div>

        {/* Modal Footer Metadata Bar */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Surveyed Area</span>
            <span className="font-mono-data font-bold text-sm text-on-surface">{survey.survey_area_hectares} ha</span>
          </div>
          <div>
            <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Canopy Cover</span>
            <span className="font-mono-data font-bold text-sm text-secondary">{survey.canopy_cover_percent}%</span>
          </div>
          <div>
            <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Mean NDVI</span>
            <span className="font-mono-data font-bold text-sm text-on-surface">{survey.health_ndvi_mean?.toFixed(3) || 'N/A'}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block uppercase text-[10px] font-bold">Estimated Trees</span>
            <span className="font-mono-data font-bold text-sm text-on-surface">{survey.estimated_tree_count?.toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
