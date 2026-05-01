'use client';

import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

type ConfirmVariant = 'danger' | 'warning' | 'default';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_ICONS = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  default: Info,
};

const VARIANT_COLORS = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  default: 'var(--accent)',
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const Icon = VARIANT_ICONS[variant];
  const iconColor = VARIANT_COLORS[variant];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onCancel} aria-label="Fechar">
          <X size={18} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconWrapper} style={{ color: iconColor }}>
            <Icon size={28} />
          </div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmBtn} ${styles[`confirmBtn${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}