# MRV Intelligence, Field Data & Sensor Integrations (Member 2 Specification)

## Overview & Ownership
**Member 2** owns the end-to-end MRV Intelligence and Field Data Subsystems in the BlueCarbon MRV platform:
1. **Neural OCR Engine** (`Tesseract.js` + Structured MRV Entity Extraction + Auditor Confirmation Pipeline).
2. **IoT Sensor Registry & Real-Time Telemetry** (Water level, Salinity, Soil Moisture, pH, Temperature probes + ESP32 Simulator + prominent `DEMO SENSOR DATA` indicators).
3. **UAV Drone Surveys & Before/After Restoration Analysis** (High-res orthomosaics, NDVI vegetation reflectance, GeoJSON/KML boundaries, and interactive split-curtain comparison).
4. **MRV Anomaly Detection & Composite Risk Engine** (Multi-source cross-verification: Claimed Registry vs OCR vs Drone vs GPS vs IoT Telemetry vs Biological Plausibility).

---

## 1. Integration Contracts for Parallel Development

### A. Integration Contract for Member 1 (GIS & Geospatial Map Lead)
Member 1's Map component can import the standardized adapter from `src/services/droneService.js`:

```javascript
import { DroneMapOverlayAdapter } from '@/services/droneService';

// 1. Fetch GeoJSON Boundary for MapLibre / Leaflet vector layers
const geoJson = DroneMapOverlayAdapter.getGeoJsonBoundary(surveyId);

// 2. Fetch Georeferenced Drone Orthomosaic & NDVI Rasters with Bounding Box
const overlayConfig = DroneMapOverlayAdapter.getRasterOverlayConfig(surveyId);
/*
Returns:
{
  surveyId: 'drone-srv-02',
  code: 'DRONE-2026-RESTORATION-03',
  date: '2026-08-12',
  stage: 'AFTER',
  orthomosaicUrl: 'https://...',
  ndviMapUrl: 'https://...',
  bounds: [
    [16.9880, 73.3100], // Southwest [lat, lng]
    [16.9930, 73.3150]  // Northeast [lat, lng]
  ],
  resolutionGsd: 2.2, // cm/pixel
  center: [16.9905, 73.3125]
}
*/

// 3. Export formats for external GIS suites (QGIS / ArcGIS / Google Earth)
const geoJsonStr = DroneMapOverlayAdapter.exportGeoJsonString(surveyId);
const kmlStr = DroneMapOverlayAdapter.exportKmlString(surveyId);
```

---

### B. Integration Contract for Member 3 (Auditor & NCCR Verification Lead)
Member 3's Verification Workspace consumes the automated anomaly audit and composite risk score:

```javascript
import { runMrvAnomalyAudit, resolveAnomaly } from '@/services/mrvRiskService';

// Run automated multi-source sanity audit for a project
const audit = await runMrvAnomalyAudit(projectId);
/*
Returns:
{
  overallScore: 38.0, // 0 - 100
  riskLevel: 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  summary: {
    totalAnomalies: 3,
    criticalFlags: 0,
    highFlags: 1,
    mediumFlags: 1,
    lowFlags: 1,
    crossChecksPassed: 5,
    crossChecksTotal: 6,
    systemRecommendation: 'Requires Auditor Review of Flagged Discrepancies'
  },
  anomalies: [...],
  crossChecks: [...]
}
*/

// Resolve or sign off on an anomaly
await resolveAnomaly(anomalyId, 'Field audit confirmed note was draft buffer', 'Dr. A. Sharma');
```

---

### C. Integration Contract for Member 4 (Blockchain Registry & Carbon Credits Lead)
Member 4's Smart Contract Anchoring Edge Function queries verified evidence outputs:

```javascript
import { getOcrResults } from '@/services/ocrService';
import { getSensors, getSensorReadings } from '@/services/sensorService';

// Ensure evidence has auditor confirmation and high confidence
const ocrLogs = await getOcrResults(projectId);
const isVerified = ocrLogs.some(r => r.isReviewed && r.confidenceScore >= 60);

// Validate IoT Telemetry uptime before minting
const sensors = await getSensors(projectId);
const activeSensors = sensors.filter(s => s.status === 'ACTIVE');
```

---

## 2. Neural OCR Engine Architecture

### Extraction Fields
- `projectId` (e.g. `PRJ-2023-089`)
- `date` (e.g. `14 Aug 2026`)
- `area` (e.g. `128.00 ha`)
- `species` (Endemic Mangrove flora: *Avicennia marina, Rhizophora mucronata, Sonneratia alba*, etc.)
- `plantCount` (e.g. `142,000 saplings`)
- `carbonValue` (e.g. `14,200 tCO2e`)
- `location` / `coordinates` (e.g. `16.9902 N, 73.3120 E`)
- `referenceNumber` (e.g. `NCCR-26-842`)
- `organization` (e.g. `National Centre for Coastal Research`)

### Confidence Scoring Hierarchy
- **`> 90%`** : `HIGH`
- **`60% – 90%`** : `MEDIUM`
- **`< 60%`** : `LOW`

> [!IMPORTANT]
> **Strict Decision Support Policy**: OCR output is advisory. It **NEVER** automatically approves MRV submissions. Every scan provides an editable side-by-side verification view with auditor sign-off.

---

## 3. IoT Sensor Fleet & Real-Time Telemetry

### Supported Probe Modalities
1. **Water Level / Tide Height** (`m`, range -0.5m to 4.5m)
2. **Water Salinity** (`PSU`, range 0 to 45 PSU)
3. **Soil Moisture** (`%`, range 0 to 100%)
4. **Sediment & Water pH** (`pH`, range 4.0 to 9.5)
5. **Ambient & Water Temperature** (`°C`, range 10 to 45°C)

### Simulated Mode Policy
- Physical hardware is **NOT required** for demo evaluation.
- All simulated telemetry is explicitly tagged with `isSimulated: true` and displays prominent **`DEMO SENSOR DATA`** badges in the UI.

---

## 4. Drone Surveys & Before/After Restoration Analysis

- **Baseline Pre-Restoration (2023)**: 14.2% Canopy Cover, 0.284 NDVI, 18,400 stems.
- **Restoration Monitoring (2026)**: 78.6% Canopy Cover (+64.4%), 0.742 NDVI (+0.458), 142,000 stems (+123,600).
- **Interactive UI**: Draggable split-screen curtain slider, side-by-side mode, false-color NDVI layers.
- **Disclaimer**: Sample calculations labeled `SAMPLE RESTORATION DATASET`.

---

## 5. MRV Anomaly Engine & Multi-Source Risk Scoring

### Anomaly Types Detected
- `AREA_MISMATCH`: Discrepancy > 5% between Claimed Registry, OCR extractions, and UAV boundary polygons.
- `GPS_MISMATCH`: Field coordinates or drone waypoints drifting > 500m outside registered boundary.
- `DATE_MISMATCH`: Chronological invalidity (out of monitoring cycle or future-dated records).
- `DUPLICATE_EVIDENCE`: SHA-256 collision or recycled challan serial numbers across projects.
- `MISSING_SENSOR_DATA`: Telemetry latency > 72 hours during active monitoring season.
- `OTHER_INCONSISTENCY`: Biological impossibilities (e.g. impossible seedling density > 10,000/ha without thinning).

### Risk Score Calculation (0 – 100)
- **`0 – 20`** : `LOW` (Pass / Minor advisory notes)
- **`21 – 50`** : `MEDIUM` (Auditor review requested)
- **`51 – 75`** : `HIGH` (In-depth on-site audit required)
- **`76 – 100`** : `CRITICAL` (Blocker / Potential Fraud / Discrepancy)

---

## 6. Safe Supabase Database Migration
Migration `supabase/migrations/202608240013_mrv_intelligence_sensors_drone_anomalies.sql` creates:
- `public.ocr_results`
- `public.sensors`
- `public.sensor_readings`
- `public.drone_surveys`
- `public.mrv_anomalies`

All tables include foreign keys to `projects(id)`, performance indexes, and non-destructive Row Level Security (RLS) policies.
