import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import ProtectedRoute from '../auth/ProtectedRoute';
import AppLayout from '../components/layouts/AppLayout';
import AuthContainer from '../modules/auth/views/AuthContainer';

const DashboardView = lazy(() => import('../modules/admin/views/DashboardView'));
const ClientsView = lazy(() => import('../modules/admin/views/ClientsView'));
const ServicesView = lazy(() => import('../modules/admin/views/ServicesView'));
const AppointmentsView = lazy(() => import('../modules/admin/views/AppointmentsView'));
const BarbersView = lazy(() => import('../modules/admin/views/BarbersView'));
const FinanceiroView = lazy(() => import('../modules/admin/views/FinanceiroView'));
const ClientDashboard = lazy(() => import('../modules/client/views/ClientDashboard'));
const BarberDashboard = lazy(() => import('../modules/barber/views/BarberDashboard'));

const SuspenseFallback = () => (
   <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
     <Activity className="animate-spin" size={40} color="#3b82f6" />
   </div>
);

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'cliente') return <Navigate to="/cliente/inicio" replace />;
  if (user?.role === 'barbeiro') return <Navigate to="/barbeiro/agenda" replace />;
  return <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<AuthContainer />} />
      
      {/* Any layout dependent routes fall inside ProtectedRoute to ensure auth context */}
      <Route path="/" element={<ProtectedRoute />} >
        <Route element={<AppLayout />}>
           <Route index element={<HomeRedirect />} />
           {/* Admin Domain */}
           <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin" element={<Navigate to="dashboard" replace />} />
              <Route path="admin/dashboard" element={<Suspense fallback={<SuspenseFallback />}><DashboardView /></Suspense>} />
              <Route path="admin/clientes" element={<Suspense fallback={<SuspenseFallback />}><ClientsView /></Suspense>} />
              <Route path="admin/servicos" element={<Suspense fallback={<SuspenseFallback />}><ServicesView /></Suspense>} />
              <Route path="admin/agendamentos" element={<Suspense fallback={<SuspenseFallback />}><AppointmentsView /></Suspense>} />
              <Route path="admin/barbeiros" element={<Suspense fallback={<SuspenseFallback />}><BarbersView /></Suspense>} />
              <Route path="admin/financeiro" element={<Suspense fallback={<SuspenseFallback />}><FinanceiroView /></Suspense>} />
           </Route>

           {/* Client Domain */}
           <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
              <Route path="cliente/inicio" element={<Suspense fallback={<SuspenseFallback />}><ClientDashboard user={user as any} activeTab="inicio" /></Suspense>} />
              <Route path="cliente/agendamentos" element={<Suspense fallback={<SuspenseFallback />}><ClientDashboard user={user as any} activeTab="agendamentos" /></Suspense>} />
              <Route path="cliente" element={<Navigate to="inicio" replace />} />
           </Route>

           {/* Barber Domain */}
           <Route element={<ProtectedRoute allowedRoles={['barbeiro']} />}>
              <Route path="barbeiro/agenda" element={<Suspense fallback={<SuspenseFallback />}><BarberDashboard user={user as any} activeTab="agenda" /></Suspense>} />
              <Route path="barbeiro/historico" element={<Suspense fallback={<SuspenseFallback />}><BarberDashboard user={user as any} activeTab="historico" /></Suspense>} />
              <Route path="barbeiro" element={<Navigate to="agenda" replace />} />
           </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
