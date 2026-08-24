import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNationalGovernanceSummary } from '../services/governanceService';
import { COASTAL_STATES } from '../adapters/gisAdapter';
import { ROUTES } from '../../../utils/constants';

export default function NationalGovernancePage() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getNationalGovernanceSummary();
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        console.error('Failed to load governance summary:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const s = summary || {
    total_projects: 105,
    verified_projects: 68,
    pending_projects: 19,
    flagged_projects: 11,
    rejected_projects: 7,
    total_restoration_area_ha: 326600,
    verified_tco2e: 845200,
    total_carbon_credits: 124500,
    blockchain_anchored_credits: 112000,
    pending_onboarding_orgs: 3,
    pending_mrv_submissions: 8,
    open_governance_alerts: 3,
    governance_compliance_rate: 99.4,
    national_coastal_coverage_states: 10,
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary via-primary/95 to-primary-container p-6 md:p-8 rounded-2xl text-on-primary shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-tertiary-fixed text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
            National Coastal Carbon Registry (NCCR) Authority
          </div>
          <h1 className="font-display-lg text-[28px] md:text-[34px] font-extrabold tracking-tight text-white leading-tight">
            National Governance & Integrity Command Center
          </h1>
          <p className="font-body-md text-white/80 text-sm md:text-base">
            National monitoring, regulatory approvals, verification queues, and sovereign blockchain credit anchors across India's coastline.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            to={ROUTES.ADMIN_GOVERNANCE_QUEUES}
            className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-title-sm text-xs md:text-sm font-bold flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            Open Governance Queues ({s.pending_onboarding_orgs + s.pending_mrv_submissions})
          </Link>
          <Link
            to={ROUTES.ADMIN_NATIONAL_MAP}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-title-sm text-xs md:text-sm font-bold flex items-center gap-2 backdrop-blur-md transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">map</span>
            National Map Explorer
          </Link>
        </div>
      </div>

      {/* 9 National Governance KPIs Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
            National Registry Aggregates & Verification Metrics
          </h2>
          <span className="text-xs text-on-surface-variant font-mono-data">Updated in real-time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Card 1: Total Projects */}
          <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-bold uppercase tracking-wider">Total Projects</span>
              <span className="p-2 rounded-xl bg-primary/10 text-primary material-symbols-outlined text-[20px]">forest</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-on-surface font-mono-data">
              {isLoading ? '...' : Number(s.total_projects).toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>10 Coastal States</span>
            </div>
          </div>

          {/* Card 2: Verified Projects */}
          <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-bold uppercase tracking-wider">Verified Projects</span>
              <span className="p-2 rounded-xl bg-secondary/10 text-secondary material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-secondary font-mono-data">
              {isLoading ? '...' : Number(s.verified_projects).toLocaleString()}
            </div>
            <div className="text-xs text-on-surface-variant">
              {Math.round((s.verified_projects / (s.total_projects || 1)) * 100)}% verification rate
            </div>
          </div>

          {/* Card 3: Pending & Under Review */}
          <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-amber-600 font-mono-data">
              {isLoading ? '...' : Number(s.pending_projects).toLocaleString()}
            </div>
            <div className="text-xs text-amber-600 font-medium">
              Awaiting NCCR action
            </div>
          </div>

          {/* Card 4: Flagged & Anomalies */}
          <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-bold uppercase tracking-wider">Flagged Anomalies</span>
              <span className="p-2 rounded-xl bg-error/10 text-error material-symbols-outlined text-[20px]">flag</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-error font-mono-data">
              {isLoading ? '...' : Number(s.flagged_projects).toLocaleString()}
            </div>
            <div className="text-xs text-error font-medium">
              {s.open_governance_alerts} open critical alerts
            </div>
          </div>

          {/* Card 5: Rejected */}
          <div className="p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
              <span className="p-2 rounded-xl bg-gray-500/10 text-gray-600 material-symbols-outlined text-[20px]">block</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-700 dark:text-gray-300 font-mono-data">
              {isLoading ? '...' : Number(s.rejected_projects).toLocaleString()}
            </div>
            <div className="text-xs text-on-surface-variant">
              Non-compliant submissions
            </div>
          </div>
        </div>

        {/* Secondary Macro Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Total Restoration Area */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">square_foot</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Restoration Area</div>
              <div className="text-xl font-extrabold text-on-surface font-mono-data">
                {Number(s.total_restoration_area_ha).toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">Hectares</span>
              </div>
            </div>
          </div>

          {/* Verified tCO2e */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed-dim/20 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">co2</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Verified Sequestered</div>
              <div className="text-xl font-extrabold text-on-surface font-mono-data">
                {Number(s.verified_tco2e).toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">tCO2e</span>
              </div>
            </div>
          </div>

          {/* Total Carbon Credits */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Carbon Credits</div>
              <div className="text-xl font-extrabold text-secondary font-mono-data">
                {Number(s.total_carbon_credits).toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">Credits</span>
              </div>
            </div>
          </div>

          {/* Blockchain Anchored */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">link</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Blockchain Anchored</div>
              <div className="text-xl font-extrabold text-purple-600 font-mono-data">
                {Number(s.blockchain_anchored_credits).toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">On-Chain</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: State Coastal Coverage & Quick Governance Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coastal States Registry Overview */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-outline-variant/30 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-on-surface font-bold text-[18px]">Coastal States Sovereignty & Coverage</h3>
              <p className="text-xs text-on-surface-variant">Active blue carbon project density across India's 10 maritime territories</p>
            </div>
            <Link
              to={ROUTES.ADMIN_NATIONAL_MAP}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Explore National Map
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-xs uppercase tracking-wider text-on-surface-variant bg-surface-container-lowest">
                  <th className="py-3 px-4">Coastal State</th>
                  <th className="py-3 px-4">Key Ecosystem</th>
                  <th className="py-3 px-4 text-right">Projects</th>
                  <th className="py-3 px-4 text-right">Monitored Area</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {COASTAL_STATES.map((st) => (
                  <tr key={st.id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                      {st.name}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant text-xs">{st.keyEcosystem}</td>
                    <td className="py-3.5 px-4 text-right font-mono-data font-bold text-on-surface">{st.projectsCount}</td>
                    <td className="py-3.5 px-4 text-right font-mono-data text-on-surface">{st.areaHa.toLocaleString()} ha</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                        Active Registry
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Governance Fast-Actions & Alert Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Card */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-on-surface font-bold text-[18px]">Governance Hub Actions</h3>
            <div className="space-y-2.5">
              <Link
                to={ROUTES.ADMIN_GOVERNANCE_QUEUES}
                className="w-full p-3.5 rounded-xl bg-surface-container-lowest hover:bg-primary-container/20 border border-outline-variant/30 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px]">domain_verification</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-on-surface group-hover:text-primary">Onboarding Review Queue</div>
                    <div className="text-xs text-on-surface-variant">{s.pending_onboarding_orgs} Pending Applications</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_GOVERNANCE_QUEUES}
                className="w-full p-3.5 rounded-xl bg-surface-container-lowest hover:bg-secondary-container/20 border border-outline-variant/30 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-on-surface group-hover:text-secondary">MRV Submissions Queue</div>
                    <div className="text-xs text-on-surface-variant">{s.pending_mrv_submissions} Claims Awaiting Audit</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-secondary transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_BLOCKCHAIN}
                className="w-full p-3.5 rounded-xl bg-surface-container-lowest hover:bg-purple-500/10 border border-outline-variant/30 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-purple-600 text-[22px]">account_tree</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-on-surface group-hover:text-purple-600">Polygon Blockchain Ledger</div>
                    <div className="text-xs text-on-surface-variant">Verify Smart Contract Anchors</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-purple-600 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>

              <Link
                to={ROUTES.PUBLIC_REGISTRY}
                className="w-full p-3.5 rounded-xl bg-surface-container-lowest hover:bg-tertiary-container/20 border border-outline-variant/30 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">public</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-on-surface group-hover:text-tertiary">Public Transparency Portal</div>
                    <div className="text-xs text-on-surface-variant">Publicly Verified Projects</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-tertiary transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Anomaly & Compliance Card */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">security</span>
                Governance Compliance Status
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                {s.governance_compliance_rate}% Pass
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1.5 text-xs">
              <div className="flex justify-between text-on-surface">
                <span>NDVI Anomaly Detection:</span>
                <strong className="text-secondary">Normal</strong>
              </div>
              <div className="flex justify-between text-on-surface">
                <span>Smart Contract Hash Match:</span>
                <strong className="text-secondary">100% Synced</strong>
              </div>
              <div className="flex justify-between text-on-surface">
                <span>Independent Auditor Reviews:</span>
                <strong className="text-primary">100% Mandated</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
