import { useState } from 'react';
import { resolveGovernanceAlert } from '../services/governanceService';

export default function GovernanceAlertActionModal({ alert, isOpen, onClose, onRefresh }) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState('RESOLVED'); // 'RESOLVED', 'INVESTIGATING', 'DISMISSED'
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen || !alert) return null;

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      setMsg({ type: 'error', text: 'Please add resolution findings or notes.' });
      return;
    }
    setIsProcessing(true);
    try {
      await resolveGovernanceAlert(alert.id, resolutionNotes, targetStatus);
      setMsg({ type: 'success', text: `Alert ${alert.alert_code} marked as ${targetStatus}.` });
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update alert.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-error/15 text-error border-error/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
      default:
        return 'bg-gray-500/15 text-gray-600 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-on-surface text-[18px] font-bold">{alert.title}</h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono-data text-xs text-on-surface-variant">{alert.alert_code}</span>
                <span className="text-outline text-xs">•</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${getSeverityBadge(alert.severity)}`}>
                  {alert.severity}
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="text-xs text-on-surface-variant">{alert.category}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {msg && (
            <div className={`p-3 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-secondary/15 text-secondary' : 'bg-error/15 text-error'}`}>
              {msg.text}
            </div>
          )}

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Anomaly & Event Description</div>
            <p className="text-sm text-on-surface leading-relaxed">{alert.description}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-on-surface-variant font-mono-data">
              <span>Entity: {alert.entity_type} ({alert.entity_id})</span>
              <span>Reported: {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Recent'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Update Action / Resolution</label>
            <div className="flex gap-2">
              {[
                { id: 'RESOLVED', label: 'Mark Resolved (Verified Normal)', icon: 'check_circle', color: 'text-secondary' },
                { id: 'INVESTIGATING', label: 'Assign Field Auditor', icon: 'person_search', color: 'text-primary' },
                { id: 'DISMISSED', label: 'Dismiss as False Positive', icon: 'do_not_disturb', color: 'text-on-surface-variant' },
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => setTargetStatus(act.id)}
                  className={`flex-1 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    targetStatus === act.id
                      ? 'bg-primary-container text-on-primary-container border-primary shadow-sm'
                      : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${act.color}`}>{act.icon}</span>
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Resolution Report / Audit Note</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Detail the technical investigation findings, field inspection result, or corrective action..."
              rows={3}
              className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={isProcessing}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-on-primary flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            {isProcessing ? 'Updating...' : 'Save & Close Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}
