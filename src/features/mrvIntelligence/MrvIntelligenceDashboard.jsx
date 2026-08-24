import { useState } from 'react';
import OcrReviewWorkspace from '../ocr/OcrReviewWorkspace';
import SensorRegistryView from '../sensors/SensorRegistryView';
import DroneBeforeAfterView from '../drone/DroneBeforeAfterView';
import MrvAnomalyMatrix from './MrvAnomalyMatrix';

export default function MrvIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState('anomalies'); // 'anomalies' | 'ocr' | 'sensors' | 'drone'
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-2023-089');

  const projectsList = [
    { id: 'PRJ-2023-089', name: 'Maharashtra Mangrove Restoration', area: '128.0 ha' },
    { id: 'M-78392-BD', name: 'Sundarbans Sector B-14 Restoration', area: '185.4 ha' },
    { id: 'PRJ-2024-012', name: 'Pichavaram Estuarine Conservation', area: '94.5 ha' },
  ];

  return (
    <div className="flex-1 bg-surface flex flex-col min-h-screen p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-xs font-bold text-on-primary bg-primary px-2.5 py-1 rounded">
              MRV INTELLIGENCE & FIELD DATA ENGINE
            </span>
            <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded">
              Role: Member 2 Subsystem
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
              Active Neural Models & Telemetry
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            MRV Field Intelligence & Multi-Source Verification
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Automated Cross-Verification, Tesseract.js OCR Extractions, IoT Sensor Ingestion, and UAV Photogrammetry Analysis.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-3 self-stretch xl:self-auto">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Selected Project
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-bold p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none shadow-xs mt-0.5"
            >
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Workspaces Navigation Tabs */}
      <div className="flex gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant shadow-inner overflow-x-auto">
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'anomalies'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">troubleshoot</span>
          <span>1. MRV Anomaly & Risk Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ocr'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">document_scanner</span>
          <span>2. Smart OCR Evidence Reviewer</span>
        </button>

        <button
          onClick={() => setActiveTab('sensors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'sensors'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">sensors</span>
          <span>3. IoT Sensor Fleet & Live Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('drone')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'drone'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
          <span>4. Drone Surveys & Before/After</span>
        </button>
      </div>

      {/* Active Tab Workspace Container */}
      <div className="transition-all duration-200">
        {activeTab === 'anomalies' && <MrvAnomalyMatrix projectId={selectedProjectId} />}
        {activeTab === 'ocr' && <OcrReviewWorkspace projectId={selectedProjectId} />}
        {activeTab === 'sensors' && <SensorRegistryView projectId={selectedProjectId} />}
        {activeTab === 'drone' && <DroneBeforeAfterView projectId={selectedProjectId} />}
      </div>
    </div>
  );
}
