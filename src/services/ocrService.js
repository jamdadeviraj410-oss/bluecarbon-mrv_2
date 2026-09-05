/**
 * OCR Intelligence Service
 * Uses Tesseract.js to extract structured MRV data from field receipts, certificates, and reports.
 * 
 * Confidence Levels:
 *  - >90%  : HIGH
 *  - 60-90%: MEDIUM
 *  - <60%  : LOW
 * 
 * CRITICAL RULE: OCR outputs are strictly for decision support and MUST NEVER
 * automatically approve MRV submissions without human auditor review and confirmation.
 */

import { createWorker } from 'tesseract.js';
import { supabase } from '../lib/supabase.js';

// Sample MRV Documents for Instant Demo & Evaluation
export const SAMPLE_OCR_DOCUMENTS = [
  {
    id: 'doc-sample-1',
    name: 'NCCR Field Verification Certificate #842',
    type: 'AUDIT_CERTIFICATE',
    date: '2026-08-14',
    thumbnail: 'certificate',
    rawText: `NATIONAL CENTRE FOR COASTAL RESEARCH (NCCR)
MINISTRY OF EARTH SCIENCES, GOVT OF INDIA
PROJECT VERIFICATION AUDIT CERTIFICATE

Project Code: PRJ-2023-089
Project Name: Maharashtra Mangrove Restoration – Sector A
Issuing Authority: National Centre for Coastal Research (NCCR)
Lead Signatory: Dr. A. Sharma (Director, Coastal Ecology)
Audit Reference No: NCCR-26-842
Survey Date: 14 Aug 2026
Verified Restoration Area: 128.00 Hectares
Target Species: Avicennia marina, Rhizophora mucronata
Total Plantation Count: 142,000 Saplings
Calculated Sequestration: 14,200 tCO2e
Geographic Zone: Ratnagiri Coastal Belt, Maharashtra
Coordinates: 16.990200 N, 73.312000 E
Status: COMPLIANT WITH BLUE CARBON MRV PROTOCOL v1.0`,
    confidence: 94.5,
  },
  {
    id: 'doc-sample-2',
    name: 'Mangrove Nursery Sapling Dispatch Receipt',
    type: 'NURSERY_RECEIPT',
    date: '2026-07-28',
    thumbnail: 'receipt',
    rawText: `STATE FOREST & COASTAL NURSERY DIVISION
MANGROVE CONSERVATION CELL - GOVT OF MAHARASHTRA
OFFICIAL SAPLING DELIVERY CHALLAN / RECEIPT

Delivery Order No: DEL-2026-MANG-0492
Client Project: PRJ-2023-089
Delivery Date: 28/07/2026
Consignee: BlueCarbon India / NCCR Coastal Partner
Restoration Plot: Sector A Tidal Flats (128.0 ha)
Species Supplied:
 1. Rhizophora mucronata (Red Mangrove) - 85,000 saplings
 2. Avicennia marina (Grey Mangrove) - 57,000 saplings
Total Delivered Quantity: 142,000 saplings (Root-ball nursery bags)
Survival Viability Guarantee: 92%
Batch Tag Reference: MAH-MANG-BATCH-2026-88
Inspected By: Officer S. K. Kadam, Range Forest Officer`,
    confidence: 88.0,
  },
  {
    id: 'doc-sample-3',
    name: 'Biomass & Sediment Core Lab Assay Report',
    type: 'LAB_ASSAY',
    date: '2026-08-05',
    thumbnail: 'science',
    rawText: `COASTAL SEDIMENT LAB ASSAYS - ICAR LAB
LABORATORY ANALYSIS CERTIFICATE #LAB-2026-904

Sample Source: PRJ-2023-089 Plot 04
Collection Date: 05 Aug 2026
Methodology: Walkley-Black Wet Oxidation & Loss On Ignition (LOI)
Organic Carbon Content (SOC): 3.42 %
Sediment Bulk Density: 1.18 g/cm3
Salinity: 28.4 PSU
Soil pH: 7.25
Estimated Total Carbon Stock: 110.94 tC/ha
Equivalent CO2e: 14,200 tCO2e (Net Estimated Yield)
Chief Assayer: Dr. Meenakshi Sundaram`,
    confidence: 76.5,
  },
  {
    id: 'doc-sample-4',
    name: 'Low Quality Field Notes (Drift / High Noise)',
    type: 'FIELD_REPORT',
    date: '2026-06-12',
    thumbnail: 'edit_note',
    rawText: `Field Note Site B
prj id ? PRJ-2023-089 ??
area approx ~135 ha (mismatch vs registry 128 ha)
trees planted: 110000 approx
species: avicena mar.
date: 12-06-2026
sign: field agent unverified`,
    confidence: 52.0,
  },
];

// Fallback in-memory review storage
let inMemoryOcrResults = [
  {
    id: 'ocr-res-001',
    projectId: 'PRJ-2023-089',
    evidenceId: null,
    documentType: 'AUDIT_CERTIFICATE',
    rawText: SAMPLE_OCR_DOCUMENTS[0].rawText,
    structuredData: {
      projectId: 'PRJ-2023-089',
      date: '2026-08-14',
      area: 128.0,
      areaUnit: 'Hectares',
      species: 'Avicennia marina, Rhizophora mucronata',
      plantCount: 142000,
      carbonValue: 14200,
      carbonUnit: 'tCO2e',
      location: 'Ratnagiri Coastal Belt, Maharashtra (16.9902 N, 73.3120 E)',
      referenceNumber: 'NCCR-26-842',
      organization: 'National Centre for Coastal Research (NCCR)',
      signatory: 'Dr. A. Sharma (Director)',
    },
    confidenceScore: 94.5,
    confidenceLevel: 'HIGH',
    engine: 'Tesseract.js v5.1.0',
    isReviewed: true,
    reviewedBy: 'Dr. A. Sharma (Auditor)',
    reviewedAt: '2026-08-15T10:30:00Z',
    corrections: {},
    createdAt: '2026-08-14T16:00:00Z',
  },
];

/**
 * Determine confidence category
 * @param {number} score 0 - 100
 * @returns {'HIGH'|'MEDIUM'|'LOW'}
 */
export function getConfidenceLevel(score) {
  if (score >= 90) return 'HIGH';
  if (score >= 60) return 'MEDIUM';
  return 'LOW';
}

/**
 * Parse structured MRV fields from raw OCR text using regex & heuristic extractors
 * @param {string} text Raw OCR text
 * @param {number} [baseConfidence=85] Base confidence from OCR engine
 * @returns {{ structured: Object, confidenceScore: number, confidenceLevel: string }}
 */
export function extractStructuredMrvData(text, baseConfidence = 85) {
  if (!text) {
    return {
      structured: {},
      confidenceScore: 0,
      confidenceLevel: 'LOW',
    };
  }

  const structured = {
    projectId: null,
    date: null,
    area: null,
    areaUnit: 'ha',
    species: null,
    plantCount: null,
    carbonValue: null,
    carbonUnit: 'tCO2e',
    location: null,
    referenceNumber: null,
    organization: null,
    signatory: null,
  };

  let extractedFieldCount = 0;
  const totalTargetFields = 8;

  // 1. Project ID (e.g. PRJ-2023-089, BC-2026-001, M-78392-BD)
  const projectMatch = text.match(/\b(PRJ-\d{4}-\d{2,4})\b/i) ||
    text.match(/Project\s*(?:Code|ID|Number)\s*[:=-]\s*([A-Z0-9-]+)/i) ||
    text.match(/Client\s*Project\s*[:=-]\s*([A-Z0-9-]+)/i);
  if (projectMatch) {
    structured.projectId = (projectMatch[1] || projectMatch[0]).trim();
    extractedFieldCount++;
  }

  // 2. Date Extraction (e.g. 14 Aug 2026, 2026-08-14, 28/07/2026)
  const dateMatch = text.match(/(?:Date[:\s]+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}|\d{4}[-/]\d{2}[-/]\d{2})/i);
  if (dateMatch) {
    structured.date = dateMatch[1];
    extractedFieldCount++;
  }

  // 3. Area Extraction (e.g. 128.00 Hectares, 128 ha, 1,240 ha)
  const areaMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:Hectares|Hectare|ha|acres|sq\s*km)/i);
  if (areaMatch) {
    structured.area = parseFloat(areaMatch[1].replace(',', '.'));
    structured.areaUnit = 'Hectares';
    extractedFieldCount++;
  }

  // 4. Species Extraction (Endemic Mangrove & Blue Carbon Species)
  const knownSpecies = [
    'Avicennia marina',
    'Rhizophora mucronata',
    'Sonneratia alba',
    'Ceriops tagal',
    'Bruguiera gymnorhiza',
    'Aegiceras corniculatum',
    'Excoecaria agallocha',
    'Zostera marina',
    'Posidonia oceanica',
  ];
  const foundSpecies = knownSpecies.filter((sp) => new RegExp(sp, 'i').test(text));
  if (foundSpecies.length > 0) {
    structured.species = foundSpecies.join(', ');
    extractedFieldCount++;
  } else {
    const genericSpecies = text.match(/(?:Species|Flora)[:\s]+([^\n\r]+)/i);
    if (genericSpecies) {
      structured.species = genericSpecies[1].trim();
      extractedFieldCount++;
    }
  }

  // 5. Plant Count / Sapling Quantity (e.g. 142,000 Saplings, 85,000 saplings)
  const plantMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*(?:Saplings|saplings|trees|plants|propagules)/i);
  if (plantMatch) {
    structured.plantCount = parseInt(plantMatch[1].replace(/,/g, ''), 10);
    extractedFieldCount++;
  }

  // 6. Carbon Value (e.g. 14,200 tCO2e, 4,250 tCO2)
  const carbonMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:tCO2e|tCO2|credits|tC\/ha|tonnes\s*CO2)/i);
  if (carbonMatch) {
    structured.carbonValue = parseFloat(carbonMatch[1].replace(/,/g, ''));
    structured.carbonUnit = 'tCO2e';
    extractedFieldCount++;
  }

  // 7. Reference Number / Audit ID (e.g. NCCR-26-842, DEL-2026-MANG-0492, LAB-2026-904)
  const refMatch = text.match(/(?:Audit\s*Reference\s*No|Delivery\s*Order\s*No|Reference\s*No|Challan\s*No|Certificate\s*#|Batch\s*Tag\s*Reference)\s*[:=-]\s*([A-Z0-9\-_]+)/i) ||
    text.match(/(?:Ref(?:erence)?|Challan|Assay|Order)\s*(?:No|#)?\s*[:=-]\s*([A-Z0-9\-_]+)/i);
  if (refMatch) {
    structured.referenceNumber = refMatch[1];
    extractedFieldCount++;
  }

  // 8. Organization / Authority
  const orgs = [
    'National Centre for Coastal Research (NCCR)',
    'Maharashtra Mangrove Cell',
    'State Forest & Coastal Nursery',
    'ICAR Lab',
    'BlueCarbon India',
    'Forest Department',
  ];
  const foundOrg = orgs.find((org) => new RegExp(org.replace(/[()]/g, ''), 'i').test(text));
  if (foundOrg) {
    structured.organization = foundOrg;
    extractedFieldCount++;
  }

  // 9. Signatory / Officer
  const sigMatch = text.match(/(?:Signatory|Inspected By|Officer|Chief Assayer|Director)[:\s]+([^\n\r,]+)/i);
  if (sigMatch) {
    structured.signatory = sigMatch[1].trim();
  }

  // Location / Coordinates
  const locMatch = text.match(/(?:Location|Zone|Site|Belt)[:\s]+([^\n\r]+)/i);
  const coordMatch = text.match(/(\d{1,2}\.\d+)\s*[N°]?[,\s]+(\d{1,3}\.\d+)\s*[E°]?/i);
  if (locMatch || coordMatch) {
    const locName = locMatch ? locMatch[1].trim() : '';
    const coords = coordMatch ? `(${coordMatch[1]} N, ${coordMatch[2]} E)` : '';
    structured.location = [locName, coords].filter(Boolean).join(' ');
  }

  // Compute composite confidence
  const completenessRatio = extractedFieldCount / totalTargetFields;
  const rawScore = Math.min(100, Math.max(25, (baseConfidence * 0.5) + (completenessRatio * 100 * 0.5)));
  const confidenceScore = parseFloat(rawScore.toFixed(1));
  const confidenceLevel = getConfidenceLevel(confidenceScore);

  return {
    structured,
    confidenceScore,
    confidenceLevel,
  };
}

/**
 * Run real OCR on image file or canvas using Tesseract.js
 * @param {File|Blob|string} imageSource File object, Blob, Data URL or image path
 * @param {Function} [onProgress] Progress callback (progress 0 - 100, status string)
 * @returns {Promise<{ rawText: string, structuredData: Object, confidenceScore: number, confidenceLevel: string, engine: string }>}
 */
export async function performOcrScan(imageSource, onProgress = () => {}) {
  if (!imageSource) {
    throw new Error('No valid document or image provided for OCR scanning.');
  }

  try {
    onProgress({ status: 'Initializing Tesseract OCR worker...', progress: 10 });
    const worker = await createWorker('eng');

    onProgress({ status: 'Recognizing text & symbols...', progress: 40 });
    const ret = await worker.recognize(imageSource);

    onProgress({ status: 'Extracting MRV structured entities...', progress: 85 });
    await worker.terminate();

    const rawText = ret.data.text || '';
    const baseConfidence = typeof ret.data.confidence === 'number' ? ret.data.confidence : 0;

    const { structured, confidenceScore, confidenceLevel } = extractStructuredMrvData(rawText, baseConfidence);

    onProgress({ status: 'OCR processing complete', progress: 100 });

    return {
      rawText,
      structuredData: structured,
      confidenceScore,
      confidenceLevel,
      engine: 'Tesseract.js v5 (Client Engine)',
    };
  } catch (err) {
    console.warn('Real Tesseract OCR execution notice:', err);
    // If imageSource is a string of text (e.g. sample raw text), parse it directly
    if (typeof imageSource === 'string' && !imageSource.startsWith('data:') && !imageSource.startsWith('blob:')) {
      const { structured, confidenceScore, confidenceLevel } = extractStructuredMrvData(imageSource, 85);
      return {
        rawText: imageSource,
        structuredData: structured,
        confidenceScore,
        confidenceLevel,
        engine: 'OCR Text Extraction Engine',
      };
    }
    // Otherwise throw error so the UI handles it cleanly and does not fabricate a fake scan
    throw new Error(err.message || 'Failed to process document with OCR engine.', { cause: err });
  }
}

/**
 * Save OCR scan result to Supabase or local cache
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function saveOcrResult(payload) {
  const newRecord = {
    id: `ocr-${Date.now()}`,
    projectId: payload.projectId || 'PRJ-2023-089',
    evidenceId: payload.evidenceId || null,
    documentType: payload.documentType || 'FIELD_REPORT',
    rawText: payload.rawText || '',
    structuredData: payload.structuredData || {},
    confidenceScore: payload.confidenceScore || 80,
    confidenceLevel: payload.confidenceLevel || getConfidenceLevel(payload.confidenceScore || 80),
    engine: payload.engine || 'Tesseract.js v5',
    isReviewed: false,
    reviewedBy: null,
    reviewedAt: null,
    corrections: {},
    createdAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('ocr_results')
      .insert({
        project_id: payload.projectId,
        evidence_id: payload.evidenceId,
        document_type: payload.documentType,
        raw_text: payload.rawText,
        structured_data: payload.structuredData,
        confidence_score: payload.confidenceScore,
        confidence_level: payload.confidenceLevel,
        engine: payload.engine,
        is_reviewed: false,
      })
      .select()
      .single();

    if (!error && data) {
      newRecord.id = data.id;
    }
  } catch (err) {
    console.warn('Could not persist OCR to Supabase, caching in memory:', err);
  }

  inMemoryOcrResults.unshift(newRecord);
  return newRecord;
}

/**
 * Confirm and save auditor manual corrections for an OCR scan
 * @param {string} ocrId
 * @param {Object} updatedStructuredData
 * @param {string} reviewerName
 * @returns {Promise<Object>}
 */
export async function saveOcrReview(ocrId, updatedStructuredData, reviewerName = 'Auditor') {
  const item = inMemoryOcrResults.find((r) => r.id === ocrId);
  const now = new Date().toISOString();

  if (item) {
    item.corrections = {
      previous: { ...item.structuredData },
      updated: { ...updatedStructuredData },
      timestamp: now,
    };
    item.structuredData = { ...updatedStructuredData };
    item.isReviewed = true;
    item.reviewedBy = reviewerName;
    item.reviewedAt = now;
  }

  try {
    await supabase
      .from('ocr_results')
      .update({
        structured_data: updatedStructuredData,
        is_reviewed: true,
        reviewed_at: now,
        corrections: {
          updated: updatedStructuredData,
          reviewer: reviewerName,
          timestamp: now,
        },
      })
      .eq('id', ocrId);
  } catch (err) {
    console.warn('Supabase OCR review update notice:', err);
  }

  return item || { id: ocrId, structuredData: updatedStructuredData, isReviewed: true };
}

/**
 * Fetch all OCR scan logs
 * @param {string} [projectId]
 * @returns {Promise<Array>}
 */
export async function getOcrResults(projectId) {
  try {
    let query = supabase.from('ocr_results').select('*').order('created_at', { ascending: false });
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((d) => ({
        id: d.id,
        projectId: d.project_id,
        evidenceId: d.evidence_id,
        documentType: d.document_type,
        rawText: d.raw_text,
        structuredData: d.structured_data,
        confidenceScore: Number(d.confidence_score),
        confidenceLevel: d.confidence_level,
        engine: d.engine,
        isReviewed: d.is_reviewed,
        reviewedBy: d.reviewed_by,
        reviewedAt: d.reviewed_at,
        corrections: d.corrections || {},
        createdAt: d.created_at,
      }));
    }
  } catch (err) {
    console.warn('Using local OCR memory cache:', err);
  }

  if (projectId) {
    return inMemoryOcrResults.filter((r) => r.projectId === projectId);
  }
  return inMemoryOcrResults;
}
