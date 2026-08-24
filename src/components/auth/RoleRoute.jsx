import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { IS_UI_PREVIEW_MODE } from '../../config/uiPreviewMode';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (IS_UI_PREVIEW_MODE) {
    return children ? children : <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <span className="font-mono-data text-xs text-on-surface-variant">Verifying Permissions...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!user.role || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Navigate to={ROUTES.ACCESS_RESTRICTED} replace />;
  }

  return children ? children : <Outlet />;
}
