import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth, AUTH_STATUS } from '../../contexts/AuthContext';
import { ROLES, ROUTES } from '../../utils/constants';
import { IS_UI_PREVIEW_MODE } from '../../config/uiPreviewMode';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, isLoading, authStatus } = useAuth();
  const location = useLocation();

  if (IS_UI_PREVIEW_MODE) {
    return children ? children : <Outlet />;
  }

  if (isLoading || authStatus === AUTH_STATUS.INITIALIZING) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <span className="font-mono-data text-xs text-on-surface-variant">Verifying Permissions...</span>
      </div>
    );
  }

  if (!user) {
    const isAdminOnly = allowedRoles.length === 1 && allowedRoles[0] === ROLES.NCCR_ADMIN;
    const targetLogin = isAdminOnly ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN;
    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  if (!user.role || authStatus === AUTH_STATUS.PROFILE_INVALID) {
    return <Navigate to={ROUTES.ACCESS_RESTRICTED} replace />;
  }

  // NCCR_ADMIN has universal access to all routes
  if (user.role === ROLES.NCCR_ADMIN) {
    return children ? children : <Outlet />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Non-admin attempting to access unauthorized route: safely route to their primary dashboard
    if (user.role === ROLES.VERIFIER) {
      return <Navigate to={ROUTES.ADMIN_MRV_WORKSPACE.replace(':projectId', 'PRJ-2023-089')} replace />;
    }
    if (user.role === ROLES.NGO || user.role === ROLES.PANCHAYAT || user.role === ROLES.PROJECT_MANAGER) {
      return <Navigate to={ROUTES.ORG_DASHBOARD} replace />;
    }
    if (user.role === ROLES.COMMUNITY) {
      return <Navigate to={ROUTES.COMMUNITY_DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.ACCESS_RESTRICTED} replace />;
  }

  return children ? children : <Outlet />;
}
