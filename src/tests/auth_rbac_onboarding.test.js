import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { ROLES, ROUTES } from '../utils/constants.js';
import { formatAuthErrorMessage } from '../services/authService.js';

export async function runAuthRbacTests() {
  const testResults = [];

  const recordTest = async (name, fn) => {
    try {
      await fn();
      testResults.push({ name, passed: true });
    } catch (err) {
      testResults.push({ name, passed: false, error: err.message });
    }
  };

  // 1. Supabase Config — No hard-coded credentials
  await recordTest('Security: supabase.js does not contain hard-coded credentials', () => {
    const supabasePath = path.resolve('src', 'lib', 'supabase.js');
    const code = fs.readFileSync(supabasePath, 'utf8');
    assert(!code.includes('eyJhbGciOiJIUzI1Ni'), 'supabase.js must not contain hard-coded JWT keys');
    assert(!code.includes('https://rmiyueszxpsfyzvjehdx.supabase.co'), 'supabase.js must not contain hardcoded project URLs');
    assert(code.includes('VITE_SUPABASE_URL'), 'supabase.js must reference VITE_SUPABASE_URL');
    assert(code.includes('VITE_SUPABASE_ANON_KEY'), 'supabase.js must reference VITE_SUPABASE_ANON_KEY');
    assert(code.includes('throw new Error'), 'supabase.js must throw if env vars are missing');
  });

  // 2. Canonical Roles definition
  await recordTest('RBAC: Constants define canonical business roles', () => {
    assert.strictEqual(ROLES.NCCR_ADMIN, 'NCCR_ADMIN');
    assert.strictEqual(ROLES.VERIFIER, 'VERIFIER');
    assert.strictEqual(ROLES.NGO, 'NGO');
    assert.strictEqual(ROLES.PANCHAYAT, 'PANCHAYAT');
    assert.strictEqual(ROLES.COMMUNITY, 'COMMUNITY');
    assert.strictEqual(ROLES.PROJECT_MANAGER, 'PROJECT_MANAGER');
  });

  // 3. Dangerous Default Admin Role Removed from AuthContext
  await recordTest('Security: AuthContext never defaults missing profile/role to NCCR_ADMIN', () => {
    const authContextPath = path.resolve('src', 'contexts', 'AuthContext.jsx');
    const code = fs.readFileSync(authContextPath, 'utf8');
    assert(!code.includes('ROLES.NCCR_ADMIN;') || !code.includes('|| ROLES.NCCR_ADMIN'), 'AuthContext must never fallback to NCCR_ADMIN');
    assert(!code.includes("profile?.role || metadata.role || ROLES.NCCR_ADMIN"), 'Dangerous default admin pattern must be removed');
  });

  // 4. Human-readable error message mapping
  await recordTest('Auth Service: formatAuthErrorMessage sanitizes error strings', () => {
    const invCred = formatAuthErrorMessage(new Error('Invalid login credentials'));
    assert.strictEqual(invCred, 'Invalid email or password.');

    const notConf = formatAuthErrorMessage(new Error('Email not confirmed'));
    assert.strictEqual(notConf, 'Please verify your email before signing in.');

    const alreadyReg = formatAuthErrorMessage(new Error('User already registered'));
    assert.strictEqual(alreadyReg, 'An account with this email already exists.');

    const netErr = formatAuthErrorMessage(new Error('Failed to fetch'));
    assert.strictEqual(netErr, 'Unable to connect to the registry. Please check your connection and try again.');
  });

  // 5. Migration 16 Schema and Triggers Integrity
  await recordTest('Database: Migration 16 contains role check, handle_new_user trigger, and hardened RLS', () => {
    const migPath = path.resolve('supabase', 'migrations', '202608240016_unify_roles_and_auth_trigger.sql');
    assert(fs.existsSync(migPath), 'Migration 16 file must exist');
    const sql = fs.readFileSync(migPath, 'utf8');
    assert(sql.includes('handle_new_user()'), 'Must contain handle_new_user trigger function');
    assert(sql.includes('on_auth_user_created'), 'Must bind on_auth_user_created trigger on auth.users');
    assert(sql.includes('approve_onboarding_and_provision_org'), 'Must contain onboarding provisioning RPC');
    assert(sql.includes('auth.uid() = id'), 'Must enforce auth.uid() check in profiles RLS');
  });

  // 6. Routes include /signup and protected route guards
  await recordTest('Routing: AppRoutes registers /signup and uses RoleRoute guards', () => {
    assert.strictEqual(ROUTES.SIGNUP, '/signup');
    const routesPath = path.resolve('src', 'routes', 'AppRoutes.jsx');
    const code = fs.readFileSync(routesPath, 'utf8');
    assert(code.includes('RoleRoute'), 'AppRoutes must use RoleRoute');
    assert(code.includes('Signup'), 'AppRoutes must render Signup component');
    assert(code.includes('allowedRoles={[ROLES.NCCR_ADMIN]}'), 'Admin routes must be restricted to NCCR_ADMIN');
  });

  // 7. Onboarding does not fabricate mock application number or simulated result
  await recordTest('Onboarding: Service and pages do not fabricate fake application data', () => {
    const pagePath = path.resolve('src', 'features', 'onboarding', 'pages', 'OrganizationOnboardingPage.jsx');
    const code = fs.readFileSync(pagePath, 'utf8');
    assert(!code.includes('mockAppNum'), 'OrganizationOnboardingPage must not generate fake mockAppNum');

    const statusPagePath = path.resolve('src', 'features', 'onboarding', 'pages', 'OnboardingStatusPage.jsx');
    const statusCode = fs.readFileSync(statusPagePath, 'utf8');
    assert(!statusCode.includes('Sundarbans Mangrove Protection Collective'), 'OnboardingStatusPage must not fabricate fake simulated organization data');
  });

  // 8. RoleRoute and ProtectedRoute exist and enforce authentication
  await recordTest('Security: Route guards are present and functional', () => {
    const protectedPath = path.resolve('src', 'components', 'auth', 'ProtectedRoute.jsx');
    const rolePath = path.resolve('src', 'components', 'auth', 'RoleRoute.jsx');
    assert(fs.existsSync(protectedPath), 'ProtectedRoute.jsx must exist');
    assert(fs.existsSync(rolePath), 'RoleRoute.jsx must exist');
  });

  // 9. Public Signup removes role escalation
  await recordTest('Security: Signup.jsx does not allow users to choose elevated roles', () => {
    const signupPath = path.resolve('src', 'pages', 'auth', 'Signup.jsx');
    const code = fs.readFileSync(signupPath, 'utf8');
    assert(!code.includes('<select'), 'Signup.jsx must not contain a role selector dropdown');
    assert(code.includes('ROLES.COMMUNITY'), 'Signup.jsx must default to COMMUNITY role');
    assert(code.includes('organizationId: null'), 'Signup.jsx must set organizationId to null');
  });

  // 10. Database Anti-Escalation Triggers
  await recordTest('Database: Migration 16 prevents self-role/org modification', () => {
    const migPath = path.resolve('supabase', 'migrations', '202608240016_unify_roles_and_auth_trigger.sql');
    const sql = fs.readFileSync(migPath, 'utf8');
    assert(sql.includes('prevent_self_role_escalation'), 'Must contain prevent_self_role_escalation trigger function');
    assert(sql.includes('trg_prevent_self_role_escalation'), 'Must bind trigger on public.profiles');
  });

  // 11. Controlled Onboarding Status RPC & No Public Table SELECT
  await recordTest('Database: Migration 16 contains get_onboarding_status RPC and removes public SELECT policy', () => {
    const migPath = path.resolve('supabase', 'migrations', '202608240016_unify_roles_and_auth_trigger.sql');
    const sql = fs.readFileSync(migPath, 'utf8');
    assert(sql.includes('get_onboarding_status'), 'Must define get_onboarding_status RPC');
    assert(sql.includes('DROP POLICY IF EXISTS "Public can view application status"'), 'Must drop public select policy on onboarding_requests');
  });

  // 13. Dedicated Admin Login and Non-Admin Session Termination
  await recordTest('Auth: AdminLogin.jsx exists and enforces non-admin session termination', () => {
    const adminLoginPath = path.resolve('src', 'pages', 'auth', 'AdminLogin.jsx');
    assert(fs.existsSync(adminLoginPath), 'AdminLogin.jsx must exist');
    const code = fs.readFileSync(adminLoginPath, 'utf8');
    assert(code.includes('logoutUser()'), 'AdminLogin must call logoutUser() for non-admin attempts');
    assert(code.includes('ROLES.NCCR_ADMIN'), 'AdminLogin must check for NCCR_ADMIN role');
    assert(code.includes('ROUTES.ADMIN_DASHBOARD'), 'AdminLogin must navigate to admin dashboard on success');
  });

  // 14. Safe state.from restoration in Login.jsx
  await recordTest('Auth: Login.jsx safely validates state.from and routes verifiers to workspace', () => {
    const loginPath = path.resolve('src', 'pages', 'auth', 'Login.jsx');
    const code = fs.readFileSync(loginPath, 'utf8');
    assert(code.includes('isRouteAllowedForRole'), 'Login must validate target route against user role');
    assert(code.includes('PRJ-2023-089'), 'Login must direct VERIFIER to MRV workspace PRJ-2023-089');
    assert(code.includes('ROUTES.ADMIN_LOGIN'), 'Login must contain link to Admin Portal');
  });

  // 15. Security-Classified Login Redirects in RoleRoute
  await recordTest('Security: RoleRoute directs unauthenticated admin attempts to /admin/login', () => {
    const roleRoutePath = path.resolve('src', 'components', 'auth', 'RoleRoute.jsx');
    const code = fs.readFileSync(roleRoutePath, 'utf8');
    assert(code.includes('ROUTES.ADMIN_LOGIN'), 'RoleRoute must redirect admin-only routes to ADMIN_LOGIN');
    assert(code.includes('AUTH_STATUS.INITIALIZING'), 'RoleRoute must check AUTH_STATUS.INITIALIZING');
    assert(code.includes('AUTH_STATUS.PROFILE_INVALID'), 'RoleRoute must fail closed on PROFILE_INVALID');
  });

  // 16. Missing profile fails closed to PROFILE_INVALID in AuthContext
  await recordTest('Security: AuthContext resolves missing profile to PROFILE_INVALID immediately', () => {
    const authContextPath = path.resolve('src', 'contexts', 'AuthContext.jsx');
    const code = fs.readFileSync(authContextPath, 'utf8');
    assert(code.includes('AUTH_STATUS.PROFILE_INVALID'), 'AuthContext must set PROFILE_INVALID on missing/invalid role');
    assert(!code.includes('PROFILE_PENDING'), 'AuthContext must not leave users stuck in PROFILE_PENDING');
  });

  // 17. Verifier Sidebar Excludes Admin-Only Links
  await recordTest('UI/RBAC: Sidebar renders verifierLinks without admin governance or settings', () => {
    const sidebarPath = path.resolve('src', 'components', 'layout', 'Sidebar.jsx');
    const code = fs.readFileSync(sidebarPath, 'utf8');
    assert(code.includes('verifierLinks'), 'Sidebar must define verifierLinks');
    assert(code.includes('isVerifier'), 'Sidebar must check isVerifier');
  });

  // 18. Unnested Verifier Route Group in AppRoutes
  await recordTest('Routing: AppRoutes has distinct [VERIFIER, NCCR_ADMIN] route group', () => {
    const routesPath = path.resolve('src', 'routes', 'AppRoutes.jsx');
    const code = fs.readFileSync(routesPath, 'utf8');
    assert(code.includes('allowedRoles={[ROLES.VERIFIER, ROLES.NCCR_ADMIN]}'), 'AppRoutes must contain verifier+admin route group');
    assert(code.includes('RootRedirect'), 'AppRoutes must implement role-aware RootRedirect');
    assert(code.includes('ADMIN_LOGIN'), 'AppRoutes must register ADMIN_LOGIN route');
  });

  // 19. Edge Function Caller Authorization Verification
  await recordTest('Backend Security: anchor-mrv Edge Function validates caller authentication', () => {
    const edgeFnPath = path.resolve('supabase', 'functions', 'anchor-mrv', 'index.ts');
    assert(fs.existsSync(edgeFnPath), 'anchor-mrv Edge Function must exist');
    const code = fs.readFileSync(edgeFnPath, 'utf8');
    assert(code.includes('getUser(token)'), 'Edge Function must validate user token');
    assert(code.includes('Missing authorization') || code.includes('Invalid session'), 'Edge Function must reject unauthenticated requests');
  });

  // 20. Community Evidence Upload Drop Zone & File Input
  await recordTest('Community Upload: Drop zone triggers fileInput click and handles drag-and-drop', () => {
    const uploadPagePath = path.resolve('src', 'features', 'community', 'pages', 'CommunityEvidenceUploadPage.jsx');
    assert(fs.existsSync(uploadPagePath), 'CommunityEvidenceUploadPage.jsx must exist');
    const code = fs.readFileSync(uploadPagePath, 'utf8');
    assert(code.includes('fileInputRef.current?.click()'), 'Drop zone must trigger fileInputRef click');
    assert(code.includes('type="file"'), 'Must contain hidden type="file" input');
    assert(code.includes('onDrop={handleDrop}'), 'Must attach onDrop handler');
    assert(code.includes('uploadEvidence('), 'Must call uploadEvidence on valid file select');
    assert(code.includes('!uploadedEvidence || isUploading'), 'Step 2 Next Step must be gated on uploaded evidence');
  });

  // 21. mrvService Upload Evidence throws on storage error
  await recordTest('MRV Service: uploadEvidence throws storage error and does not swallow failures', () => {
    const mrvServicePath = path.resolve('src', 'services', 'mrvService.js');
    const code = fs.readFileSync(mrvServicePath, 'utf8');
    assert(code.includes('if (storageError)'), 'uploadEvidence must check storageError');
    assert(code.includes('throw storageError;'), 'uploadEvidence must throw storageError on upload failure');
  });

  return testResults;
}
