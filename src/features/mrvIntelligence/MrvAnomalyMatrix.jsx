import { useState, useEffect, useCallback } from 'react';
import {
  runMrvAnomalyAudit,
  resolveAnomaly,
} from '../../services/mrvRiskService';

export default function MrvAnomalyMatrix({ projectId = 'PRJ-2023-089' }) {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeverityFilter, setActiveSeverityFilter] = useState('ALL');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [auditorName, setAuditorName] = useState('Dr. A. Sharma (Lead Auditor)');
  const [isAuditing, setIsAuditing] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const data = await runMrvAnomalyAudit(projectId);
      setAuditData(data);
    } catch (err) {
      console.error('Failed to run anomaly audit:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await runMrvAnomalyAudit(projectId);
        if (isMounted) setAuditData(data);
      } catch (err) {
        console.error('Failed to run anomaly audit:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleRunFreshAudit = async () => {
    setIsAuditing(true);
    try {
      const data = await runMrvAnomalyAudit(projectId);
      setAuditData(data);
      setNotification({
        type: 'success',
        message: `Multi-Source Cross-Audit Completed: Risk Score ${data.overallScore}/100 (${data.riskLevel}).`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleResolveAnomaly = async (e) => {
    e.preventDefault();
    if (!selectedAnomaly) return;

    try {
      await resolveAnomaly(selectedAnomaly.id, resolutionNotes, auditorName);
      setNotification({
        type: 'success',
        message: `Anomaly ${selectedAnomaly.anomalyCode} marked as RESOLVED by ${auditorName}.`,
      });
      setSelectedAnomaly(null);
      setResolutionNotes('');
      fetchAudit();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to resolve anomaly:', err);
    }
  };

  if (loading || !auditData) {
    return (
      <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[36px] animate-spin text-primary">autorenew</span>
        <span className="text-sm font-medium">Running Multi-Source MRV Anomaly Engine...</span>
      </div>
    );
  }

  const { overallScore, riskLevel, summary, anomalies, crossChecks } = auditData;

  const filteredAnomalies = activeSeverityFilter === 'ALL'
    ? anomalies
    : anomalies.filter((a) => a.severity === activeSeverityFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black font-mono text-lg shadow-sm ${
            riskLevel === 'LOW'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : riskLevel === 'MEDIUM'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-rose-100 text-rose-900 border border-rose-300'
          }`}>
            {overallScore}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Composite MRV Risk Score: {overallScore} / 100
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                riskLevel === 'LOW'
                  ? 'bg-emerald-100 text-emerald-800'
                  : riskLevel === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {riskLevel} RISK LEVEL
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Automated multi-source cross-verification against Claimed Registry, OCR Evidence, Drone UAV Polygons, and IoT Telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunFreshAudit}
          disabled={isAuditing}
          className="w-full md:w-auto px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${isAuditing ? 'animate-spin' : ''}`}>
            {isAuditing ? 'autorenew' : 'troubleshoot'}
          </span>
          {isAuditing ? 'Executing Cross-Audit...' : 'Run Deep Anomaly Audit'}
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl text-sm flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Cross-Verification Checks Matrix */}
      <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
            Multi-Source Cross-Verification Matrix
          </h4>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {summary.crossChecksPassed} / {summary.crossChecksTotal} Passed Integrity Check
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {crossChecks.map((check) => {
            const isPassed = check.status === 'PASSED';
            const isWarning = check.status === 'WARNING';
            return (
              <div
                key={check.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPassed
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : isWarning
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-rose-200 bg-rose-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-on-surface">{check.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    isPassed
                      ? 'bg-emerald-100 text-emerald-800'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {check.status}
                  </span>
                </div>

                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-2">
                  {check.details}
                </p>

                <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[10px] text-on-surface-variant">
                  <span>Confidence: <strong className="text-on-surface">{check.confidence}%</strong></span>
                  <span className="font-mono">{check.variance.slice(0, 24)}...</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Anomalies & Remediation Actions */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden space-y-4">
        {/* Header & Filter */}
        <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">warning</span>
              Active MRV Anomalies ({anomalies.length})
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Itemized discrepancies requiring auditor review or mitigation actions prior to credit issuance.
            </p>
          </div>

          <div className="flex gap-1.5 bg-surface-container p-1 rounded-lg border border-outline-variant">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setActiveSeverityFilter(sev)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  activeSeverityFilter === sev
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Anomalies List */}
        <div className="p-6 pt-0 divide-y divide-outline-variant/40">
          {filteredAnomalies.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[32px]">task_alt</span>
              <span>No active anomalies found for the selected severity filter.</span>
            </div>
          ) : (
            filteredAnomalies.map((anom) => (
              <div key={anom.id} className="py-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary">{anom.anomalyCode}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      anom.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : anom.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : anom.severity === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {anom.severity} SEVERITY
                    </span>
                    <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded">
                      {anom.type}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAnomaly(anom);
                      setResolutionNotes(anom.resolutionNotes || '');
                    }}
                    className="px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[16px] text-emerald-700">gavel</span>
                    Resolve / Auditor Sign-off
                  </button>
                </div>

                <div className="font-bold text-xs text-on-surface">{anom.title}</div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{anom.description}</p>

                <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/40 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                  <div>
                    <span className="font-bold text-on-surface">Suggested Mitigation: </span>
                    <span className="text-on-surface-variant">{anom.suggestedAction}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auditor Resolution Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-lg w-full min-w-[320px] border border-outline-variant shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface">
                  Auditor Resolution & Mitigation Sign-Off
                </h3>
                <span className="font-mono text-xs text-primary font-bold">{selectedAnomaly.anomalyCode}</span>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="text-on-surface-variant hover:text-on-surface text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveAnomaly} className="space-y-4 text-xs">
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/60">
                <div className="font-bold text-on-surface mb-1">{selectedAnomaly.title}</div>
                <div className="text-on-surface-variant">{selectedAnomaly.description}</div>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Certifying Lead Auditor Name & Credentials
                </label>
                <input
                  type="text"
                  required
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Auditor Mitigation Notes & Resolution Findings
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail why this discrepancy is acceptable, corrected, or mitigated in accordance with Blue Carbon MRV protocol..."
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Mark as Resolved & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
