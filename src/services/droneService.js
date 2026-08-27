/**
 * Drone Survey & Before/After Restoration Analysis Service
 * Manages UAV photogrammetry surveys, high-res orthomosaics, NDVI vegetation indexes,
 * GeoJSON polygon boundaries, and temporal before/after comparative analysis.
 * 
 * Provides an Integration Contract & Adapter for Member 1 (GIS / Map Lead).
 */

import { supabase } from '../lib/supabase.js';

// Seed Drone Surveys (Baseline 2023 vs Monitored Restoration 2026)
// project_id references public.projects(id) UUID for PRJ-2023-089
export const INITIAL_DRONE_SURVEYS = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    project_id: 'b0000000-0000-0000-0000-000000000001',
    survey_code: 'DRONE-2023-BASELINE-01',
    survey_date: '2023-02-10',
    survey_type: 'BASELINE',
    stage: 'BEFORE',
    survey_area_hectares: 128.0,
    coverage_percent: 100.0,
    resolution_cm_per_pixel: 2.8,
    flight_altitude_m: 65.0,
    canopy_cover_percent: 14.2,
    estimated_tree_count: 18400,
    health_ndvi_mean: 0.284,
    orthomosaic_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    ndvi_map_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    kml_raw: `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Ratnagiri Sector A Baseline</name><Polygon><outerBoundaryIs><LinearRing><coordinates>73.3100,16.9880,0 73.3150,16.9880,0 73.3150,16.9930,0 73.3100,16.9930,0 73.3100,16.9880,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Document></kml>`,
    geojson_data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Plot A Baseline Boundary',
            stage: 'BEFORE',
            canopyCover: '14.2%',
            ndviMean: 0.284,
            surveyDate: '2023-02-10',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [73.3100, 16.9880],
                [73.3150, 16.9880],
                [73.3150, 16.9930],
                [73.3100, 16.9930],
                [73.3100, 16.9880],
              ],
            ],
          },
        },
      ],
    },
    metadata: {
      uavModel: 'DJI Matrice 300 RTK',
      sensor: 'MicaSense RedEdge-P Multispectral',
      pilot: 'NCCR UAV Team',
      weather: 'Clear, 12 knots wind',
      isSampleDataset: true,
    },
    created_at: '2023-02-11T09:00:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    project_id: 'b0000000-0000-0000-0000-000000000001',
    survey_code: 'DRONE-2026-RESTORATION-03',
    survey_date: '2026-08-12',
    survey_type: 'RESTORATION_MONITORING',
    stage: 'AFTER',
    survey_area_hectares: 128.0,
    coverage_percent: 100.0,
    resolution_cm_per_pixel: 2.2,
    flight_altitude_m: 55.0,
    canopy_cover_percent: 78.6,
    estimated_tree_count: 142000,
    health_ndvi_mean: 0.742,
    orthomosaic_url: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1200&q=80',
    ndvi_map_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    kml_raw: `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Ratnagiri Sector A Restored</name><Polygon><outerBoundaryIs><LinearRing><coordinates>73.3100,16.9880,0 73.3150,16.9880,0 73.3150,16.9930,0 73.3100,16.9930,0 73.3100,16.9880,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Document></kml>`,
    geojson_data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Plot A 3-Year Restored Canopy',
            stage: 'AFTER',
            canopyCover: '78.6%',
            ndviMean: 0.742,
            surveyDate: '2026-08-12',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [73.3100, 16.9880],
                [73.3150, 16.9880],
                [73.3150, 16.9930],
                [73.3100, 16.9930],
                [73.3100, 16.9880],
              ],
            ],
          },
        },
      ],
    },
    metadata: {
      uavModel: 'DJI Mavic 3 Enterprise Multispectral',
      sensor: 'RGB + 4-Band Multispectral',
      pilot: 'NCCR Certified Remote Pilot #IND-782',
      weather: 'Partly Cloudy, 8 knots wind',
      isSampleDataset: true,
    },
    created_at: '2026-08-12T14:30:00Z',
  },
];

let inMemoryDroneSurveys = [...INITIAL_DRONE_SURVEYS];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch all drone surveys
 * @param {string} [projectId]
 * @returns {Promise<Array>}
 */
export async function getDroneSurveys(projectId) {
  try {
    let resolvedProjectId = projectId;
    if (projectId && !UUID_REGEX.test(projectId)) {
      // Look up corresponding project UUID by project_code
      try {
        const { data: projData } = await supabase
          .from('projects')
          .select('id')
          .eq('project_code', projectId)
          .maybeSingle();
        if (projData?.id) {
          resolvedProjectId = projData.id;
        } else if (projectId === 'PRJ-2023-089') {
          resolvedProjectId = 'b0000000-0000-0000-0000-000000000001';
        } else {
          resolvedProjectId = null;
        }
      } catch {
        resolvedProjectId = projectId === 'PRJ-2023-089' ? 'b0000000-0000-0000-0000-000000000001' : null;
      }
    }

    let query = supabase.from('drone_surveys').select('*').order('survey_date', { ascending: false });
    if (resolvedProjectId) {
      query = query.eq('project_id', resolvedProjectId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Supabase getDroneSurveys error:', error);
    } else if (data && data.length > 0) {
      // Synchronize in-memory cache with fetched rows
      data.forEach((row) => {
        const existingIdx = inMemoryDroneSurveys.findIndex((s) => s.id === row.id || s.survey_code === row.survey_code);
        if (existingIdx >= 0) {
          inMemoryDroneSurveys[existingIdx] = { ...inMemoryDroneSurveys[existingIdx], ...row };
        } else {
          inMemoryDroneSurveys.push(row);
        }
      });
      return data;
    }
  } catch (err) {
    console.error('Failed to query drone_surveys from Supabase:', err);
  }

  // Fallback data for local/demo resilience
  if (projectId) {
    return inMemoryDroneSurveys.filter(
      (s) => s.project_id === projectId || (projectId === 'PRJ-2023-089' && s.project_id === 'b0000000-0000-0000-0000-000000000001')
    );
  }
  return inMemoryDroneSurveys;
}

/**
 * Get single drone survey by ID or survey code
 * @param {string} id
 * @returns {Object|undefined}
 */
export function getDroneSurveyById(id) {
  if (!id) return undefined;
  return inMemoryDroneSurveys.find((s) => s.id === id || s.survey_code === id || s.id === `drone-srv-0${id.slice(-1)}`);
}

/**
 * Register/Upload a new Drone Survey
 * @param {Object} surveyPayload
 * @returns {Promise<Object>}
 */
export async function createDroneSurvey(surveyPayload) {
  const newSurvey = {
    id: `d0000000-0000-0000-0000-${String(Date.now()).padStart(12, '0').slice(-12)}`,
    project_id: surveyPayload.projectId || 'b0000000-0000-0000-0000-000000000001',
    survey_code: surveyPayload.surveyCode || `DRONE-${new Date().getFullYear()}-SRV-${Math.floor(100 + Math.random() * 900)}`,
    survey_date: surveyPayload.surveyDate || new Date().toISOString().split('T')[0],
    survey_type: surveyPayload.surveyType || 'RESTORATION_MONITORING',
    stage: surveyPayload.stage || 'AFTER',
    survey_area_hectares: Number(surveyPayload.surveyAreaHectares) || 128.0,
    coverage_percent: Number(surveyPayload.coveragePercent) || 100.0,
    resolution_cm_per_pixel: Number(surveyPayload.resolutionCmPerPixel) || 2.5,
    flight_altitude_m: Number(surveyPayload.flightAltitudeM) || 60.0,
    canopy_cover_percent: Number(surveyPayload.canopyCoverPercent) || 75.0,
    estimated_tree_count: Number(surveyPayload.estimatedTreeCount) || 140000,
    health_ndvi_mean: Number(surveyPayload.healthNdviMean) || 0.72,
    orthomosaic_url: surveyPayload.orthomosaicUrl || 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1200&q=80',
    ndvi_map_url: surveyPayload.ndviMapUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    geojson_data: surveyPayload.geojsonData || {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Survey Zone' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [73.3100, 16.9880],
                [73.3150, 16.9880],
                [73.3150, 16.9930],
                [73.3100, 16.9930],
                [73.3100, 16.9880],
              ],
            ],
          },
        },
      ],
    },
    kml_raw: surveyPayload.kmlRaw || null,
    metadata: surveyPayload.metadata || { isSampleDataset: true },
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('drone_surveys')
      .insert(newSurvey)
      .select()
      .single();

    if (error) {
      console.error('Supabase createDroneSurvey error:', error);
    } else if (data) {
      newSurvey.id = data.id;
    }
  } catch (err) {
    console.error('Drone survey insertion exception:', err);
  }

  inMemoryDroneSurveys.unshift(newSurvey);
  return newSurvey;
}

/**
 * Compare Before vs After restoration metrics
 * @param {string} [beforeId]
 * @param {string} [afterId]
 * @returns {Object} Comparative analytics package
 */
export function getBeforeAfterComparison(beforeId, afterId) {
  const beforeSurvey = beforeId ? getDroneSurveyById(beforeId) : inMemoryDroneSurveys.find((s) => s.stage === 'BEFORE') || inMemoryDroneSurveys[0];
  const afterSurvey = afterId ? getDroneSurveyById(afterId) : inMemoryDroneSurveys.find((s) => s.stage === 'AFTER') || inMemoryDroneSurveys[1];

  const deltaCanopy = (afterSurvey.canopy_cover_percent || 0) - (beforeSurvey.canopy_cover_percent || 0);
  const deltaNdvi = (afterSurvey.health_ndvi_mean || 0) - (beforeSurvey.health_ndvi_mean || 0);
  const deltaTrees = (afterSurvey.estimated_tree_count || 0) - (beforeSurvey.estimated_tree_count || 0);
  const netBiomassGainEstimate = parseFloat((deltaCanopy * 182.4).toFixed(1)); // Sample model calculation
  const netEstimatedCO2e = parseFloat((netBiomassGainEstimate * 3.67 * (afterSurvey.survey_area_hectares / 100)).toFixed(1));

  return {
    before: {
      ...beforeSurvey,
      label: 'Baseline Pre-Restoration (2023)',
    },
    after: {
      ...afterSurvey,
      label: 'Post-Restoration High Density (2026)',
    },
    comparison: {
      canopyCoverBefore: beforeSurvey.canopy_cover_percent,
      canopyCoverAfter: afterSurvey.canopy_cover_percent,
      canopyCoverDeltaPercent: parseFloat(deltaCanopy.toFixed(1)),
      ndviBefore: beforeSurvey.health_ndvi_mean,
      ndviAfter: afterSurvey.health_ndvi_mean,
      ndviDelta: parseFloat(deltaNdvi.toFixed(3)),
      treeCountBefore: beforeSurvey.estimated_tree_count,
      treeCountAfter: afterSurvey.estimated_tree_count,
      netTreeIncrease: deltaTrees,
      survivalRatePercent: 92.4,
      netBiomassGainEstimateTons: netBiomassGainEstimate,
      netEstimatedCO2e,
      surveyAreaHectares: afterSurvey.survey_area_hectares,
      timeElapsedMonths: 42,
      isSampleCalculation: true,
      disclaimer: 'SAMPLE RESTORATION DATASET — Metrics computed using multispectral canopy reflectance models.',
    },
  };
}

/**
 * Helper to resolve survey from survey object or ID
 * @param {string|Object} surveyOrId
 * @returns {Object}
 */
function resolveSurvey(surveyOrId) {
  if (typeof surveyOrId === 'object' && surveyOrId !== null) {
    return surveyOrId;
  }
  return getDroneSurveyById(surveyOrId) || inMemoryDroneSurveys[0];
}

/**
 * =========================================================================
 * INTEGRATION CONTRACT FOR MEMBER 1 (GIS & MAP LEAD)
 * =========================================================================
 * 
 * Member 1's Map component can call these adapter functions directly to:
 *  1. Render the exact drone polygon boundary on MapLibre / Leaflet.
 *  2. Overlay high-resolution georeferenced orthomosaics & NDVI rasters.
 *  3. Sync bounding box coordinates with project polygons.
 */
export const DroneMapOverlayAdapter = {
  /**
   * Returns GeoJSON FeatureCollection for rendering on map layers
   */
  getGeoJsonBoundary(surveyOrId) {
    const survey = resolveSurvey(surveyOrId);
    let geo = survey.geojson_data;
    if (typeof geo === 'string') {
      try {
        geo = JSON.parse(geo);
      } catch {
        geo = null;
      }
    }
    return geo || inMemoryDroneSurveys[0].geojson_data;
  },

  /**
   * Returns Raster Overlay metadata with GPS coordinates bounding box
   */
  getRasterOverlayConfig(surveyOrId) {
    const survey = resolveSurvey(surveyOrId);
    let bounds = [
      [16.9880, 73.3100], // Southwest [lat, lng]
      [16.9930, 73.3150], // Northeast [lat, lng]
    ];

    // Compute bounding box dynamically from geojson if available
    const geo = this.getGeoJsonBoundary(survey);
    if (geo?.features?.[0]?.geometry?.coordinates?.[0]?.length > 0) {
      const coords = geo.features[0].geometry.coordinates[0];
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      coords.forEach(([lng, lat]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });
      if (minLat <= maxLat && minLng <= maxLng) {
        bounds = [
          [minLat, minLng],
          [maxLat, maxLng],
        ];
      }
    }

    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLng = (bounds[0][1] + bounds[1][1]) / 2;

    return {
      surveyId: survey.id,
      code: survey.survey_code,
      date: survey.survey_date,
      stage: survey.stage,
      orthomosaicUrl: survey.orthomosaic_url,
      ndviMapUrl: survey.ndvi_map_url,
      bounds,
      resolutionGsd: survey.resolution_cm_per_pixel,
      center: [centerLat, centerLng],
      zoom: 17,
      layerAttribution: 'NCCR Drone MRV Survey Dept',
    };
  },

  /**
   * Export GeoJSON format string for external GIS tools (QGIS, ArcGIS)
   */
  exportGeoJsonString(surveyOrId) {
    const survey = resolveSurvey(surveyOrId);
    const geo = this.getGeoJsonBoundary(survey);
    return JSON.stringify(geo, null, 2);
  },

  /**
   * Export KML format string
   */
  exportKmlString(surveyOrId) {
    const survey = resolveSurvey(surveyOrId);
    return survey.kml_raw || '';
  },
};

