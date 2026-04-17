import { useState } from 'react';
import AuthContainer from './modules/auth/views/AuthContainer';
import Sidebar from './components/layouts/Sidebar';
import type { SidebarTab } from './components/layouts/Sidebar';
import Header from './components/layouts/Header';
import ClientsView from './modules/admin/views/ClientsView';
import ServicesView from './modules/admin/views/ServicesView';
import AppointmentsView from './modules/admin/views/AppointmentsView';
import BarbersView from './modules/admin/views/BarbersView';
import BarberDashboard from './modules/barber/views/BarberDashboard';
import ClientDashboard from './modules/client/views/ClientDashboard';
import DashboardView from './modules/admin/views/DashboardView';

function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = sessionStorage.getItem('barba_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [activeTab, setActiveTab] = useState<SidebarTab>(() => {
    if (user?.role === 'cliente') return 'inicio';
    if (user?.role === 'barbeiro') return 'agenda';
    return 'dashboard';
  });
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('barba_user');
    setUser(null);
  };

  if (!user) {
    return <AuthContainer onLoginSuccess={(u) => {
      setUser(u);
      if (u.role === 'cliente') setActiveTab('inicio');
      else if (u.role === 'barbeiro') setActiveTab('agenda');
      else setActiveTab('dashboard');
    }} />;
  }

  const renderContent = () => {
    if (user.role === 'admin') {
      if (activeTab === 'dashboard') return <DashboardView />;
      if (activeTab === 'clientes') return <ClientsView />;
      if (activeTab === 'servicos') return <ServicesView />;
      if (activeTab === 'agendamentos') return <AppointmentsView />;
      if (activeTab === 'barbeiros') return <BarbersView />;
    }

    if (user.role === 'cliente') {
      return <ClientDashboard user={user} activeTab={activeTab as string} />;
    }

    if (user.role === 'barbeiro') {
      return <BarberDashboard user={user} activeTab={activeTab as string} />;
    }

    return null;
  };

  const getHeaderTitle = () => {
    if (user.role === 'admin') {
      const titles: Record<string, string> = {
        dashboard: 'Estatísticas',
        clientes: 'Clientes',
        servicos: 'Serviços',
        agendamentos: 'Agendamentos',
        barbeiros: 'Barbeiros'
      };
      return titles[activeTab as string] || 'Admin';
    }
    if (user.role === 'cliente') {
      if (activeTab === 'agendamentos_cliente') return 'Meus Agendamentos';
      return 'Área do Cliente';
    }
    if (user.role === 'barbeiro') {
      if (activeTab === 'historico') return 'Histórico';
      return 'Agenda do Dia';
    }
    return '';
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar 
        activeTab={activeTab}
        onTabChange={(tab: SidebarTab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <Header activeTabName={getHeaderTitle()} />
        <div className="content-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
