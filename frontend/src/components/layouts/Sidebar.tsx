import { Database, LogOut, User, Users, Scissors, Briefcase, Calendar, ChevronLeft, Menu } from 'lucide-react';

interface SidebarProps {
  activeTab: 'clientes' | 'servicos' | 'agendamentos' | 'barbeiros';
  onTabChange: (tab: 'clientes' | 'servicos' | 'agendamentos' | 'barbeiros') => void;
  isCollapsed: boolean;
  onToggle: () => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggle, 
  user, 
  onLogout 
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Database size={28} color="#3b82f6" />
        {!isCollapsed && <span>Barber Admin</span>}
        <button 
          className="toggle-sidebar" 
          onClick={onToggle}
          title={isCollapsed ? "Expandir" : "Recolher"}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
          onClick={() => onTabChange('clientes')}
          title="Clientes"
        >
          <Users size={20} /> {!isCollapsed && <span>Clientes</span>}
        </button>
        <button 
          className={`nav-item ${activeTab === 'barbeiros' ? 'active' : ''}`}
          onClick={() => onTabChange('barbeiros')}
          title="Barbeiros"
        >
          <Scissors size={20} /> {!isCollapsed && <span>Barbeiros</span>}
        </button> 
        <button 
          className={`nav-item ${activeTab === 'servicos' ? 'active' : ''}`}
          onClick={() => onTabChange('servicos')}
          title="Serviços"
        >
          <Briefcase size={20} /> {!isCollapsed && <span>Serviços</span>}
        </button>
        <button 
          className={`nav-item ${activeTab === 'agendamentos' ? 'active' : ''}`}
          onClick={() => onTabChange('agendamentos')}
          title="Agendamentos"
        >
          <Calendar size={20} /> {!isCollapsed && <span>Agendamentos</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <User size={16} />
          </div>
          {!isCollapsed && (
            <div className="user-text">
              <p className="user-name">{user?.nome || 'Usuário'}</p>
              <p className="user-role">{user?.role || 'Administrador'}</p>
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
