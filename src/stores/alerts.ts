import { create } from 'zustand';

export interface Alert {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  urgente: boolean;
}

interface AlertsStore {
  alerts: Alert[];
  unreadCount: number;
  toasts: Alert[];
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  addToast: (alert: Alert) => void;
  removeToast: (id: string) => void;
  setAlerts: (alerts: Alert[], unreadCount: number) => void;
  markAsRead: (id: string) => void;
  clearToasts: () => void;
}

export const useAlertsStore = create<AlertsStore>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  toasts: [],

  addAlert: alert =>
    set(state => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    })),

  removeAlert: id =>
    set(state => {
      const alert = state.alerts.find(a => a.id === id);
      return {
        alerts: state.alerts.filter(a => a.id !== id),
        unreadCount:
          alert && !alert.urgente ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),

  addToast: alert =>
    set(state => ({
      toasts: [...state.toasts, alert],
    })),

  removeToast: id =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),

  setAlerts: (alerts, unreadCount) => set({ alerts, unreadCount }),

  markAsRead: id =>
    set(state => {
      const alert = state.alerts.find(a => a.id === id);
      if (!alert || !alert.urgente) return state;
      return {
        alerts: state.alerts.map(a => (a.id === id ? { ...a, urgente: false } : a)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  clearToasts: () => set({ toasts: [] }),
}));
