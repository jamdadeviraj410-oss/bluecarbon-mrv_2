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
} from '../services/droneService.js';
import {
  getRiskLevel,
  runMrvAnomalyAudit,
} from '../services/mrvRiskService.js';

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

  // 5. Drone GIS Adapter Contract Tests
  const geoJson = DroneMapOverlayAdapter.getGeoJsonBoundary('drone-srv-02');
  assert(geoJson.type === 'FeatureCollection', 'GIS Adapter returns valid FeatureCollection');
  const rasterConfig = DroneMapOverlayAdapter.getRasterOverlayConfig('drone-srv-02');
  assert(Array.isArray(rasterConfig.bounds), 'Raster overlay config contains coordinate bounds array');
  assert(rasterConfig.bounds.length === 2, 'Raster bounds have Southwest and Northeast pairs');

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

  return results;
}
