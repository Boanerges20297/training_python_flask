import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar, {type SidebarTab } from './Sidebar';
import Header from './Header';
import { useAuth } from '../../auth/useAuth';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Derive active tab from route path
  const getActiveTab = (): SidebarTab => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('clientes')) return 'clientes';
    if (path.includes('servicos')) return 'servicos';
    if (path.includes('agendamentos')) return 'agendamentos';
    if (path.includes('barbeiros')) return 'barbeiros';
    if (path.includes('agenda')) return 'agenda';
    if (path.includes('historico')) return 'historico';
    if (path.includes('inicio')) return 'inicio';
    if (path.includes('agendamentos-cliente')) return 'agendamentos_cliente';
    
    return 'dashboard';
  };

  const getHeaderTitle = () => {
    const path = location.pathname;
    const adminTitles: Record<string, string> = {
      dashboard: 'Estatísticas',
      clientes: 'Clientes',
      servicos: 'Serviços',
      agendamentos: 'Agendamentos',
      barbeiros: 'Barbeiros'
    };
    
    if (path.includes('admin')) {
       for (const k in adminTitles) {
          if (path.includes(k)) return adminTitles[k];
       }
       return 'Admin';
    }

    if (path.includes('cliente')) {
      if (path.includes('agendamentos')) return 'Meus Agendamentos';
      return 'Área do Cliente';
    }

    if (path.includes('barbeiro')) {
      if (path.includes('historico')) return 'Histórico';
      return 'Agenda do Dia';
    }

    return '';
  };

  const handleTabChange = (tab: SidebarTab) => {
    if (user?.role === 'admin') {
      const routes: Record<string, string> = {
        dashboard: '/admin/dashboard',
        clientes: '/admin/clientes',
        servicos: '/admin/servicos',
        agendamentos: '/admin/agendamentos',
        barbeiros: '/admin/barbeiros'
      };
      if (routes[tab]) navigate(routes[tab]);
    } else if (user?.role === 'barbeiro') {
       const routes: Record<string, string> = {
         agenda: '/barbeiro/agenda',
         historico: '/barbeiro/historico',
       };
       if (routes[tab]) navigate(routes[tab]);
    } else {
       const routes: Record<string, string> = {
         inicio: '/cliente/inicio',
         agendamentos_cliente: '/cliente/agendamentos'
       };
       if (routes[tab]) navigate(routes[tab]);
    }
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar 
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        user={user}
        onLogout={() => logout()}
      />

      <main className="main-content">
        <Header activeTabName={getHeaderTitle()} activeTab={getActiveTab()} />
        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
