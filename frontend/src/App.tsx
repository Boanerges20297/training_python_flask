import { useState } from 'react';
import Login from './modules/auth/views/Login';
import Sidebar from './components/layouts/Sidebar';
import Header from './components/layouts/Header';
import ClientsView from './modules/admin/views/ClientsView';
import ServicesView from './modules/admin/views/ServicesView';
import AppointmentsView from './modules/admin/views/AppointmentsView';
import BarbersView from './modules/admin/views/BarbersView';
import BarberDashboard from './modules/barber/views/BarberDashboard';
import ClientDashboard from './modules/client/views/ClientDashboard';

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

  // --- Layout Administrativo ---
  const AdminLayout = () => {
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
  };

  // --- Layout Global (Barbeiro / Cliente) ---
  const SimplifiedLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col h-screen bg-slate-100">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium">{user.nome || user.email}</span>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );

  // --- Roteamento por Role ---
  if (user.role === 'admin') {
    return <AdminLayout />;
  }

  if (user.role === 'barbeiro') {
    return (
      <SimplifiedLayout title="Painel do Profissional">
        <BarberDashboard />
      </SimplifiedLayout>
    );
  }

  if (user.role === 'cliente') {
    return (
      <SimplifiedLayout title="Área do Cliente">
        <ClientDashboard />
      </SimplifiedLayout>
    );
  }

  // Fallback para roles desconhecidas
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-red-500 font-bold">Erro: Role desconhecida ({user.role})</p>
        <button onClick={handleLogout} className="mt-4 text-blue-500 underline">Voltar para Login</button>
      </div>
    </div>
  );
}

export default App;
