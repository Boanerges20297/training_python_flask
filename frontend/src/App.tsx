import { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ClientsView from './views/ClientsView';
import ServicesView from './views/ServicesView';
import AppointmentsView from './views/AppointmentsView';

type Tab = 'clientes' | 'servicos' | 'agendamentos';

function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  // Mapeia o ID da aba para um nome legível no Breadcrumb
  const tabNames: Record<Tab, string> = {
    clientes: 'Clientes',
    servicos: 'Serviços',
    agendamentos: 'Agendamentos'
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
        </div>
      </main>
    </div>
  );
}

export default App;
