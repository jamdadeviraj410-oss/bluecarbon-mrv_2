import {
  extractStructuredMrvData,
  getConfidenceLevel,
  SAMPLE_OCR_DOCUMENTS,
} from '../services/ocrService.js';
import {
  generateDemoSensorTick,
  SENSOR_TYPES,
  INITIAL_SENSORS,
} from '../services/sensorService.js';
import {
  getBeforeAfterComparison,
  DroneMapOverlayAdapter,
  INITIAL_DRONE_SURVEYS,
} from '../services/droneService.js';
import {
  getRiskLevel,
  runMrvAnomalyAudit,
} from '../services/mrvRiskService.js';
import {
  getReports,
  formatReport,
  createPdfBlob,
} from '../services/reportService.js';

export async function runMrvIntelligenceTests() {
  const results = [];

  function assert(condition, testName) {
    if (condition) {
      results.push({ name: testName, passed: true });
    } else {
      results.push({ name: testName, passed: false, error: 'Assertion failed' });
    }
  }

  // 1. OCR Confidence Level Tests
  assert(getConfidenceLevel(95) === 'HIGH', 'Confidence >90% maps to HIGH');
  assert(getConfidenceLevel(90) === 'HIGH', 'Confidence 90% maps to HIGH');
  assert(getConfidenceLevel(75) === 'MEDIUM', 'Confidence 75% maps to MEDIUM');
  assert(getConfidenceLevel(60) === 'MEDIUM', 'Confidence 60% maps to MEDIUM');
  assert(getConfidenceLevel(45) === 'LOW', 'Confidence <60% maps to LOW');

  // 2. Structured MRV Entity Extraction Tests
  const sample1 = SAMPLE_OCR_DOCUMENTS[0];
  const ocr1 = extractStructuredMrvData(sample1.rawText, 94.5);
  assert(ocr1.structured.projectId === 'PRJ-2023-089', 'OCR correctly extracts Project ID');
  assert(ocr1.structured.area === 128.0, 'OCR correctly extracts Area (128.0 ha)');
  assert(ocr1.structured.carbonValue === 14200, 'OCR correctly extracts Carbon Value (14,200 tCO2e)');
  assert(ocr1.structured.plantCount === 142000, 'OCR correctly extracts Plant Count (142,000)');
  assert(ocr1.structured.species.includes('Avicennia marina'), 'OCR correctly detects endemic species');
  assert(ocr1.structured.referenceNumber === 'NCCR-26-842', 'OCR extracts Reference Number');
  assert(ocr1.confidenceLevel === 'HIGH', 'Certificate achieves HIGH confidence tier');

  // 3. Sensor Telemetry & Demo Ingestion Tests
  const tick = generateDemoSensorTick();
  assert(tick.isSimulated === true, 'Demo sensor reading has isSimulated: true flag');
  assert(typeof tick.value === 'number', 'Demo reading value is a numeric measurement');
  assert(INITIAL_SENSORS.length >= 5, 'Fleet contains at least 5 baseline sensor probes');
  assert(SENSOR_TYPES.WATER_LEVEL.unit === 'm', 'Water level modality unit is meters');
  assert(SENSOR_TYPES.SALINITY.unit === 'PSU', 'Salinity modality unit is PSU');

  // 4. Drone Photogrammetry & Before/After Comparison Tests
  const droneComp = getBeforeAfterComparison();
  assert(droneComp.comparison.canopyCoverDeltaPercent > 50, 'Before/After canopy cover increased > 50%');
  assert(droneComp.comparison.ndviDelta > 0.4, 'Before/After NDVI increased > 0.4');
  assert(droneComp.comparison.isSampleCalculation === true, 'Drone calculation carries sample calculation flag');
  assert(typeof droneComp.comparison.disclaimer === 'string', 'Drone comparison includes mandatory disclaimer');

  // 5. Drone GIS Adapter Contract & Spatial Overlay Tests
  const geoJson = DroneMapOverlayAdapter.getGeoJsonBoundary('drone-srv-02');
  assert(geoJson.type === 'FeatureCollection', 'GIS Adapter returns valid FeatureCollection');
  const rasterConfig = DroneMapOverlayAdapter.getRasterOverlayConfig('drone-srv-02');
  assert(Array.isArray(rasterConfig.bounds), 'Raster overlay config contains coordinate bounds array');
  assert(rasterConfig.bounds.length === 2, 'Raster bounds have Southwest and Northeast pairs');

  // 5b. Drone Survey Selection & GeoJSON Object Passing Tests
  const allSurveys = INITIAL_DRONE_SURVEYS;
  assert(allSurveys.length >= 2, 'Initial drone surveys contains at least 2 surveys (Baseline & Restoration)');
  
  const baselineSurvey = allSurveys.find((s) => s.stage === 'BEFORE');
  assert(Boolean(baselineSurvey), 'Baseline survey exists in drone surveys');
  assert(baselineSurvey.geojson_data?.type === 'FeatureCollection', 'Baseline survey contains FeatureCollection GeoJSON');
  assert(baselineSurvey.geojson_data?.features?.[0]?.geometry?.type === 'Polygon', 'Baseline survey geometry is Polygon');
  
  const restorationSurvey = allSurveys.find((s) => s.stage === 'AFTER');
  assert(Boolean(restorationSurvey), 'Restoration survey exists in drone surveys');
  assert(restorationSurvey.geojson_data?.type === 'FeatureCollection', 'Restoration survey contains FeatureCollection GeoJSON');
  assert(restorationSurvey.geojson_data?.features?.[0]?.geometry?.type === 'Polygon', 'Restoration survey geometry is Polygon');

  // Test object-direct passing to adapter
  const directGeoJson = DroneMapOverlayAdapter.getGeoJsonBoundary(restorationSurvey);
  assert(directGeoJson.type === 'FeatureCollection', 'Adapter resolves GeoJSON directly from survey object');
  const directRaster = DroneMapOverlayAdapter.getRasterOverlayConfig(restorationSurvey);
  assert(Array.isArray(directRaster.bounds) && directRaster.bounds.length === 2, 'Adapter resolves raster config from survey object');

  // UUID Format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert(uuidRegex.test(baselineSurvey.project_id), 'Baseline survey project_id is a valid UUID format');
  assert(uuidRegex.test(restorationSurvey.project_id), 'Restoration survey project_id is a valid UUID format');

  // 6. MRV Risk Scoring & Anomaly Detection Tests
  assert(getRiskLevel(15) === 'LOW', 'Risk score 15 is LOW');
  assert(getRiskLevel(35) === 'MEDIUM', 'Risk score 35 is MEDIUM');
  assert(getRiskLevel(65) === 'HIGH', 'Risk score 65 is HIGH');
  assert(getRiskLevel(85) === 'CRITICAL', 'Risk score 85 is CRITICAL');

  const audit = await runMrvAnomalyAudit('PRJ-2023-089');
  assert(typeof audit.overallScore === 'number', 'MRV Audit calculates numeric overall score');
  assert(Array.isArray(audit.crossChecks), 'MRV Audit includes multi-source crossChecks array');
  assert(audit.crossChecks.length >= 5, 'MRV Audit performs at least 5 multi-source cross-checks');
  assert(typeof audit.summary.disclaimer === 'string', 'MRV Audit includes decision support disclaimer');

  // 7. Reports & PDF Generation Tests
  const legacyMalformedReport = {
    id: 'test-legacy-01',
    report_code: 'REP-2026-999',
    title: '{"reportType":"National Summary Report","format":"PDF","dateRange":"Last 12 Months","state":"All States"}',
    report_type: 'EXECUTIVE_SUMMARY',
    description: 'Automated on-demand report generation for undefined.',
    period: 'Q3 2023',
    status: 'COMPLETED',
  };

  const formattedLegacy = formatReport(legacyMalformedReport);
  assert(formattedLegacy.title.includes('National Summary Report'), 'Legacy JSON-encoded title is normalized into human-readable string');
  assert(!formattedLegacy.title.startsWith('{'), 'Legacy JSON title prefix removed');
  assert(!formattedLegacy.description.includes('undefined'), 'Description with undefined placeholder is normalized safely');
  assert(formattedLegacy.status === 'Completed', 'Status is formatted properly');

  // PDF Blob generation test
  const pdfBlob = createPdfBlob(formattedLegacy);
  assert(Boolean(pdfBlob), 'createPdfBlob returns a Blob object');
  assert(pdfBlob.type === 'application/pdf', 'createPdfBlob returns application/pdf MIME type');
  assert(pdfBlob.size > 500, 'createPdfBlob creates valid binary PDF with non-zero size');

  // Reports service fetch test
  try {
    const liveReports = await getReports();
    assert(Array.isArray(liveReports), 'getReports returns an array');
    assert(liveReports.length > 0, 'getReports retrieves reports from database');
    const firstReport = liveReports[0];
    assert(Boolean(firstReport.title) && !firstReport.title.startsWith('{'), 'Database report title is formatted properly');
    assert(Boolean(firstReport.description) && !firstReport.description.includes('undefined'), 'Database report description is clean');
  } catch (err) {
    console.error('getReports test warning:', err);
  }

  return results;
}
