import { useState } from 'react';
import {
  getBeforeAfterComparison,
  DroneMapOverlayAdapter,
} from '../../services/droneService';

export default function DroneBeforeAfterView() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side' | 'gis-contract'
  const [layerType, setLayerType] = useState('ortho'); // 'ortho' | 'ndvi'
  const [notification, setNotification] = useState(null);

  const comparisonData = getBeforeAfterComparison();
  const { before, after, comparison } = comparisonData;

  const beforeImage = layerType === 'ortho' ? before.orthomosaic_url : before.ndvi_map_url;
  const afterImage = layerType === 'ortho' ? after.orthomosaic_url : after.ndvi_map_url;

  const handleExportGeoJson = () => {
    const geoJsonStr = DroneMapOverlayAdapter.exportGeoJsonString(after.id);
    const blob = new Blob([geoJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${after.survey_code}_boundary.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({
      type: 'success',
      message: `Exported GeoJSON for ${after.survey_code} (Ready for QGIS / MapLibre).`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleExportKml = () => {
    const kmlStr = DroneMapOverlayAdapter.exportKmlString(after.id);
    const blob = new Blob([kmlStr], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${after.survey_code}_overlay.kml`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({
      type: 'success',
      message: `Exported KML for ${after.survey_code} (Ready for Google Earth / GIS).`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-emerald-950 text-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-300 text-[24px]">flight_takeoff</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm tracking-wide">UAV Photogrammetry & Temporal Delta Analysis</h3>
              <span className="bg-emerald-400 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">
                SAMPLE RESTORATION DATASET
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              High-resolution 2.2 cm/pixel orthomosaics & NDVI reflectance index tracking 3-year mangrove canopy growth.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportGeoJson}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Export GeoJSON
          </button>
          <button
            onClick={handleExportKml}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">public</span>
            Export KML
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl text-sm flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Delta Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <span className="text-[11px] text-on-surface-variant block font-medium">Canopy Cover Delta</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            +{comparison.canopyCoverDeltaPercent}%
          </div>
          <span className="text-[10px] text-on-surface-variant">
            {comparison.canopyCoverBefore}% → {comparison.canopyCoverAfter}%
          </span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <span className="text-[11px] text-on-surface-variant block font-medium">Mean NDVI Reflectance</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            +{comparison.ndviDelta}
          </div>
          <span className="text-[10px] text-on-surface-variant">
            {comparison.ndviBefore} → {comparison.ndviAfter}
          </span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <span className="text-[11px] text-on-surface-variant block font-medium">Net Mangrove Stems</span>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            +{(comparison.netTreeIncrease).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">
            92.4% Survival Rate
          </span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <span className="text-[11px] text-on-surface-variant block font-medium">Biomass Increase</span>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            +{(comparison.netBiomassGainEstimateTons).toLocaleString()} t
          </div>
          <span className="text-[10px] text-on-surface-variant">Above & Below Ground</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm col-span-2 md:col-span-1">
          <span className="text-[11px] text-on-surface-variant block font-medium">Estimated Sequestration</span>
          <div className="text-2xl font-bold font-mono text-secondary mt-1">
            {(comparison.netEstimatedCO2e).toLocaleString()}
          </div>
          <span className="text-[10px] font-bold text-secondary">tCO2e (3-Yr Certified)</span>
        </div>
      </div>

      {/* Main Interactive Comparison View */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="bg-surface-container-low px-6 py-3 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                viewMode === 'slider'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">compare</span>
              Interactive Curtain Slider
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                viewMode === 'side-by-side'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_column</span>
              Side-by-Side Dual View
            </button>
            <button
              onClick={() => setViewMode('gis-contract')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                viewMode === 'gis-contract'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">integration_instructions</span>
              Member 1 GIS Integration
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Layer:</span>
            <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant">
              <button
                onClick={() => setLayerType('ortho')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  layerType === 'ortho' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                RGB Orthomosaic
              </button>
              <button
                onClick={() => setLayerType('ndvi')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  layerType === 'ndvi' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                NDVI False-Color
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Content */}
        <div className="p-6">
          {viewMode === 'slider' && (
            <div className="space-y-4">
              <div className="relative w-full h-[450px] rounded-xl overflow-hidden select-none border border-outline-variant shadow-inner bg-gray-950">
                {/* AFTER image (Underneath) */}
                <img
                  src={afterImage}
                  alt="After Restoration"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Restoration 2026 (78.6% Canopy)
                </div>

                {/* BEFORE image (Clipped overlay) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-2xl"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={beforeImage}
                    alt="Baseline 2023"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: '100%', minWidth: '100%', height: '100%' }}
                  />
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Baseline 2023 (14.2% Canopy)
                  </div>
                </div>

                {/* Draggable Curtain Slider Handle */}
                <div
                  className="absolute inset-y-0 flex items-center justify-center cursor-ew-resize z-20"
                  style={{ left: `calc(${sliderPosition}% - 18px)` }}
                >
                  <div className="w-9 h-9 rounded-full bg-white text-primary shadow-2xl flex items-center justify-center border-2 border-primary">
                    <span className="material-symbols-outlined text-[18px]">drag_handle</span>
                  </div>
                </div>
              </div>

              {/* Slider Scrub Control */}
              <div className="flex items-center gap-4 px-2">
                <span className="text-xs font-bold text-amber-900">Baseline (2023)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="flex-1 accent-primary cursor-pointer h-2 bg-surface-container rounded-lg"
                />
                <span className="text-xs font-bold text-emerald-900">Restored (2026)</span>
              </div>
            </div>
          )}

          {viewMode === 'side-by-side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baseline 2023 */}
              <div className="space-y-2">
                <div className="relative h-[360px] rounded-xl overflow-hidden border border-outline-variant shadow-sm bg-gray-900">
                  <img src={beforeImage} alt="Baseline" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/30">
                    Baseline Pre-Restoration (10 Feb 2023)
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Canopy Density:</span>
                    <span className="font-bold text-on-surface">14.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Reflectance NDVI:</span>
                    <span className="font-mono font-bold text-on-surface">0.284</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Sensor:</span>
                    <span className="text-on-surface">{before.metadata?.sensor}</span>
                  </div>
                </div>
              </div>

              {/* Restored 2026 */}
              <div className="space-y-2">
                <div className="relative h-[360px] rounded-xl overflow-hidden border border-outline-variant shadow-sm bg-gray-900">
                  <img src={afterImage} alt="Restored" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    Post-Restoration Verified (12 Aug 2026)
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Canopy Density:</span>
                    <span className="font-bold text-emerald-700">78.6% (+64.4%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Reflectance NDVI:</span>
                    <span className="font-mono font-bold text-emerald-700">0.742 (+0.458)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Sensor:</span>
                    <span className="text-on-surface">{after.metadata?.sensor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'gis-contract' && (
            <div className="space-y-4">
              <div className="bg-gray-900 text-gray-100 rounded-xl p-5 border border-gray-700 text-xs font-mono space-y-3">
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>// Integration Contract: Member 1 (GIS & Map Component)</span>
                  <span>droneService.js :: DroneMapOverlayAdapter</span>
                </div>
                <p className="text-gray-400">
                  Member 1 can import <code>DroneMapOverlayAdapter</code> from <code>src/services/droneService.js</code> to directly overlay the drone boundaries and georeferenced raster tile bounds on MapLibre / Leaflet.
                </p>
                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 text-emerald-300 overflow-x-auto">
                  <pre>{`// Usage in Member 1's Map component:
import { DroneMapOverlayAdapter } from '../../services/droneService';

const overlayConfig = DroneMapOverlayAdapter.getRasterOverlayConfig('drone-srv-02');
// overlayConfig provides:
//  - bounds: [[16.9880, 73.3100], [16.9930, 73.3150]] (Southwest to Northeast)
//  - orthomosaicUrl: High-res UAV raster
//  - ndviMapUrl: False-color spectral index
//  - geoJsonBoundary: Polygon boundary FeatureCollection

const geoJson = DroneMapOverlayAdapter.getGeoJsonBoundary('drone-srv-02');
map.addSource('drone-boundary', { type: 'geojson', data: geoJson });`}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
