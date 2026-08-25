import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MRV_DATA } from '../data/mockMrv';
import { getVerificationWorkspace, reviewVerification } from '../../../services/mrvService';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import Card, { CardHeader } from '../../../components/common/Card';

export default function MrvVerificationWorkspacePage() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workspaceData, setWorkspaceData] = useState(MRV_DATA.workspace);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [verificationCase, setVerificationCase] = useState(null);

  const activeProjectId = projectId || 'PRJ-2023-089';

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getVerificationWorkspace(activeProjectId);
        if (isMounted && data) {
          if (data.caseDetails) {
            setVerificationCase(data.caseDetails);
            setWorkspaceData((prev) => ({
              ...prev,
              id: activeProjectId,
              status: data.caseDetails.status,
              name: `Verification Workspace: ${activeProjectId}`,
              verificationSummary: {
                ...prev.verificationSummary,
                confidenceScore: data.caseDetails.confidenceScore,
                evidenceCompleteness: data.caseDetails.evidenceCompleteness,
                estimatedYield: data.caseDetails.estimatedYield,
                hash: data.caseDetails.hash,
              },
            }));
          }
          if (data.evidenceFiles && data.evidenceFiles.length > 0) {
            setEvidenceFiles(data.evidenceFiles);
          }
        }
      } catch (err) {
        console.error('Error loading MRV workspace:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const handleDecision = async (decision) => {
    if (!verificationCase?.dbId) {
      setActionSuccess(`Simulated decision: '${decision}' recorded.`);
      setTimeout(() => setActionSuccess(''), 4000);
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await reviewVerification(
        verificationCase.dbId,
        decision,
        `Auditor ${decision} action from Verification Workspace`
      );
      setVerificationCase(updated);
      setWorkspaceData((prev) => ({ ...prev, status: updated.status }));
      setActionSuccess(`MRV decision '${decision}' successfully recorded!`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to submit decision:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 bg-surface flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full font-body-md text-on-surface">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono-data text-on-surface-variant mb-3">
        <Link to="/mrv" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>MRV PIPELINE</span>
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold truncate">{activeProjectId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-outline-variant/30 pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <StatusBadge status={workspaceData.status} />
            <span className="text-xs font-mono-data text-on-surface-variant uppercase tracking-wider bg-surface-container px-2.5 py-1 rounded-md">
              Project ID: {workspaceData.id}
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold tracking-tight break-words">
            {workspaceData.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="danger"
            onClick={() => handleDecision('REJECT')}
            disabled={isProcessing}
            isLoading={isProcessing}
            icon="cancel"
          >
            Reject
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDecision('REQUEST_CHANGES')}
            disabled={isProcessing}
            icon="help_outline"
          >
            Request Clarification
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDecision('APPROVE')}
            disabled={isProcessing}
            isLoading={isProcessing}
            icon="verified"
          >
            Approve MRV
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-secondary-container/20 border border-secondary/30 text-secondary rounded-xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
        {/* Left Sidebar: Map Layers & Stats */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low">
              <h3 className="font-title-md text-sm font-bold text-on-surface uppercase tracking-wider m-0">
                Map Layers
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { name: 'Project Boundary', active: true },
                { name: 'Mangrove Plantation', active: true },
                { name: 'Drone Survey', active: true },
                { name: 'Ground Sensors', active: false, icon: 'sensors' },
                { name: 'Historical Imagery', active: false },
                { name: 'Carbon Sampling Points', active: false },
              ].map((layer, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    defaultChecked={layer.active}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface flex items-center gap-2">
                    {layer.name}
                    {layer.icon && (
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{layer.icon}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">
                  Total Area
                </span>
                <span className="font-mono-data font-bold text-on-surface text-sm">{workspaceData.totalArea}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">
                  Sensor Status
                </span>
                <span className="font-mono-data font-bold text-secondary text-sm">{workspaceData.sensorStatus}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle/Right: Workspace content */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex gap-1.5 bg-surface-container p-1 rounded-xl w-fit border border-outline-variant/20">
            {['Overview', 'Drone Data', 'Sensor Data', 'Carbon Calc'].map((tab) => (
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
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Main Data Area */}
            <div className="md:col-span-1 xl:col-span-2 flex flex-col gap-6">
              <Card>
                {activeTab === 'Overview' && (
                  <div>
                    <CardHeader
                      title="Baseline Ecological & Plot Overview"
                      subtitle="Ground-truth baseline survey and plot distribution"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Baseline Year</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">2023</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Canopy Cover</span>
                        <span className="font-mono-data font-semibold text-secondary text-sm">76.4%</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Mean Height</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">4.8 m</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Survival Rate</span>
                        <span className="font-mono-data font-semibold text-secondary text-sm">94.2%</span>
                      </div>
                    </div>

                    <div className="p-4 border border-secondary/20 bg-secondary-container/10 rounded-xl flex items-start gap-4 mb-4">
                      <div className="p-2.5 bg-secondary text-on-secondary rounded-xl shrink-0">
                        <span className="material-symbols-outlined text-[20px]">forest</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-title-md font-bold text-on-surface text-sm m-0">Endemic Mangrove Composition</h4>
                          <StatusBadge status="Verified" showDot={false} />
                        </div>
                        <p className="font-body-md text-xs text-on-surface-variant m-0">
                          Dominant taxa include Rhizophora mucronata (58%) and Avicennia marina (42%) across 12 monitoring quadrants.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Drone Data' && (
                  <div>
                    <CardHeader
                      title="Aerial & Drone Survey Analysis"
                      subtitle="Multispectral imagery and canopy height model metrics"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Flight Date</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">{workspaceData.droneData.flightDate}</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Resolution</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">{workspaceData.droneData.resolution}</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Captures</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">{workspaceData.droneData.imageCount}</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Coverage</span>
                        <span className="font-mono-data font-semibold text-secondary text-sm">{workspaceData.droneData.coverage}</span>
                      </div>
                    </div>

                    <div className="p-4 border border-secondary/20 bg-secondary-container/10 rounded-xl flex items-start gap-4 mb-4">
                      <div className="p-2.5 bg-secondary text-on-secondary rounded-xl shrink-0">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-title-md font-bold text-on-surface text-sm m-0">Computer Vision Canopy Check</h4>
                          <StatusBadge status="Verified" showDot={false} />
                        </div>
                        <p className="font-body-md text-xs text-on-surface-variant m-0">{workspaceData.aiAnalysis.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Sensor Data' && (
                  <div>
                    <CardHeader
                      title="In-Situ IoT & Porewater Telemetry"
                      subtitle="Continuous soil salinity, pH, and redox telemetry readings"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Salinity (ppt)</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">28.4 ppt</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Porewater pH</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">7.62</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Redox (Eh)</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">-142 mV</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Uptime</span>
                        <span className="font-mono-data font-semibold text-secondary text-sm">99.8%</span>
                      </div>
                    </div>

                    <div className="p-4 border border-primary/20 bg-primary-container/10 rounded-xl flex items-start gap-4 mb-4">
                      <div className="p-2.5 bg-primary text-on-primary rounded-xl shrink-0">
                        <span className="material-symbols-outlined text-[20px]">sensors</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-title-md font-bold text-on-surface text-sm m-0">IoT Sensor Array Health</h4>
                          <StatusBadge status="Active" showDot={false} />
                        </div>
                        <p className="font-body-md text-xs text-on-surface-variant m-0">
                          8 solar-powered field loggers transmitting hourly LoRaWAN packets to coastal gateway node.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Carbon Calc' && (
                  <div>
                    <CardHeader
                      title="IPCC Tier 3 Biomass & SOC Accounting"
                      subtitle="Allometric equations and soil organic carbon sequestration yield"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">AGB Carbon</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">48.2 tC/ha</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">BGB Carbon</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">24.1 tC/ha</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">SOC (0-1m)</span>
                        <span className="font-mono-data font-semibold text-on-surface text-sm">184.6 tC/ha</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">Net CO2e</span>
                        <span className="font-mono-data font-semibold text-secondary text-sm">14,200 tCO2e</span>
                      </div>
                    </div>

                    <div className="p-4 border border-secondary/20 bg-secondary-container/10 rounded-xl flex items-start gap-4 mb-4">
                      <div className="p-2.5 bg-secondary text-on-secondary rounded-xl shrink-0">
                        <span className="material-symbols-outlined text-[20px]">calculate</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-title-md font-bold text-on-surface text-sm m-0">Methodology Verra VM0033</h4>
                          <StatusBadge status="Verified" showDot={false} />
                        </div>
                        <p className="font-body-md text-xs text-on-surface-variant m-0">
                          Conservativeness deduction applied (-5.0%) with 95% statistical confidence bounds.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {evidenceFiles.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-outline-variant/20">
                    <h4 className="font-title-md text-sm font-bold text-on-surface mb-3">Linked Evidence Files ({evidenceFiles.length})</h4>
                    <div className="flex flex-col gap-2">
                      {evidenceFiles.map((ef) => (
                        <div key={ef.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl text-sm border border-outline-variant/20">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">attachment</span>
                            <span className="font-medium text-on-surface">{ef.name}</span>
                          </div>
                          <StatusBadge status={ef.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Audit trail */}
              <Card>
                <CardHeader
                  title="Verification Audit Trail"
                  subtitle="Chain of custody and review events"
                />
                <div className="relative pl-6 border-l-2 border-outline-variant/40 flex flex-col gap-6 ml-2 mt-2">
                  {workspaceData.auditTrail.map((step, idx) => (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-surface ${
                        step.status === 'completed' ? 'border-secondary bg-secondary' : 'border-primary'
                      }`}></span>
                      <h4 className="font-title-md text-sm font-semibold text-on-surface m-0">{step.step}</h4>
                      <p className="font-mono-data text-xs text-on-surface-variant mt-0.5 m-0">
                        {step.date && `${step.date} • `}{step.actor || step.assigner || step.status}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Verification summary card */}
            <div className="md:col-span-1 xl:col-span-1 flex flex-col gap-6">
              <Card accentTop="primary">
                <CardHeader
                  title="Verification Summary"
                  subtitle="Key ecological and audit metrics"
                />
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">Confidence Score</span>
                    <span className="font-mono-data text-base font-bold text-secondary">{workspaceData.verificationSummary.confidenceScore}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">Completeness</span>
                    <span className="font-mono-data text-base font-bold text-on-surface">{workspaceData.verificationSummary.evidenceCompleteness}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">Estimated Yield</span>
                    <span className="font-mono-data text-base font-bold text-primary">{workspaceData.verificationSummary.estimatedYield} tCO2e</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">Verification Hash</span>
                    <span className="font-mono-data text-xs text-on-surface bg-surface-container px-2.5 py-1.5 rounded-lg truncate border border-outline-variant/20">
                      {workspaceData.verificationSummary.hash}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

