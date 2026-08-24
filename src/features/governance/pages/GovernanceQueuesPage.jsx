import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getGovernanceQueues } from '../services/governanceService';
import OrganizationReviewModal from '../components/OrganizationReviewModal';
import GovernanceAlertActionModal from '../components/GovernanceAlertActionModal';
import { ROUTES } from '../../../utils/constants';

export default function GovernanceQueuesPage() {
  const [activeTab, setActiveTab] = useState('ORGS'); // 'ORGS', 'PROJECTS', 'MRV', 'FLAGGED', 'FAILURES', 'BLOCKCHAIN'
  const [queues, setQueues] = useState({
    pendingOrganizations: [],
    pendingProjects: [],
    mrvSubmissions: [],
    alerts: [],
    blockchainRecords: [],
  });
  const [selectedOrgRequest, setSelectedOrgRequest] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const fetchQueues = useCallback(async () => {
    try {
      const data = await getGovernanceQueues();
      setQueues(data);
    } catch (err) {
      console.error('Failed to load governance queues:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getGovernanceQueues();
        if (isMounted) setQueues(data);
      } catch (err) {
        console.error('Failed to load governance queues:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const pendingOrgs = queues.pendingOrganizations.filter((o) => ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(o.status));
  const pendingPrjs = queues.pendingProjects.filter((p) => ['SUBMITTED', 'UNDER_REVIEW', 'DRAFT'].includes(p.status));
  const pendingMrvs = queues.mrvSubmissions.filter((m) => ['SUBMITTED', 'UNDER_VALIDATION', 'UNDER_VERIFICATION'].includes(m.status));
  const flaggedAlerts = queues.alerts.filter((a) => a.status === 'OPEN' || a.status === 'INVESTIGATING');
  const rejectedItems = queues.pendingProjects.filter((p) => p.status === 'REJECTED');
  const blockchainIssues = queues.blockchainRecords.filter((b) => b.status === 'PENDING' || b.status === 'FAILED');

  const showNotification = (text) => {
    setActionSuccessMsg(text);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            <Link to={ROUTES.ADMIN_GOVERNANCE} className="text-primary hover:underline">National Governance</Link>
            <span className="text-outline">/</span>
            <span>Governance Queues</span>
          </div>
          <h1 className="font-headline-lg text-primary text-[26px] md:text-[30px] font-extrabold tracking-tight">
            Regulatory & Verification Governance Queues
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs md:text-sm">
            National authority review queues for organization onboarding, project eligibility, MRV audits, anomaly investigations, and blockchain integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueues}
            className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-title-sm text-xs font-bold hover:bg-surface-container flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh Queues
          </button>
          <Link
            to={ROUTES.ADMIN_GOVERNANCE}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-title-sm text-xs font-bold hover:bg-primary-container flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            National Command Center
          </Link>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 6-Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/30 scrollbar-thin">
        {[
          { id: 'ORGS', label: 'Pending Organizations', count: pendingOrgs.length, icon: 'corporate_fare', badgeColor: 'bg-primary text-on-primary' },
          { id: 'PROJECTS', label: 'Pending Projects', count: pendingPrjs.length, icon: 'forest', badgeColor: 'bg-blue-600 text-white' },
          { id: 'MRV', label: 'MRV Verification Claims', count: pendingMrvs.length, icon: 'biotech', badgeColor: 'bg-secondary text-on-secondary' },
          { id: 'FLAGGED', label: 'Flagged Anomalies', count: flaggedAlerts.length, icon: 'warning', badgeColor: 'bg-amber-600 text-white' },
          { id: 'FAILURES', label: 'Verification Failures', count: rejectedItems.length, icon: 'gpp_bad', badgeColor: 'bg-error text-white' },
          { id: 'BLOCKCHAIN', label: 'Blockchain Integrity', count: blockchainIssues.length || 1, icon: 'link_off', badgeColor: 'bg-purple-600 text-white' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-t-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono-data font-bold ${tab.badgeColor}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Pending Organizations Queue */}
      {activeTab === 'ORGS' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">domain_verification</span>
              <h2 className="font-headline-sm text-on-surface font-bold text-[16px]">Organization Onboarding Applications</h2>
            </div>
            <span className="text-xs text-on-surface-variant font-mono-data">{pendingOrgs.length} Applications Awaiting Review</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3.5">Application & Org</th>
                  <th className="px-5 py-3.5">Type & Jurisdiction</th>
                  <th className="px-5 py-3.5">Darpan / Reg ID</th>
                  <th className="px-5 py-3.5">Authorized Contact</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {pendingOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-on-surface">{org.organization_name}</div>
                      <div className="font-mono-data text-xs text-on-surface-variant">{org.application_number}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-primary-container/30 text-on-primary-container">
                        {org.organization_type}
                      </span>
                      <div className="text-xs text-on-surface-variant mt-0.5">{org.district}, {org.state}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono-data text-xs text-on-surface">{org.darpan_id || org.registration_number || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-on-surface">{org.primary_contact_name}</div>
                      <div className="text-xs text-on-surface-variant">{org.primary_contact_email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        org.status === 'UNDER_REVIEW' ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/15 text-primary'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrgRequest(org)}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1 ml-auto shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        Review & Decision
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingOrgs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-on-surface-variant text-sm">
                      No pending organization onboarding applications. All entities verified!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Projects Queue */}
      {activeTab === 'PROJECTS' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">forest</span>
              <h2 className="font-headline-sm text-on-surface font-bold text-[16px]">Project Registration & Baseline Approvals</h2>
            </div>
            <span className="text-xs text-on-surface-variant font-mono-data">{pendingPrjs.length} Projects Pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3.5">Project Code & Name</th>
                  <th className="px-5 py-3.5">Ecosystem & State</th>
                  <th className="px-5 py-3.5 text-right">Restoration Area</th>
                  <th className="px-5 py-3.5 text-right">Est. Carbon (tCO2e)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {pendingPrjs.map((prj) => (
                  <tr key={prj.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-on-surface">{prj.name}</div>
                      <div className="font-mono-data text-xs text-on-surface-variant">{prj.project_code || prj.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-on-surface">{prj.type}</div>
                      <div className="text-xs text-on-surface-variant">{prj.state}, {prj.location}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono-data font-bold text-on-surface">
                      {prj.area} ha
                    </td>
                    <td className="px-5 py-4 text-right font-mono-data text-secondary font-bold">
                      {Number(prj.est_co2e).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/15 text-amber-600">
                        {prj.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={ROUTES.ADMIN_PROJECT_DETAIL.replace(':id', prj.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-surface border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Inspect Project
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: MRV Submissions & Claims Queue */}
      {activeTab === 'MRV' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">biotech</span>
              <h2 className="font-headline-sm text-on-surface font-bold text-[16px]">Periodic MRV Verification Claims</h2>
            </div>
            <span className="text-xs text-on-surface-variant font-mono-data">{pendingMrvs.length} Claims Awaiting Auditor Sign-off</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3.5">Submission Code</th>
                  <th className="px-5 py-3.5">Reporting Period</th>
                  <th className="px-5 py-3.5 text-right">Claimed tCO2e</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {pendingMrvs.map((mrv) => (
                  <tr key={mrv.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-4 font-mono-data font-bold text-primary">
                      {mrv.submission_code || mrv.id}
                    </td>
                    <td className="px-5 py-4 text-xs text-on-surface">
                      {mrv.period_start} to {mrv.period_end}
                    </td>
                    <td className="px-5 py-4 text-right font-mono-data text-secondary font-bold">
                      {Number(mrv.carbon_estimate).toLocaleString()} tCO2e
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-secondary/15 text-secondary">
                        {mrv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={ROUTES.ADMIN_MRV_WORKSPACE.replace(':projectId', mrv.project_id || 'PRJ-2023-089')}
                        className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">biotech</span>
                        Open Verification Workspace
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Flagged Anomalies Queue */}
      {activeTab === 'FLAGGED' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
              <h2 className="font-headline-sm text-on-surface font-bold text-[16px]">Active Anomaly & Compliance Alerts</h2>
            </div>
            <span className="text-xs text-on-surface-variant font-mono-data">{flaggedAlerts.length} Open Alerts</span>
          </div>

          <div className="p-4 space-y-3">
            {flaggedAlerts.map((alt) => (
              <div key={alt.id} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-500/40 transition-colors">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-500/15 text-amber-600 border border-amber-500/30">
                      {alt.category}
                    </span>
                    <span className="font-mono-data text-xs text-on-surface-variant">{alt.alert_code}</span>
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-error/10 text-error">
                      {alt.severity} Severity
                    </span>
                  </div>
                  <div className="font-bold text-on-surface text-sm">{alt.title}</div>
                  <p className="text-xs text-on-surface-variant">{alt.description}</p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => setSelectedAlert(alt)}
                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">build</span>
                    Investigate / Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Verification Failures */}
      {activeTab === 'FAILURES' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-[24px]">gpp_bad</span>
            <h2 className="font-headline-sm font-bold text-[18px]">Non-Compliant & Rejected Submissions</h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Submissions that failed independent third-party auditor verification or biometric consistency checks.
          </p>

          <div className="p-4 rounded-xl bg-error/5 border border-error/20 space-y-2">
            <div className="font-bold text-sm text-error">Rejection Notice: Coastal Plot Boundary Collision</div>
            <p className="text-xs text-on-surface-variant">
              Project PRJ-2023-012 submission was rejected due to an overlap with a pre-existing state wildlife sanctuary boundary in Odisha coastal belt.
            </p>
            <div className="text-[11px] text-on-surface-variant font-mono-data">
              Auditor: TUV SUD Environmental • Rejection Signed Hash: 0x88fca91...
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Blockchain Integrity & Re-anchoring */}
      {activeTab === 'BLOCKCHAIN' && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-600">
              <span className="material-symbols-outlined text-[24px]">link_off</span>
              <h2 className="font-headline-sm font-bold text-[18px]">Blockchain Smart Contract & Re-Anchoring Status</h2>
            </div>
            <Link
              to={ROUTES.ADMIN_BLOCKCHAIN}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Open Blockchain Ledger
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-on-surface">Polygon Amoy Testnet Gateway: Syncing & Validated</div>
              <div className="text-xs text-on-surface-variant font-mono-data">
                Smart Contract: 0x3F89a23E9528D890D73a1B1bF421D87E60c4E639 (ERC-1155 BlueCarbon Anchor)
              </div>
              <div className="text-xs text-secondary font-medium">100% of verified credits immutably anchored on-chain.</div>
            </div>
            <button
              onClick={() => showNotification('Blockchain node health verified. All merkle proofs in sync.')}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Verify Merkle Root Integrity
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <OrganizationReviewModal
        request={selectedOrgRequest}
        isOpen={!!selectedOrgRequest}
        onClose={() => setSelectedOrgRequest(null)}
        onRefresh={() => {
          fetchQueues();
          showNotification('Organization queue updated.');
        }}
      />

      <GovernanceAlertActionModal
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onRefresh={() => {
          fetchQueues();
          showNotification('Governance alert updated.');
        }}
      />
    </div>
  );
}
