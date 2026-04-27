// Sidebar — Migrado para CSS Modules com Design Tokens
import { Database, LogOut, User, Users, Scissors, Briefcase, Calendar, ChevronLeft, Home, History, LayoutDashboard, TrendingUp } from 'lucide-react';
import styles from './Sidebar.module.css';

type AdminTab = 'dashboard' | 'clientes' | 'servicos' | 'agendamentos' | 'barbeiros' | 'financeiro';
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

  // Função auxiliar para montar classes com active state
  const navClass = (tab: string) =>
    `${styles.navItem} ${activeTab === tab ? styles.active : ''}`;

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <button 
          className={styles.brandCard} 
          data-active-tab={activeTab} 
          onClick={onToggle}
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          <div className={styles.brandAvatar}>
            <Database size={20} color="#fff" />
          </div>
          {!isCollapsed && (
            <>
              <div className={styles.brandText}>
                <h3 className={styles.brandName}>Barba & Byte</h3>
                <p className={styles.brandTagline}>Gestão Inteligente</p>
              </div>
              <div className={styles.headerAction}>
                <ChevronLeft size={16} />
              </div>
            </>
          )}
        </button>
      </div>



      <nav className={styles.nav}>
        {role === 'admin' && (
          <>
            <button className={navClass('dashboard')} onClick={() => onTabChange('dashboard')} data-tab="dashboard">
              <div className={styles.iconBox}><LayoutDashboard size={20} /></div>
              {!isCollapsed && <span>Dashboard</span>}
            </button>
            <button className={navClass('financeiro')} onClick={() => onTabChange('financeiro')} data-tab="financeiro">
              <div className={styles.iconBox}><TrendingUp size={20} /></div>
              {!isCollapsed && <span>Financeiro</span>}
            </button>
            <button className={navClass('clientes')} onClick={() => onTabChange('clientes')} data-tab="clientes">
              <div className={styles.iconBox}><Users size={20} /></div>
              {!isCollapsed && <span>Clientes</span>}
            </button>
            <button className={navClass('barbeiros')} onClick={() => onTabChange('barbeiros')} data-tab="barbeiros">
              <div className={styles.iconBox}><Scissors size={20} /></div>
              {!isCollapsed && <span>Barbeiros</span>}
            </button>
            <button className={navClass('servicos')} onClick={() => onTabChange('servicos')} data-tab="servicos">
              <div className={styles.iconBox}><Briefcase size={20} /></div>
              {!isCollapsed && <span>Serviços</span>}
            </button>
            <button className={navClass('agendamentos')} onClick={() => onTabChange('agendamentos')} data-tab="agendamentos">
              <div className={styles.iconBox}><Calendar size={20} /></div>
              {!isCollapsed && <span>Agendamentos</span>}
            </button>
          </>
        )}


        {role === 'cliente' && (
          <>
            <button className={navClass('inicio')} onClick={() => onTabChange('inicio')} data-tab="clientes">
              <div className={styles.iconBox}><Home size={20} /></div>
              {!isCollapsed && <span>Início</span>}
            </button>
            <button className={navClass('agendamentos_cliente')} onClick={() => onTabChange('agendamentos_cliente')} data-tab="agendamentos">
              <div className={styles.iconBox}><Calendar size={20} /></div>
              {!isCollapsed && <span>Meus Agendamentos</span>}
            </button>
          </>
        )}

        {role === 'barbeiro' && (
          <>
            <button className={navClass('agenda')} onClick={() => onTabChange('agenda')} data-tab="barbeiros">
              <div className={styles.iconBox}><Calendar size={20} /></div>
              {!isCollapsed && <span>Agenda do Dia</span>}
            </button>
            <button className={navClass('historico')} onClick={() => onTabChange('historico')} data-tab="barbeiros">
              <div className={styles.iconBox}><History size={20} /></div>
              {!isCollapsed && <span>Histórico</span>}
            </button>
          </>
        )}
      </nav>


      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}><User size={16} /></div>
          {!isCollapsed && (
            <div className={styles.userText}>
              <p className={styles.userName}>{user?.nome || 'Usuário'}</p>
              <p className={styles.userRole}>{user?.role || 'Admin'}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout} className={styles.logoutBtn}>
          <LogOut size={18} /> {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
