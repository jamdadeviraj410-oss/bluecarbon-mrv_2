/**
 * Evidence & Multi-Sensor Verification Adapter (Member 2 Interface)
 * 
 * Provides a clean abstraction layer for:
 * - Drone Multispectral NDVI analysis
 * - OCR Document parsing & lab certificate verification
 * - In-situ IoT Sediment & salinity sensors
 * - Field GPS survey logs
 */

export const EVIDENCE_TYPES = {
  DRONE_NDVI: 'DRONE_NDVI',
  SOIL_CORE: 'SOIL_CORE',
  SOIL_SALINITY: 'SOIL_SALINITY',
  COMMUNITY_GPS: 'COMMUNITY_GPS',
  OCR_CERTIFICATE: 'OCR_CERTIFICATE',
  ACOUSTIC_BIODIVERSITY: 'ACOUSTIC_BIODIVERSITY',
};

export const MOCK_EVIDENCE_ANALYSIS = {
  summary: {
    totalEvidenceFiles: 142,
    validatedFiles: 136,
    flaggedAnomalies: 4,
    rejectedFiles: 2,
    averageConfidenceScore: 98.6,
  },
  ocrCertificates: [
    {
      id: 'OCR-LAB-01',
      documentName: 'ICAR_Soil_Sediment_Lab_Report_2023.pdf',
      extractedLab: 'ICAR - Central Coastal Agricultural Research Institute',
      testedMetric: 'Total Organic Carbon (TOC)',
      reportedValue: '2.84 g C / kg dry weight',
      ocrConfidence: 99.2,
      tamperCheck: 'PASSED_SHA256_MATCH',
      verifiedDate: '2023-09-20',
    },
    {
      id: 'OCR-GOV-02',
      documentName: 'Forest_Dept_Coastal_Demarcation_NOC.pdf',
      extractedAuthority: 'West Bengal State Forest Directorate',
      surveyPlotNumber: 'WB-S24P-PLOT-45B',
      ocrConfidence: 98.7,
      tamperCheck: 'PASSED_DIGITAL_STAMP',
      verifiedDate: '2023-08-14',
    },
  ],
  sensorStreams: [
    {
      sensorId: 'IOT-SAL-8821',
      location: 'Sundarbans Plot 01 Tidal Creek',
      parameter: 'Porewater Salinity',
      currentReading: '27.4 ppt',
      status: 'OPTIMAL_MANGROVE_HEALTH',
      batteryLevel: 94,
      lastSync: '10 mins ago',
    },
    {
      sensorId: 'IOT-CAN-4412',
      location: 'Sundarbans West Plot 03',
      parameter: 'Photosynthetically Active Radiation (PAR)',
      currentReading: '1280 µmol/m²/s',
      status: 'NORMAL',
      batteryLevel: 89,
      lastSync: '25 mins ago',
    },
  ],
};

export async function getEvidenceAnalysisSummary() {
  return MOCK_EVIDENCE_ANALYSIS;
}

export async function getOcrVerificationData() {
  return MOCK_EVIDENCE_ANALYSIS.ocrCertificates;
}

export async function getSensorTelemetryLog() {
  return MOCK_EVIDENCE_ANALYSIS.sensorStreams;
}
