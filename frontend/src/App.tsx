import { useState } from 'react';
import Login from './modules/admin/views/Login';
import Sidebar from './components/layouts/Sidebar';
import Header from './components/layouts/Header';
import ClientsView from './modules/admin/views/ClientsView';
import ServicesView from './modules/admin/views/ServicesView';
import AppointmentsView from './modules/admin/views/AppointmentsView';
import BarbersView from './modules/admin/views/BarbersView';

type Tab = 'clientes' | 'servicos' | 'agendamentos' | 'barbeiros';

function App() {
  const [user, setUser] = useState<any>(() => {
    // # Gabriel (Dev 1) - Recuperação de sessão para o F5 não dar logout
    const savedUser = sessionStorage.getItem('barba_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('barba_user');
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  // Mapeia o ID da aba para um nome legível no Breadcrumb
  const tabNames: Record<Tab, string> = {
    clientes: 'Clientes',
    servicos: 'Serviços',
    agendamentos: 'Agendamentos',
    barbeiros: 'Barbeiros'
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar 
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <Header activeTabName={tabNames[activeTab]} />

        <div className="content-body">
          {activeTab === 'clientes' && <ClientsView />}
          {activeTab === 'servicos' && <ServicesView />}
          {activeTab === 'agendamentos' && <AppointmentsView />}
          {activeTab === 'barbeiros' && <BarbersView />}
        </div>
      </main>
    </div>
  );
}

export default App;
