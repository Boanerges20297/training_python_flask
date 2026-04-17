import { Database, LogOut, User, Users, Scissors, Briefcase, Calendar, ChevronLeft, Menu, Home, History, LayoutDashboard } from 'lucide-react';

type AdminTab = 'dashboard' | 'clientes' | 'servicos' | 'agendamentos' | 'barbeiros';
type ClientTab = 'inicio' | 'agendamentos_cliente';
type BarberTab = 'agenda' | 'historico';

export type SidebarTab = AdminTab | ClientTab | BarberTab;

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: any) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isCollapsed, onToggle, user, onLogout }: SidebarProps) {
  const role = user?.role || 'admin';

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Database size={28} color="#3b82f6" />
        {!isCollapsed && <span>{role === 'admin' ? 'Barber Admin' : 'Barba & Byte'}</span>}
        <button className="toggle-sidebar" onClick={onToggle}>
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {role === 'admin' && (
          <>
            <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => onTabChange('dashboard')}>
              <LayoutDashboard size={20} /> {!isCollapsed && <span>Dashboard</span>}
            </button>
            <button className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => onTabChange('clientes')}>
              <Users size={20} /> {!isCollapsed && <span>Clientes</span>}
            </button>
            <button className={`nav-item ${activeTab === 'barbeiros' ? 'active' : ''}`} onClick={() => onTabChange('barbeiros')}>
              <Scissors size={20} /> {!isCollapsed && <span>Barbeiros</span>}
            </button> 
            <button className={`nav-item ${activeTab === 'servicos' ? 'active' : ''}`} onClick={() => onTabChange('servicos')}>
              <Briefcase size={20} /> {!isCollapsed && <span>Serviços</span>}
            </button>
            <button className={`nav-item ${activeTab === 'agendamentos' ? 'active' : ''}`} onClick={() => onTabChange('agendamentos')}>
              <Calendar size={20} /> {!isCollapsed && <span>Agendamentos</span>}
            </button>
          </>
        )}

        {role === 'cliente' && (
          <>
            <button className={`nav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => onTabChange('inicio')}>
              <Home size={20} /> {!isCollapsed && <span>Início</span>}
            </button>
            <button className={`nav-item ${activeTab === 'agendamentos_cliente' ? 'active' : ''}`} onClick={() => onTabChange('agendamentos_cliente')}>
              <Calendar size={20} /> {!isCollapsed && <span>Meus Agendamentos</span>}
            </button>
          </>
        )}

        {role === 'barbeiro' && (
          <>
            <button className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => onTabChange('agenda')}>
              <Calendar size={20} /> {!isCollapsed && <span>Agenda do Dia</span>}
            </button>
            <button className={`nav-item ${activeTab === 'historico' ? 'active' : ''}`} onClick={() => onTabChange('historico')}>
              <History size={20} /> {!isCollapsed && <span>Histórico</span>}
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar"><User size={16} /></div>
          {!isCollapsed && (
            <div className="user-text">
              <p className="user-name text-capitalize">{user?.nome || 'Usuário'}</p>
              <p className="user-role text-capitalize">{user?.role || 'Admin'}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout} className="logout-btn">
          <LogOut size={18} /> {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
