/**
 * Application-wide constants & Role-Based Access Control (RBAC)
 */

export const ROLES = {
  NCCR_ADMIN: 'NCCR_ADMIN',
  VERIFIER: 'VERIFIER',
  NGO: 'NGO',
  PANCHAYAT: 'PANCHAYAT',
  COMMUNITY: 'COMMUNITY',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  PUBLIC: 'PUBLIC',
};

export const PROJECT_STATUS = {
  ACTIVE: 'Active',
  VERIFIED: 'Verified',
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  REJECTED: 'Rejected',
  DRAFT: 'Draft',
  COMPLETED: 'Completed',
};

export const MRV_STATUS = {
  VERIFIED: 'Verified',
  UNDER_REVIEW: 'Under Review',
  UNDER_VALIDATION: 'Under Validation',
  UNDER_VERIFICATION: 'Under Verification',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  DRAFT: 'Draft',
};

export const CREDIT_STATUS = {
  ACTIVE: 'Active',
  RETIRED: 'Retired',
  PENDING: 'Pending',
  MINTED: 'Minted',
  TOKENIZED: 'Tokenized',
};

export const ONBOARDING_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Changes Requested',
  REJECTED: 'Rejected',
};

export const ROUTES = {
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  ACCESS_RESTRICTED: '/access-restricted',

  // NCCR National Governance & Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_GOVERNANCE: '/admin/governance',
  ADMIN_NATIONAL_MAP: '/admin/national-map',
  ADMIN_GOVERNANCE_QUEUES: '/admin/governance/queues',
  ADMIN_PROJECTS: '/projects',
  ADMIN_PROJECT_NEW: '/projects/new',
  ADMIN_PROJECT_DETAIL: '/projects/:id',
  ADMIN_MRV: '/admin/mrv',
  ADMIN_MRV_UPLOAD: '/mrv/upload',
  ADMIN_MRV_PROJECT_VERIFICATION: '/mrv/project-verification/:verificationId',
  ADMIN_MRV_WORKSPACE: '/mrv/workspace/:projectId',
  ADMIN_ORGANIZATIONS: '/organizations',
  ADMIN_ORGANIZATION_DETAIL: '/organizations/:id',
  ADMIN_CARBON_CREDITS: '/admin/carbon-credits',
  ADMIN_CARBON_CREDIT_DETAIL: '/admin/carbon-credits/:id',
  ADMIN_BLOCKCHAIN: '/admin/blockchain',
  ADMIN_OCR_REVIEW: '/admin/ocr-review',
  ADMIN_SENSORS: '/admin/sensors',
  ADMIN_DRONE: '/admin/drone-survey',
  ADMIN_MRV_INTELLIGENCE: '/admin/mrv-intelligence',
  ADMIN_MRV_ANOMALIES: '/admin/mrv-anomalies',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_SETTINGS: '/admin/settings',

  // Onboarding
  ONBOARDING: '/onboarding',
  ONBOARDING_STATUS: '/onboarding/status',

  // Organization Workspaces (NGO, Panchayat, Project Manager)
  ORG_DASHBOARD: '/organization/dashboard',
  ORG_PROJECTS: '/organization/projects',
  ORG_CREATE_PROJECT: '/organization/projects/new',
  ORG_PROJECT_DETAIL: '/organization/projects/:id',
  ORG_UPLOAD_EVIDENCE: '/organization/evidence/upload',
  ORG_SETTINGS: '/organization/settings',

  // Community Portal
  COMMUNITY_DASHBOARD: '/community/dashboard',
  COMMUNITY_PORTAL: '/community/portal',
  COMMUNITY_PROJECTS: '/community/projects',
  COMMUNITY_MRV_VERIFICATION: '/community/mrv-verification',
  COMMUNITY_EVIDENCE_UPLOAD: '/community/evidence-upload',
  COMMUNITY_ORGANIZATIONS: '/community/organizations',
  COMMUNITY_CARBON_CREDITS: '/community/carbon-credits',
  COMMUNITY_BLOCKCHAIN_REGISTRY: '/community/blockchain-registry',
  COMMUNITY_DRONE_SENSOR: '/community/drone-sensor-data',
  COMMUNITY_REPORTS: '/community/reports',
  COMMUNITY_AUDIT_TRAIL: '/community/audit-trail',
  COMMUNITY_SETTINGS: '/community/settings',

  // Public Transparency Registry & Credit DNA
  PUBLIC_REGISTRY: '/public',
  PUBLIC_PROJECT_DETAIL: '/public/projects/:id',
  PUBLIC_CREDIT_DETAIL: '/public/credits/:id',
  PUBLIC_PROVENANCE_DETAIL: '/public/provenance/:id',
  STATUS: '/status',
};
