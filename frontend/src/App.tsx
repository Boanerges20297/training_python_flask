import { useState } from 'react';
import { Database, LogOut, User, Users, Briefcase, Calendar, LayoutDashboard } from 'lucide-react';
import Login from './components/Login';
import ClientsView from './views/ClientsView';
import ServicesView from './views/ServicesView';
import AppointmentsView from './views/AppointmentsView';

function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'clientes' | 'servicos' | 'agendamentos'>('clientes');

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Database size={28} color="#3b82f6" />
          <span>Barber Admin</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            <Users size={20} /> Clientes
          </button>
          <button 
            className={`nav-item ${activeTab === 'servicos' ? 'active' : ''}`}
            onClick={() => setActiveTab('servicos')}
          >
            <Briefcase size={20} /> Serviços
          </button>
          <button 
            className={`nav-item ${activeTab === 'agendamentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('agendamentos')}
          >
            <Calendar size={20} /> Agendamentos
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-text">
              <p className="user-name">{user.nome}</p>
              <p className="user-role">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="content-header">
          <div className="breadcrumb">
            <LayoutDashboard size={18} />
            <span>Dashboard</span> / <span className="current">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          </div>
          <div className="header-actions">
            <span className="status-badge">API Online</span>
          </div>
        </header>

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
