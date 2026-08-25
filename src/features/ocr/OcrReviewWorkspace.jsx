import { useState, useRef } from 'react';
import {
  SAMPLE_OCR_DOCUMENTS,
  performOcrScan,
  extractStructuredMrvData,
  saveOcrResult,
  saveOcrReview,
} from '../../services/ocrService';

const EMPTY_FORM_DATA = {
  projectId: '',
  date: '',
  area: '',
  areaUnit: 'Hectares',
  species: '',
  plantCount: '',
  carbonValue: '',
  carbonUnit: 'tCO2e',
  location: '',
  referenceNumber: '',
  organization: '',
  signatory: '',
};

export default function OcrReviewWorkspace({ projectId = 'PRJ-2023-089' }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [confidenceLevel, setConfidenceLevel] = useState(null);
  const [ocrEngine, setOcrEngine] = useState('Tesseract.js v5');
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('structured'); // 'structured' | 'raw' | 'review'

  // Editable structured fields - clean empty state on initial load
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  const [auditorName, setAuditorName] = useState('Dr. A. Sharma (Auditor)');
  const [savedRecords, setSavedRecords] = useState([]);
  const fileInputRef = useRef(null);

  const hasProcessedResult = Boolean(selectedDoc && rawOcrText);

  const handleSelectSample = (sample) => {
    // Clear previous state immediately before setting new selection
    setSelectedDoc(sample);
    setRawOcrText('');
    setFormData(EMPTY_FORM_DATA);
    setConfidenceScore(null);
    setConfidenceLevel(null);

    // Extract structured data from selected sample
    const result = extractStructuredMrvData(sample.rawText, sample.confidence || 85);
    setRawOcrText(sample.rawText);
    setFormData(result.structured);
    setConfidenceScore(result.confidenceScore);
    setConfidenceLevel(result.confidenceLevel);
    setNotification({
      type: 'info',
      message: `Loaded sample "${sample.name}" with ${result.confidenceLevel} confidence (${result.confidenceScore}%).`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRunOcr = async () => {
    if (!rawOcrText && !selectedDoc) {
      setNotification({
        type: 'error',
        message: 'No document loaded. Please upload an image or select a sample document first.',
      });
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    setScanning(true);
    setScanProgress(10);
    setScanStatus('Initializing OCR worker & loading neural models...');

    try {
      const result = await performOcrScan(rawOcrText, ({ progress, status }) => {
        setScanProgress(progress);
        setScanStatus(status);
      });

      setRawOcrText(result.rawText);
      setFormData(result.structuredData);
      setConfidenceScore(result.confidenceScore);
      setConfidenceLevel(result.confidenceLevel);
      setOcrEngine(result.engine);

      setNotification({
        type: 'success',
        message: `OCR Scan completed successfully (${result.confidenceScore}% confidence, ${result.confidenceLevel} tier).`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('OCR run error:', err);
      setNotification({
        type: 'error',
        message: 'OCR execution encountered an error. Reverted to previous buffer.',
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers onChange
    e.target.value = '';

    // Clear prior state immediately
    setSelectedDoc(null);
    setRawOcrText('');
    setFormData(EMPTY_FORM_DATA);
    setConfidenceScore(null);
    setConfidenceLevel(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      setScanning(true);
      setScanStatus(`Processing uploaded file "${file.name}" with Tesseract.js...`);
      setScanProgress(20);

      try {
        const result = await performOcrScan(dataUrl, ({ progress, status }) => {
          setScanProgress(progress);
          setScanStatus(status);
        });

        setSelectedDoc({
          id: `upload-${Date.now()}`,
          name: file.name,
          type: 'FIELD_REPORT',
          date: new Date().toISOString().split('T')[0],
          rawText: result.rawText,
          confidence: result.confidenceScore,
        });

        setRawOcrText(result.rawText);
        setFormData(result.structuredData);
        setConfidenceScore(result.confidenceScore);
        setConfidenceLevel(result.confidenceLevel);
        setOcrEngine(result.engine);

        setNotification({
          type: 'success',
          message: `File scanned: Extracted ${result.confidenceScore}% confidence fields from "${file.name}".`,
        });
        setTimeout(() => setNotification(null), 4000);
      } catch (err) {
        console.error('Custom file scan error:', err);
        setSelectedDoc(null);
        setRawOcrText('');
        setFormData(EMPTY_FORM_DATA);
        setConfidenceScore(null);
        setConfidenceLevel(null);
        setNotification({
          type: 'error',
          message: `Failed to process "${file.name}" with OCR engine. Please verify the image file and try again.`,
        });
        setTimeout(() => setNotification(null), 4000);
      } finally {
        setScanning(false);
      }
    };
    reader.onerror = () => {
      setSelectedDoc(null);
      setRawOcrText('');
      setFormData(EMPTY_FORM_DATA);
      setConfidenceScore(null);
      setConfidenceLevel(null);
      setScanning(false);
      setNotification({
        type: 'error',
        message: `Failed to read file "${file.name}".`,
      });
      setTimeout(() => setNotification(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirmAndSave = async () => {
    if (!hasProcessedResult) return;

    try {
      const saved = await saveOcrResult({
        projectId,
        documentType: selectedDoc?.type || 'FIELD_REPORT',
        rawText: rawOcrText,
        structuredData: formData,
        confidenceScore: confidenceScore || 0,
        confidenceLevel: confidenceLevel || 'LOW',
        engine: ocrEngine,
      });

      await saveOcrReview(saved.id, formData, auditorName);

      setSavedRecords((prev) => [
        {
          id: saved.id,
          name: selectedDoc?.name || 'Evidence Document',
          timestamp: new Date().toLocaleTimeString(),
          status: 'Auditor Confirmed',
          confidence: confidenceScore,
        },
        ...prev,
      ]);

      setNotification({
        type: 'success',
        message: 'Auditor Confirmation Recorded! OCR structured data permanently logged to MRV ledger.',
      });
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error('Error saving review:', err);
      setNotification({
        type: 'error',
        message: 'Failed to record auditor confirmation.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
        <span className="material-symbols-outlined text-amber-600 text-[22px] mt-0.5">verified_user</span>
        <div className="flex-1 text-sm">
          <div className="font-bold flex items-center gap-2">
            <span>Decision Support Protocol (MRV Standard)</span>
            <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded font-mono font-bold">
              HUMAN AUDITOR CONFIRMATION MANDATORY
            </span>
          </div>
          <p className="mt-0.5 text-amber-800 text-xs leading-relaxed">
            Tesseract.js extracts key entities from paper records. OCR confidence scores are decision support signals.
            <strong> Under no circumstances will OCR outputs automatically approve carbon credit issuance without certified auditor review.</strong>
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Grid: Document Selector & Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Sample Documents & File Ingestion */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">document_scanner</span>
                Evidence Ingestion
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-primary-container text-on-primary hover:bg-primary px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Upload Image
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-3">
              Select pre-loaded MRV evidence documents or upload custom field receipts for neural OCR extraction:
            </p>

            <div className="space-y-2">
              {SAMPLE_OCR_DOCUMENTS.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectSample(doc)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/60 hover:border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span className={`material-symbols-outlined p-2 rounded-lg text-[20px] ${
                      isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {doc.thumbnail}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-on-surface truncate">{doc.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          doc.confidence >= 90
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.confidence >= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {doc.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OCR Engine Telemetry */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Engine Status</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Active Model:</span>
                <span className="font-mono font-bold text-on-surface">{ocrEngine}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Language:</span>
                <span className="font-mono text-on-surface">eng + Latin Botanicals</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Confidence Tier:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  confidenceLevel === 'HIGH'
                    ? 'bg-emerald-100 text-emerald-800'
                    : confidenceLevel === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : confidenceLevel === 'LOW'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {confidenceLevel ? `${confidenceLevel} (${confidenceScore}%)` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Preprocessing:</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Contrast & Binarization
                </span>
              </div>
            </div>

            <button
              onClick={handleRunOcr}
              disabled={scanning || !hasProcessedResult}
              className="w-full mt-2 bg-primary text-on-primary hover:bg-primary-container py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${scanning ? 'animate-spin' : ''}`}>
                {scanning ? 'autorenew' : 'play_circle'}
              </span>
              {scanning ? 'Running Tesseract Neural OCR...' : 'Re-scan with Neural OCR'}
            </button>

            {scanning && (
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-[11px] text-on-surface-variant font-mono">
                  <span>{scanStatus}</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Side-by-Side Reviewer & Form */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Header Tabs */}
            <div className="bg-surface-container-low px-6 py-3 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('structured')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'structured'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Structured Review & Edit
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'raw'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">terminal</span>
                  Raw Extracted OCR Text
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant">Confidence:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  confidenceScore !== null && confidenceScore >= 90
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : confidenceScore !== null && confidenceScore >= 60
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : confidenceScore !== null
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant'
                }`}>
                  {confidenceLevel ? `${confidenceLevel} (${confidenceScore}%)` : 'No Document Loaded'}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {activeTab === 'raw' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <span>Direct text output from OCR buffer:</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(rawOcrText)}
                      disabled={!rawOcrText}
                      className="text-primary hover:underline flex items-center gap-1 disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      Copy Buffer
                    </button>
                  </div>
                  <textarea
                    value={rawOcrText}
                    placeholder="No OCR document processed yet. Please upload an image or select a sample document from the left panel to view raw extracted text."
                    onChange={(e) => {
                      setRawOcrText(e.target.value);
                      const res = extractStructuredMrvData(e.target.value, confidenceScore || 80);
                      setFormData(res.structured);
                    }}
                    rows={14}
                    className="w-full font-mono text-xs p-4 bg-gray-900 text-emerald-400 rounded-xl border border-gray-700 focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-500"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Project ID / Code
                      </label>
                      <input
                        type="text"
                        value={formData.projectId || ''}
                        onChange={(e) => handleFieldChange('projectId', e.target.value)}
                        className="w-full text-xs font-mono font-bold p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="e.g. PRJ-2023-089"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Evidence / Survey Date
                      </label>
                      <input
                        type="text"
                        value={formData.date || ''}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                        className="w-full text-xs p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="e.g. 14 Aug 2026"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Verified Restoration Area (ha)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.area || ''}
                          onChange={(e) => handleFieldChange('area', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-bold p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none pr-12"
                          placeholder="128.00"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-on-surface-variant font-mono">
                          Hectares
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Calculated Sequestration (tCO2e)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.carbonValue || ''}
                          onChange={(e) => handleFieldChange('carbonValue', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-bold p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none pr-12"
                          placeholder="14200"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-on-surface-variant font-mono">
                          tCO2e
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Endemic Species Identified
                      </label>
                      <input
                        type="text"
                        value={formData.species || ''}
                        onChange={(e) => handleFieldChange('species', e.target.value)}
                        className="w-full text-xs p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="e.g. Avicennia marina, Rhizophora mucronata"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Plantation Count / Saplings
                      </label>
                      <input
                        type="number"
                        value={formData.plantCount || ''}
                        onChange={(e) => handleFieldChange('plantCount', parseInt(e.target.value, 10) || 0)}
                        className="w-full text-xs p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="142000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Audit Certificate / Reference #
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNumber || ''}
                        onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                        className="w-full text-xs font-mono p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="e.g. NCCR-26-842"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Issuing Authority / Organization
                      </label>
                      <input
                        type="text"
                        value={formData.organization || ''}
                        onChange={(e) => handleFieldChange('organization', e.target.value)}
                        className="w-full text-xs p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="e.g. National Centre for Coastal Research (NCCR)"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Geographic Zone / Coordinates
                      </label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        className="w-full text-xs p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="e.g. Ratnagiri Coastal Belt, Maharashtra (16.9902 N, 73.3120 E)"
                      />
                    </div>
                  </div>

                  {/* Auditor Review Sign-off Section */}
                  <div className="border-t border-outline-variant pt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined text-[20px]">badge</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface">Auditor Certification Sign-off</div>
                        <input
                          type="text"
                          value={auditorName}
                          onChange={(e) => setAuditorName(e.target.value)}
                          className="text-xs text-on-surface-variant bg-transparent border-b border-outline-variant focus:outline-none font-medium mt-0.5"
                          placeholder="Auditor Name & Credentials"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmAndSave}
                      disabled={!hasProcessedResult || scanning}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Confirm & Sign-Off OCR Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit History Log */}
          {savedRecords.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">history</span>
                Session Auditor Confirmations
              </h4>
              <div className="divide-y divide-outline-variant/40 text-xs">
                {savedRecords.map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-on-surface">{rec.name}</span>
                      <span className="text-on-surface-variant ml-2">({rec.timestamp})</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      {rec.status} ({rec.confidence}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
