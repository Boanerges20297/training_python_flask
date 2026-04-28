import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Bell, XCircle, Settings, CheckCircle2, ChevronRight, Users, Scissors, Briefcase, Calendar, Home, History, TrendingUp, AlertTriangle, Info as InfoIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type SidebarTab } from './Sidebar';
import ThemeToggle from '../ui/ThemeToggle';
import styles from './Header.module.css';

interface HeaderProps {
  activeTabName: string;
  activeTab: SidebarTab;
}

const tabIcons: Record<string, any> = {
  dashboard: LayoutDashboard,
  clientes: Users,
  barbeiros: Scissors,
  servicos: Briefcase,
  agendamentos: Calendar,
  inicio: Home,
  agendamentos_cliente: Calendar,
  agenda: Calendar,
  historico: History,
  financeiro: TrendingUp
};

export default function Header({ activeTabName, activeTab }: HeaderProps) {
  const Icon = tabIcons[activeTab] || LayoutDashboard;

  interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'cancel' | 'system' | 'debt' | 'success' | 'info' | 'warning' | 'error';
  }

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'sys-1',
      title: 'Sistema Atualizado',
      message: 'As novas funções de abas e pesquisa foram habilitadas com sucesso.',
      time: 'Agora',
      read: false,
      type: 'system'
    }
  ]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleNewNotification = (event: any) => {
      const detail = event.detail;
      const newNotif: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        title: detail.title || 'Notificação',
        message: detail.message || '',
        time: detail.time || 'Agora',
        read: false,
        type: detail.type || 'system'
      };
      setNotifications(prev => [newNotif, ...prev]);
    };

    window.addEventListener('barbabyte:notificacao', handleNewNotification);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('barbabyte:notificacao', handleNewNotification);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbIcon}>
          <Icon size={18} />
        </div>
        <ChevronRight size={14} className={styles.breadcrumbIcon} />
        <span className={styles.current}>{activeTabName}</span>
      </div>
      
      <div className={styles.headerActions}>
        <ThemeToggle />
        <div className={styles.statusBadge}>API Online</div>
        
        <div className={styles.notificationContainer} ref={dropdownRef}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${styles.notificationBell} ${showNotifications ? styles.notificationBellActive : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={styles.badgeCount}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={styles.dropdown}
              >
                <div className={styles.dropdownHeader}>
                  <h4>Notificações</h4>
                  {unreadCount > 0 && (
                    <button className={styles.markReadBtn} onClick={markAllAsRead}>
                      Marcar todas lidas
                    </button>
                  )}
                </div>
                
                <div className={styles.notificationList}>
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={notif.id} 
                        className={`${styles.notificationItem} ${!notif.read ? styles.unread : ''}`}
                      >
                        <div className={`
                          ${styles.notifIcon} 
                          ${notif.type === 'cancel' ? styles.iconCancel : ''}
                          ${notif.type === 'system' ? styles.iconSystem : ''}
                          ${notif.type === 'debt' || notif.type === 'warning' ? styles.iconWarning : ''}
                          ${notif.type === 'success' ? styles.iconSuccess : ''}
                          ${notif.type === 'info' ? styles.iconInfo : ''}
                          ${notif.type === 'error' ? styles.iconError : ''}
                        `}>
                          {notif.type === 'cancel' || notif.type === 'error' ? <XCircle size={16} /> : 
                           notif.type === 'system' ? <Settings size={16} /> :
                           notif.type === 'debt' || notif.type === 'warning' ? <AlertTriangle size={16} /> :
                           notif.type === 'success' ? <CheckCircle size={16} /> :
                           <InfoIcon size={16} />}
                        </div>
                        <div className={styles.notifContent}>
                          <p><strong>{notif.title}</strong> - {notif.message}</p>
                          <span className={styles.notifTime}>{notif.time}</span>
                        </div>
                        <AnimatePresence>
                          {!notif.read && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className={styles.badgeDot} 
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  ) : (
                    <div className={styles.notificationEmpty}>
                      <CheckCircle2 size={32} opacity={0.5} />
                      <p>Tudo limpo por aqui.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

