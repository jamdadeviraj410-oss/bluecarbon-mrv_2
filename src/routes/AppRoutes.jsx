import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES, ROUTES } from '../utils/constants';
import RoleRoute from '../components/auth/RoleRoute';
import AdminLayout from '../components/layout/AdminLayout';
import OrganizationLayout from '../components/layout/OrganizationLayout';
import PublicLayout from '../components/layout/PublicLayout';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ForgotPassword from '../pages/auth/ForgotPassword';
import AccessRestricted from '../pages/auth/AccessRestricted';
import StatusTransitionPage from '../pages/auth/StatusTransitionPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import NationalGovernancePage from '../features/governance/pages/NationalGovernancePage';
import NationalMapExplorerPage from '../features/governance/pages/NationalMapExplorerPage';
import GovernanceQueuesPage from '../features/governance/pages/GovernanceQueuesPage';
import OrganizationOnboardingPage from '../features/onboarding/pages/OrganizationOnboardingPage';
import OnboardingStatusPage from '../features/onboarding/pages/OnboardingStatusPage';
import OrganizationDashboardPage from '../features/organizations/pages/OrganizationDashboardPage';
import OrganizationProjectsPage from '../features/organizations/pages/OrganizationProjectsPage';
import OrganizationsPage from '../features/organizations/pages/OrganizationsPage';
import ProjectsPage from '../features/projects/pages/ProjectsPage';
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage';
import ProjectFormPage from '../features/projects/pages/ProjectFormPage';
import UploadMrvEvidencePage from '../features/mrv/pages/UploadMrvEvidencePage';
import ProjectVerificationPage from '../features/mrv/pages/ProjectVerificationPage';
import MrvVerificationWorkspacePage from '../features/mrv/pages/MrvVerificationWorkspacePage';
import MrvBlockchainAnchorPage from '../features/mrv/pages/MrvBlockchainAnchorPage';
import { BlockchainRecordsPage, BlockchainRecordDetailPage } from '../features/blockchain';
import { CarbonCreditsPage, CarbonCreditDetailPage } from '../features/carbonCredits';
import { ReportsPage, ReportDetailPage } from '../features/reports';
import { AuditTrailPage, AuditTrailDetailPage } from '../features/auditTrail';
import { PublicRegistryPage, PublicRegistryDetailPage, CreditDnaProvenancePage } from '../features/publicRegistry';
import {
  CommunityDashboardPage,
  CommunityPortalPage,
  CommunityProjectsPage,
  CommunityMrvVerificationPage,
  CommunityEvidenceUploadPage,
  CommunityOrganizationsPage,
  CommunityCarbonCreditsPage,
  CommunityBlockchainRegistryPage,
  CommunityDroneSensorPage,
  CommunityReportsPage,
  CommunityAuditTrailPage,
  CommunitySettingsPage,
} from '../features/community';
import { OcrReviewWorkspace } from '../features/ocr';
import { SensorRegistryView } from '../features/sensors';
import { DroneBeforeAfterView } from '../features/drone';
import { MrvIntelligenceDashboard, MrvAnomalyMatrix } from '../features/mrvIntelligence';
import { SettingsPage } from '../features/settings';

import { IS_UI_PREVIEW_MODE } from '../config/uiPreviewMode';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication & Onboarding Routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.SIGNUP} element={<Signup />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.ACCESS_RESTRICTED} element={<AccessRestricted />} />
      <Route path={ROUTES.ONBOARDING} element={<OrganizationOnboardingPage />} />
      <Route path={ROUTES.ONBOARDING_STATUS} element={<OnboardingStatusPage />} />
      <Route path="/" element={<Navigate to={IS_UI_PREVIEW_MODE ? ROUTES.ADMIN_DASHBOARD : ROUTES.LOGIN} replace />} />

      {/* NCCR National Governance & Admin Routes (NCCR_ADMIN Only) */}
      <Route element={<RoleRoute allowedRoles={[ROLES.NCCR_ADMIN]}><AdminLayout /></RoleRoute>}>
        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
        <Route path={ROUTES.ADMIN_GOVERNANCE} element={<NationalGovernancePage />} />
        <Route path="/governance" element={<NationalGovernancePage />} />
        <Route path={ROUTES.ADMIN_NATIONAL_MAP} element={<NationalMapExplorerPage />} />
        <Route path="/national-map" element={<NationalMapExplorerPage />} />
        <Route path={ROUTES.ADMIN_GOVERNANCE_QUEUES} element={<GovernanceQueuesPage />} />
        <Route path="/governance/queues" element={<GovernanceQueuesPage />} />
        <Route path={ROUTES.ADMIN_PROJECTS} element={<ProjectsPage />} />
        <Route path={ROUTES.ADMIN_PROJECT_NEW} element={<ProjectFormPage />} />
        <Route path={ROUTES.ADMIN_PROJECT_DETAIL} element={<ProjectDetailPage />} />
        <Route path={ROUTES.ADMIN_MRV} element={<Navigate to={ROUTES.ADMIN_MRV_WORKSPACE.replace(':projectId', 'PRJ-2023-089')} replace />} />
        <Route path={ROUTES.ADMIN_MRV_UPLOAD} element={<UploadMrvEvidencePage />} />
        <Route path={ROUTES.ADMIN_MRV_PROJECT_VERIFICATION} element={<ProjectVerificationPage />} />
        <Route path={ROUTES.ADMIN_MRV_WORKSPACE} element={<MrvVerificationWorkspacePage />} />
        <Route path="/mrv/blockchain/:submissionId" element={<MrvBlockchainAnchorPage />} />
        <Route path={ROUTES.ADMIN_ORGANIZATIONS} element={<OrganizationsPage />} />
        <Route path={ROUTES.ADMIN_ORGANIZATION_DETAIL} element={<OrganizationsPage />} />
        <Route path={ROUTES.ADMIN_CARBON_CREDITS} element={<CarbonCreditsPage />} />
        <Route path={ROUTES.ADMIN_CARBON_CREDIT_DETAIL} element={<CarbonCreditDetailPage />} />
        <Route path={ROUTES.ADMIN_BLOCKCHAIN} element={<BlockchainRecordsPage />} />
        <Route path="/admin/blockchain/:id" element={<BlockchainRecordDetailPage />} />
        <Route path="/carbon-credits" element={<CarbonCreditsPage />} />
        <Route path="/carbon-credits/:id" element={<CarbonCreditDetailPage />} />
        <Route path="/blockchain" element={<BlockchainRecordsPage />} />
        <Route path="/blockchain/:id" element={<BlockchainRecordDetailPage />} />
        <Route path={ROUTES.ADMIN_OCR_REVIEW} element={<OcrReviewWorkspace />} />
        <Route path="/mrv/ocr" element={<OcrReviewWorkspace />} />
        <Route path={ROUTES.ADMIN_SENSORS} element={<SensorRegistryView />} />
        <Route path="/sensors" element={<SensorRegistryView />} />
        <Route path={ROUTES.ADMIN_DRONE} element={<DroneBeforeAfterView />} />
        <Route path="/drone" element={<DroneBeforeAfterView />} />
        <Route path={ROUTES.ADMIN_MRV_INTELLIGENCE} element={<MrvIntelligenceDashboard />} />
        <Route path="/mrv/intelligence" element={<MrvIntelligenceDashboard />} />
        <Route path={ROUTES.ADMIN_MRV_ANOMALIES} element={<MrvAnomalyMatrix />} />
        <Route path="/mrv/anomalies" element={<MrvAnomalyMatrix />} />
        <Route path={ROUTES.ADMIN_REPORTS} element={<ReportsPage />} />
        <Route path="/admin/reports/:id" element={<ReportDetailPage />} />
        <Route path={ROUTES.ADMIN_AUDIT} element={<AuditTrailPage />} />
        <Route path="/admin/audit/:id" element={<AuditTrailDetailPage />} />
        <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
      </Route>

      {/* Organization Portal Routes (NGO, Panchayat, Project Manager, NCCR_ADMIN) */}
      <Route element={<RoleRoute allowedRoles={[ROLES.NGO, ROLES.PANCHAYAT, ROLES.PROJECT_MANAGER, ROLES.NCCR_ADMIN]}><OrganizationLayout /></RoleRoute>}>
        <Route path={ROUTES.ORG_DASHBOARD} element={<OrganizationDashboardPage />} />
        <Route path={ROUTES.ORG_PROJECTS} element={<OrganizationProjectsPage />} />
        <Route path={ROUTES.ORG_CREATE_PROJECT} element={<ProjectFormPage />} />
        <Route path={ROUTES.ORG_PROJECT_DETAIL} element={<ProjectDetailPage />} />
        <Route path={ROUTES.ORG_UPLOAD_EVIDENCE} element={<UploadMrvEvidencePage />} />
        <Route path={ROUTES.ORG_SETTINGS} element={<SettingsPage />} />
      </Route>

      {/* Community User Portal Routes (COMMUNITY, NCCR_ADMIN) */}
      <Route element={<RoleRoute allowedRoles={[ROLES.COMMUNITY, ROLES.NCCR_ADMIN]}><OrganizationLayout /></RoleRoute>}>
        <Route path={ROUTES.COMMUNITY_DASHBOARD} element={<CommunityDashboardPage />} />
        <Route path={ROUTES.COMMUNITY_PORTAL} element={<CommunityPortalPage />} />
        <Route path={ROUTES.COMMUNITY_PROJECTS} element={<CommunityProjectsPage />} />
        <Route path={ROUTES.COMMUNITY_MRV_VERIFICATION} element={<CommunityMrvVerificationPage />} />
        <Route path={ROUTES.COMMUNITY_EVIDENCE_UPLOAD} element={<CommunityEvidenceUploadPage />} />
        <Route path={ROUTES.COMMUNITY_ORGANIZATIONS} element={<CommunityOrganizationsPage />} />
        <Route path={ROUTES.COMMUNITY_CARBON_CREDITS} element={<CommunityCarbonCreditsPage />} />
        <Route path={ROUTES.COMMUNITY_BLOCKCHAIN_REGISTRY} element={<CommunityBlockchainRegistryPage />} />
        <Route path={ROUTES.COMMUNITY_DRONE_SENSOR} element={<CommunityDroneSensorPage />} />
        <Route path={ROUTES.COMMUNITY_REPORTS} element={<CommunityReportsPage />} />
        <Route path={ROUTES.COMMUNITY_AUDIT_TRAIL} element={<CommunityAuditTrailPage />} />
        <Route path={ROUTES.COMMUNITY_SETTINGS} element={<CommunitySettingsPage />} />
      </Route>

      {/* Public Registry & Credit DNA Transparency Routes */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.PUBLIC_REGISTRY} element={<PublicRegistryPage />} />
        <Route path={ROUTES.PUBLIC_PROJECT_DETAIL} element={<PublicRegistryDetailPage />} />
        <Route path={ROUTES.PUBLIC_CREDIT_DETAIL} element={<CarbonCreditDetailPage />} />
        <Route path={ROUTES.PUBLIC_PROVENANCE_DETAIL} element={<CreditDnaProvenancePage />} />
      </Route>

      <Route path={ROUTES.STATUS} element={<StatusTransitionPage />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}
