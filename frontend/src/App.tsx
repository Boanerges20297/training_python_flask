// felipe
import { useState } from 'react';
import { useAuth } from './auth/useAuth';
import { AuthGuard } from './auth/AuthGuard';
import Login from './modules/admin/views/Login';
import Sidebar from './components/layouts/Sidebar';
import Header from './components/layouts/Header';
import ClientsView from './modules/admin/views/ClientsView';
import ServicesView from './modules/admin/views/ServicesView';
import AppointmentsView from './modules/admin/views/AppointmentsView';
import BarbersView from './modules/admin/views/BarbersView';

type Tab = 'clientes' | 'servicos' | 'agendamentos' | 'barbeiros';

function App() {
  // felipe
  // user e logout vêm do contexto — sem useState<any> local
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // felipe
  // exibe o Login se não estiver autenticado — contexto controla a transição
  if (!isAuthenticated) {
    return <Login />;
  }

  const tabNames: Record<Tab, string> = {
    clientes: 'Clientes',
    servicos: 'Serviços',
    agendamentos: 'Agendamentos',
    barbeiros: 'Barbeiros'
  };

  return (
    // felipe
    // AuthGuard garante que apenas admins acessam o painel
    <AuthGuard requiredRole="admin">
      <div className={`app-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          user={user}
          onLogout={logout}
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
    </AuthGuard>
  );
}

export default App;

