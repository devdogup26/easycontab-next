'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '@/stores/notifications';
import styles from './NotificationBell.module.css';

const tipoIcons = {
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  success: CheckCircle,
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setOpen(!open)}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.title}>Notificações</span>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={markAllAsRead}>
                <Check size={14} />
                <span>Marcar todas como lida</span>
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={32} className={styles.emptyIcon} />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const Icon = tipoIcons[notification.tipo] || Info;
                return (
                  <div
                    key={notification.id}
                    className={`${styles.item} ${notification.lida ? styles.read : ''} ${
                      notification.urgente ? styles.urgente : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <Icon
                      className={`${styles.itemIcon} ${styles[notification.tipo]}`}
                      size={18}
                    />
                    <div className={styles.itemContent}>
                      <p className={styles.itemTitle}>{notification.titulo}</p>
                      <p className={styles.itemMessage}>{notification.mensagem}</p>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      aria-label="Remover notificação"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
