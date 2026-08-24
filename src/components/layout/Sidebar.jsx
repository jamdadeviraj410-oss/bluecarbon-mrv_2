import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROUTES } from '../../utils/constants';

function SidebarItem({ icon, label, to, active, badge }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all font-title-md text-sm ${
        active
          ? 'bg-primary-container text-on-primary font-bold shadow-sm'
          : 'text-on-primary/70 hover:bg-primary-container/50 hover:text-on-primary'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono-data font-bold bg-secondary text-on-secondary">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isAdmin = user?.role === ROLES.NCCR_ADMIN;
  const isVerifier = user?.role === ROLES.VERIFIER || user?.role === 'AUDITOR';
  const isOrg = user?.role === ROLES.NGO || user?.role === ROLES.PANCHAYAT || user?.role === ROLES.PROJECT_MANAGER || user?.role === 'ORG_ADMIN';
  const isCommunity = user?.role === ROLES.COMMUNITY || user?.role === 'COMMUNITY_USER';

  const adminLinks = [
    { icon: 'dashboard', label: 'National Dashboard', to: ROUTES.ADMIN_DASHBOARD },
    { icon: 'gavel', label: 'National Governance', to: ROUTES.ADMIN_GOVERNANCE },
    { icon: 'map', label: 'National Map Explorer', to: ROUTES.ADMIN_NATIONAL_MAP },
    { icon: 'fact_check', label: 'Governance Queues', to: ROUTES.ADMIN_GOVERNANCE_QUEUES },
    { icon: 'forest', label: 'Projects', to: ROUTES.ADMIN_PROJECTS },
    { icon: 'verified', label: 'MRV Verification', to: ROUTES.ADMIN_MRV_WORKSPACE.replace(':projectId', 'PRJ-2023-089'), basePath: '/mrv/workspace' },
    { icon: 'psychology', label: 'MRV Intelligence', to: ROUTES.ADMIN_MRV_INTELLIGENCE },
    { icon: 'document_scanner', label: 'OCR Document Review', to: ROUTES.ADMIN_OCR_REVIEW },
    { icon: 'sensors', label: 'IoT Sensor Registry', to: ROUTES.ADMIN_SENSORS },
    { icon: 'flight', label: 'Drone Canopy Survey', to: ROUTES.ADMIN_DRONE },
    { icon: 'corporate_fare', label: 'Organizations', to: ROUTES.ADMIN_ORGANIZATIONS },
    { icon: 'workspace_premium', label: 'Carbon Credits', to: ROUTES.ADMIN_CARBON_CREDITS },
    { icon: 'link', label: 'Blockchain Registry', to: ROUTES.ADMIN_BLOCKCHAIN },
    { icon: 'assessment', label: 'Reports', to: ROUTES.ADMIN_REPORTS },
    { icon: 'history', label: 'Audit Trail', to: ROUTES.ADMIN_AUDIT },
    { icon: 'settings', label: 'Settings', to: ROUTES.ADMIN_SETTINGS },
  ];

  const verifierLinks = [
    { icon: 'verified', label: 'MRV Verification Workspace', to: ROUTES.ADMIN_MRV_WORKSPACE.replace(':projectId', 'PRJ-2023-089'), basePath: '/mrv/workspace' },
    { icon: 'forest', label: 'Projects Registry', to: ROUTES.ADMIN_PROJECTS },
    { icon: 'psychology', label: 'MRV Anomaly Matrix', to: ROUTES.ADMIN_MRV_ANOMALIES },
    { icon: 'document_scanner', label: 'OCR Evidence Review', to: ROUTES.ADMIN_OCR_REVIEW },
    { icon: 'sensors', label: 'Sensor Telemetry', to: ROUTES.ADMIN_SENSORS },
    { icon: 'flight', label: 'Drone Orthomosaics', to: ROUTES.ADMIN_DRONE },
    { icon: 'link', label: 'Blockchain Verifications', to: ROUTES.ADMIN_BLOCKCHAIN },
    { icon: 'assessment', label: 'Verification Reports', to: ROUTES.ADMIN_REPORTS },
    { icon: 'history', label: 'Audit Log', to: ROUTES.ADMIN_AUDIT },
  ];

  const orgLinks = [
    { icon: 'dashboard', label: 'Organization Dashboard', to: ROUTES.ORG_DASHBOARD },
    { icon: 'forest', label: 'My Projects', to: ROUTES.ORG_PROJECTS },
    { icon: 'add_circle', label: 'Register New Project', to: ROUTES.ORG_CREATE_PROJECT },
    { icon: 'upload_file', label: 'Upload Field Evidence', to: ROUTES.ORG_UPLOAD_EVIDENCE },
    { icon: 'public', label: 'Public Registry', to: ROUTES.PUBLIC_REGISTRY },
    { icon: 'settings', label: 'Settings', to: ROUTES.ORG_SETTINGS },
  ];

  const communityLinks = [
    { icon: 'dashboard', label: 'Dashboard', to: ROUTES.COMMUNITY_DASHBOARD },
    { icon: 'forest', label: 'Projects', to: ROUTES.COMMUNITY_PROJECTS },
    { icon: 'verified', label: 'MRV Verification', to: ROUTES.COMMUNITY_MRV_VERIFICATION },
    { icon: 'upload_file', label: 'Evidence Upload', to: ROUTES.COMMUNITY_EVIDENCE_UPLOAD },
    { icon: 'corporate_fare', label: 'Organizations', to: ROUTES.COMMUNITY_ORGANIZATIONS },
    { icon: 'workspace_premium', label: 'Carbon Credits', to: ROUTES.COMMUNITY_CARBON_CREDITS },
    { icon: 'link', label: 'Blockchain Registry', to: ROUTES.COMMUNITY_BLOCKCHAIN_REGISTRY },
    { icon: 'flight_takeoff', label: 'Drone & Sensor Data', to: ROUTES.COMMUNITY_DRONE_SENSOR },
    { icon: 'assessment', label: 'Reports', to: ROUTES.COMMUNITY_REPORTS },
    { icon: 'history', label: 'Audit Trail', to: ROUTES.COMMUNITY_AUDIT_TRAIL },
    { icon: 'settings', label: 'Settings', to: ROUTES.COMMUNITY_SETTINGS },
  ];

  const links = isAdmin
    ? adminLinks
    : isVerifier
    ? verifierLinks
    : isOrg
    ? orgLinks
    : isCommunity
    ? communityLinks
    : adminLinks;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-primary text-on-primary flex flex-col z-40 border-r border-outline/20">
      <div className="h-[var(--topbar-height)] flex items-center px-6 gap-3 border-b border-outline/20 bg-primary/95 backdrop-blur-md">
        <div className="w-8 h-8 rounded-lg bg-surface/15 flex items-center justify-center p-1">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">water_ec</span>
        </div>
        <div>
          <span className="font-headline-md text-title-lg tracking-tight block leading-tight">Marine Ledger</span>
          <span className="text-[10px] font-mono-data text-primary-fixed-dim uppercase tracking-wider block">NCCR BlueCarbon MRV</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-1 scrollbar-thin">
        <div className="px-3 mb-1 text-[11px] font-label-md uppercase tracking-wider text-primary-fixed-dim">
          {isAdmin ? 'NATIONAL GOVERNANCE' : isVerifier ? 'VERIFICATION PORTAL' : isOrg ? 'ORGANIZATION WORKSPACE' : 'MAIN NAVIGATION'}
        </div>
        {links.map((link) => (
          <SidebarItem
            key={link.to}
            icon={link.icon}
            label={link.label}
            to={link.to}
            badge={link.badge}
            active={
              currentPath === link.to ||
              (link.to !== '/' && currentPath.startsWith(link.to + '/')) ||
              (link.basePath && currentPath.startsWith(link.basePath))
            }
          />
        ))}
      </div>

      <div className="p-4 border-t border-outline/20 mt-auto bg-primary/95">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-primary-container/30 border border-outline/20">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline/30 text-on-primary-container shrink-0">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-title-md text-xs font-bold truncate text-on-primary">{user?.name || 'User'}</span>
            <span className="font-body-md text-[11px] text-on-primary/70 truncate">{user?.organization || 'Registrar'}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-error hover:bg-error/10 transition-colors font-title-md text-xs font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
