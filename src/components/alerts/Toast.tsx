'use client';

import { useEffect } from 'react';
import { X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useAlertsStore, Alert } from '@/stores/alerts';
import styles from './Toast.module.css';

export function ToastContainer() {
  const { toasts, removeToast } = useAlertsStore();

  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: Alert;
  onDismiss: () => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = toast.urgente ? AlertCircle : Info;

  return (
    <div className={`${styles.toast} ${toast.urgente ? styles.urgente : ''}`}>
      <Icon className={styles.icon} size={20} />
      <div className={styles.content}>
        <p className={styles.title}>{toast.titulo}</p>
        <p className={styles.message}>{toast.mensagem}</p>
      </div>
      <button onClick={onDismiss} className={styles.close}>
        <X size={16} />
      </button>
    </div>
  );
}
