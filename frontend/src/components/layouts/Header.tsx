import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Bell, XCircle, Settings, CheckCircle2 } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  activeTabName: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'cancel' | 'system';
}

export default function Header({ activeTabName }: HeaderProps) {
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
    // # Gabriel (Dev 1) - EventListener global para ouvir notificações disparadas por qualquer módulo
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

    // Fechar dropdown ao clicar fora
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
    <header className="content-header">
      <div className="breadcrumb">
        <LayoutDashboard size={18} />
        <span>Dashboard</span> / <span className="current">{activeTabName}</span>
      </div>
      
      <div className="header-actions">
        <span className="status-badge">API Online</span>
        
        {/* Sino de Notificações */}
        <div className="notification-container" ref={dropdownRef}>
          <button 
            className={`notification-bell ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificações"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge-count">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notificações</h4>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={markAllAsRead}>
                    Marcar todas lidas
                  </button>
                )}
              </div>
              
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                      <div className={`notification-icon ${notif.type}`}>
                        {notif.type === 'cancel' ? <XCircle size={16} /> : <Settings size={16} />}
                      </div>
                      <div className="notification-content">
                        <p><strong>{notif.title}</strong> - {notif.message}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                      {!notif.read && <div className="notification-badge-dot" />}
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">
                    <CheckCircle2 size={32} opacity={0.5} />
                    <p>Tudo limpo por aqui.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

