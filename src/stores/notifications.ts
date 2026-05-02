import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'warning' | 'error' | 'info' | 'success';
  link?: string;
  urgente: boolean;
  lida: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        })),

      markAsRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.lida) return state;
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, lida: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, lida: true })),
          unreadCount: 0,
        })),

      removeNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.lida
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        }),
    }),
    {
      name: 'notifications-storage',
    }
  )
);
