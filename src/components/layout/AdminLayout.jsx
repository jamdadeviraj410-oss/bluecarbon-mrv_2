import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROUTES } from '../../utils/constants';
import { IS_UI_PREVIEW_MODE } from '../../config/uiPreviewMode';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (!IS_UI_PREVIEW_MODE) {
    if (isLoading) {
      return <div className="min-h-screen bg-surface flex items-center justify-center">Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (!user) {
      return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Only allow admin access
    if (user.role !== ROLES.NCCR_ADMIN) {
      return <Navigate to={ROUTES.ACCESS_RESTRICTED} replace />;
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col min-h-screen relative">
        {/* Topbar will be rendered by individual pages if they need specific actions,
            or we can render a default one here and pass context. For now, letting pages render it
            or rendering a default one here. We'll render a default one in pages to allow custom titles.
            Actually, it's better to let pages render Topbar so they can set title and actions. */}
        <div className="flex-1 w-full flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
