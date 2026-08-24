import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROUTES } from '../../utils/constants';
import { IS_UI_PREVIEW_MODE } from '../../config/uiPreviewMode';
import Sidebar from './Sidebar';

export default function OrganizationLayout() {
  const { user, isLoading } = useAuth();

  if (!IS_UI_PREVIEW_MODE) {
    if (isLoading) {
      return <div className="min-h-screen bg-surface flex items-center justify-center font-mono-data text-sm">Loading workspace...</div>;
    }

    if (!user) {
      return <Navigate to={ROUTES.LOGIN} replace />;
    }

    const allowedRoles = [
      ROLES.NGO,
      ROLES.PANCHAYAT,
      ROLES.COMMUNITY,
      ROLES.PROJECT_MANAGER,
      ROLES.NCCR_ADMIN,
    ];

    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={ROUTES.ACCESS_RESTRICTED} replace />;
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col min-h-screen relative">
        <div className="flex-1 w-full flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
