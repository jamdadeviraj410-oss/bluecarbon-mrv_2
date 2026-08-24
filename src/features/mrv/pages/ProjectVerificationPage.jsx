import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MRV_DATA } from '../data/mockMrv';
import { getProjectById } from '../../../services/projectService';
import { getVerificationWorkspace, reviewVerification } from '../../../services/mrvService';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import Card, { CardHeader } from '../../../components/common/Card';

export default function ProjectVerificationPage() {
  const { verificationId } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [details, setDetails] = useState(MRV_DATA.projectDetails);
  const [metrics, setMetrics] = useState(MRV_DATA.claimedMetrics);
  const [checklist, setChecklist] = useState(MRV_DATA.protocolChecklist);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const activeId = verificationId || 'PRJ-2023-089';

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const prj = await getProjectById(activeId);
        const ws = await getVerificationWorkspace(activeId);

        if (isMounted) {
          if (prj) {
            setDetails({
              id: prj.id,
              name: prj.name,
              type: prj.type,
              status: prj.status,
            });
            setMetrics({
              carbonSequestration: prj.estCO2e?.toLocaleString() || '14,200',
              restorationArea: prj.area?.toString() || '128.0',
              treeDensity: prj.metadata?.treeDensity?.toString() || '1,800',
            });
          }
          if (ws?.caseDetails?.checklist && ws.caseDetails.checklist.length > 0) {
            setChecklist(ws.caseDetails.checklist);
          }
        }
      } catch (err) {
        console.error('Error loading project verification page:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeId]);

  const handleVerificationDecision = async (decision) => {
    setIsSubmitting(true);
    try {
      const ws = await getVerificationWorkspace(activeId);
      if (ws?.caseDetails?.dbId) {
        await reviewVerification(ws.caseDetails.dbId, decision, decisionNotes);
      }
      setDetails((prev) => ({ ...prev, status: decision === 'APPROVE' ? 'Verified' : 'Rejected' }));
      setStatusMessage(`Decision '${decision}' has been recorded in the MRV ledger.`);
      setDecisionModalOpen(false);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error('Error submitting verification decision:', err);
      setStatusMessage('Failed to record verification decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-surface flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full font-body-md text-on-surface">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono-data text-on-surface-variant mb-3">
        <Link to="/mrv" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>MRV VERIFICATION</span>
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold truncate">{details.id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-outline-variant/30 pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-xs font-mono-data text-on-surface-variant uppercase tracking-wider bg-surface-container px-2.5 py-1 rounded-md">
              Project ID: {details.id}
            </span>
            <span className="text-xs font-mono-data text-on-surface-variant uppercase tracking-wider bg-surface-container px-2.5 py-1 rounded-md">
              MRV Type: {details.type}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold tracking-tight break-words">
              {details.name}
            </h1>
            <StatusBadge status={details.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            icon="cloud_download"
            onClick={() => alert(`Downloading MRV data package for ${details.id}...`)}
          >
            Data Package
          </Button>
          <Button
            variant="primary"
            icon="gavel"
            onClick={() => setDecisionModalOpen(true)}
          >
            Verification Decision
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 bg-secondary-container/20 border border-secondary/30 text-secondary rounded-xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">verified</span>
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 bg-surface-container p-1 rounded-xl w-fit mb-6 border border-outline-variant/20">
        {['Overview', 'GIS/Drone Data', 'Sensor Logs', 'Blockchain Audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-surface text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
            {tab === 'Blockchain Audit' && (
              <span className="material-symbols-outlined text-[14px] ml-1 align-middle">lock</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
        {/* Left Column: Metrics & Imagery Reconciliation */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Claimed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card accentTop="primary">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Carbon Sequestration</span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary font-mono-data">{metrics.carbonSequestration}</span>
                <span className="text-xs font-semibold text-on-surface-variant">tCO2e</span>
              </div>
            </Card>
            <Card accentTop="secondary">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Restoration Area</span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-secondary font-mono-data">{metrics.restorationArea}</span>
                <span className="text-xs font-semibold text-on-surface-variant">Hectares</span>
              </div>
            </Card>
            <Card accentTop="tertiary">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Tree Density</span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-[#00abc1] font-mono-data">{metrics.treeDensity}</span>
                <span className="text-xs font-semibold text-on-surface-variant">stems/ha</span>
              </div>
            </Card>
          </div>

          {/* Map/Imagery Area */}
          <Card padding="none" className="overflow-hidden min-h-[400px] flex items-center justify-center relative bg-[#001e40]">
            {/* GIS background */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#00abc1_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="z-10 flex flex-col items-center text-on-primary">
              <span className="material-symbols-outlined text-5xl mb-2 text-[#00abc1] opacity-80">map</span>
              <span className="font-title-md font-semibold text-sm">GIS/Drone Multispectral Workspace</span>
              <span className="text-xs font-mono-data opacity-60 mt-1">Bounding Box: 11.4285° N, 79.7912° E</span>
            </div>
            
            <div className="absolute top-4 left-4 bg-surface-container-lowest/95 backdrop-blur-md p-4 rounded-xl border border-outline-variant/30 shadow-md">
              <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2.5">Layer Control</h4>
              <div className="flex flex-col gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary w-3.5 h-3.5 accent-primary" />
                  <span className="text-on-surface font-medium">Claimed Polygon (KML)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary w-3.5 h-3.5 accent-primary" />
                  <span className="text-on-surface font-medium">Drone Orthomosaic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary w-3.5 h-3.5 accent-primary" />
                  <span className="text-on-surface font-medium">NDVI Biomass Filter</span>
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Protocol Checklist */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Protocol Checklist"
              subtitle="NCCR Coastal Standard criteria"
            />
            <div className="flex flex-col gap-3">
              {checklist.map((item) => (
                <div key={item.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono-data text-on-surface-variant font-bold">{item.id}</span>
                    <StatusBadge status={item.status} showDot={false} />
                  </div>
                  <h4 className="font-title-md text-xs font-semibold text-on-surface m-0">{item.title}</h4>
                  <p className="font-body-md text-[11px] text-on-surface-variant mt-1 m-0">{item.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Verification Decision Modal */}
      {decisionModalOpen && (
        <div className="fixed inset-0 bg-on-surface/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant/30 animate-scale-up">
            <h3 className="font-headline-md text-lg font-bold text-primary mb-1">Record Verification Decision</h3>
            <p className="font-body-md text-xs text-on-surface-variant mb-4">
              Submit your formal auditor assessment for {details.name}.
            </p>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Auditor comments, risk buffer allocations, and methodology notes..."
              rows={4}
              className="w-full p-3 bg-surface border border-outline-variant rounded-xl text-sm font-body-md text-on-surface mb-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
            />
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setDecisionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleVerificationDecision('REJECT')}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Reject MRV
              </Button>
              <Button
                variant="primary"
                onClick={() => handleVerificationDecision('APPROVE')}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                icon="verified"
              >
                Approve & Verify
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

