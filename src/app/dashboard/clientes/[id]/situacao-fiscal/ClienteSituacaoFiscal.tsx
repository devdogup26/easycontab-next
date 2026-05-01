'use client';

import { CheckCircle, XCircle, AlertTriangle, Clock, HelpCircle, FileText } from 'lucide-react';
import styles from './ClienteSituacaoFiscal.module.css';

interface Obrigacao {
  id: string;
  tipo: string;
  ano: number;
  mes: number;
  status: string;
  dataVencimento: Date | null;
  createdAt: Date;
}

interface Cliente {
  id: string;
  nomeRazao: string;
  documento: string;
  situacaoFiscal: string;
}

interface Props {
  cliente: Cliente;
  obligationsByStatus: Record<string, Obrigacao[]>;
  hasOverdue: boolean;
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[month - 1] || '';
}

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDocumento(doc: string): string {
  if (doc.length === 14) {
    return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8, 12)}-${doc.slice(12)}`;
  }
  if (doc.length === 11) {
    return `${doc.slice(0, 3)}.${doc.slice(3, 6)}.${doc.slice(6, 9)}-${doc.slice(9)}`;
  }
  return doc;
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    DCTFWEB: 'DCTFWeb',
    EFD_ICMS_IPI: 'EFD ICMS IPI',
    DEFIS: 'DEFIS',
    DMED: 'DMED',
    ECD_SPED: 'ECD SPED',
    ECF_SPED: 'ECF SPED',
    EFD_CONTRIBUICOES: 'EFD Contribuições',
    ESOCIAL: 'eSocial',
    PGDAS: 'PGDAS',
    REINF_R2099: 'REINF R-2099',
    REINF_R4099: 'REINF R-4099',
  };
  return labels[tipo] || tipo;
}

const statusConfig = {
  ENTREGUE: { icon: CheckCircle, color: '#059669', label: 'Entregue', class: 'success' },
  NAO_ENTREGUE: { icon: XCircle, color: '#dc2626', label: 'Não Entregue', class: 'danger' },
  INCONSISTENCIA: {
    icon: AlertTriangle,
    color: '#d97706',
    label: 'Inconsistência',
    class: 'warning',
  },
  EM_PROCESSAMENTO: { icon: Clock, color: '#2563eb', label: 'Em Processamento', class: 'info' },
  OUTROS: { icon: HelpCircle, color: '#6b7280', label: 'Outros', class: 'neutral' },
};

export function ClienteSituacaoFiscal({ cliente, obligationsByStatus, hasOverdue }: Props) {
  const totalObrigacoes = Object.values(obligationsByStatus).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return (
    <div className={styles.container}>
      {/* Summary Card */}
      <div className={`${styles.summaryCard} ${hasOverdue ? styles.overdue : ''}`}>
        <div className={styles.summaryHeader}>
          <div>
            <h2 className={styles.summaryTitle}>{cliente.nomeRazao}</h2>
            <p className={styles.summaryDoc}>{formatDocumento(cliente.documento)}</p>
          </div>
          <span className={`${styles.statusBadge} ${styles[cliente.situacaoFiscal.toLowerCase()]}`}>
            {cliente.situacaoFiscal === 'REGULAR'
              ? 'Regular'
              : cliente.situacaoFiscal === 'REGULARIZADO'
                ? 'Regularizado'
                : 'Irregular'}
          </span>
        </div>

        <div className={styles.statsGrid}>
          {Object.entries(obligationsByStatus).map(([status, obs]) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            if (obs.length === 0) return null;
            return (
              <div key={status} className={`${styles.statItem} ${styles[config.class]}`}>
                <span className={styles.statValue}>{obs.length}</span>
                <span className={styles.statLabel}>{config.label}</span>
              </div>
            );
          })}
        </div>

        {hasOverdue && (
          <div className={styles.overdueAlert}>
            <AlertTriangle size={18} />
            <span>Este cliente possui obrigações fiscais em atraso</span>
          </div>
        )}
      </div>

      {/* Obligations by Status */}
      <div className={styles.sections}>
        {Object.entries(statusConfig).map(([status, config]) => {
          const obs = obligationsByStatus[status];
          if (obs.length === 0) return null;

          return (
            <div key={status} className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <config.icon size={18} style={{ color: config.color }} />
                {config.label} ({obs.length})
              </h3>
              <div className={styles.obrigacoesList}>
                {obs.map(o => (
                  <div key={o.id} className={styles.obrigacaoItem}>
                    <div className={styles.obrigacaoMain}>
                      <span className={styles.obrigacaoTipo}>{getTipoLabel(o.tipo)}</span>
                      <span className={styles.obrigacaoPeriodo}>
                        {getMonthName(o.mes)}/{o.ano}
                      </span>
                    </div>
                    <div className={styles.obrigacaoMeta}>
                      <span>Vencimento: {formatDate(o.dataVencimento)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {totalObrigacoes === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <p>Nenhuma obrigação fiscal registrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
