import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Activity } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#0f172a' }}>
        <p style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity className="animate-spin" />
          Carregando Barba & Byte...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Force Redirection based on actual Role fallback
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'cliente') return <Navigate to="/cliente/inicio" replace />;
    if (user.role === 'barbeiro') return <Navigate to="/barbeiro/agenda" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
