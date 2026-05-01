'use client';

import { AlertTriangle, CreditCard } from 'lucide-react';
import styles from './page.module.css';

interface Parcelamento {
  id: string;
  clienteNome: string;
  documento: string;
  tipo: string;
  total: number;
  parcelas: number;
  parcelasEmAtraso: number;
  valorAtraso: number;
  inicio: string;
}

interface Stats {
  [key: string]: {
    total: number;
    totalAtraso: number;
    valorTotal: number;
  };
}

interface ParcelamentosClientProps {
  parcelamentos: Parcelamento[];
  stats: Stats;
}

const TIPO_LABELS: Record<string, string> = {
  PGFN: 'PGFN',
  SIMPLES_NACIONAL: 'Simples Nacional',
  SIMPLIFICADO: 'Simplificado',
  PREVIDENCIARIO: 'Previdenciário',
  NAO_PREVIDENCIARIO: 'Não Previenciário',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function ParcelamentosClient({ parcelamentos, stats }: ParcelamentosClientProps) {
  const tipos = [
    'PGFN',
    'SIMPLES_NACIONAL',
    'SIMPLIFICADO',
    'PREVIDENCIARIO',
    'NAO_PREVIDENCIARIO',
  ];

  return (
    <div className={styles.content}>
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {tipos.map(tipo => {
          const stat = stats[tipo];
          if (!stat || stat.total === 0) return null;

          const hasAtraso = stat.totalAtraso > 0;

          return (
            <div
              key={tipo}
              className={`${styles.statCard} ${hasAtraso ? styles.statCardAtraso : ''}`}
            >
              {hasAtraso && (
                <div className={styles.urgencyDot} />
              )}
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>{TIPO_LABELS[tipo]}</span>
                {hasAtraso && (
                  <span className={styles.atrasoCounter}>
                    <sup>{stat.totalAtraso}</sup>
                  </span>
                )}
              </div>
              <div className={styles.statValue}>{stat.total}</div>
              <div className={styles.statMeta}>
                <span className={hasAtraso ? styles.atrasoText : styles.emDiaText}>
                  {hasAtraso ? `${stat.totalAtraso} em atraso` : 'Em dia'}
                </span>
                <span className={styles.statValor}>{formatCurrency(stat.valorTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>Todas as Parcelamentos</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Parcelas</th>
                <th>Em Atraso</th>
                <th>Valor Atraso</th>
                <th>Início</th>
              </tr>
            </thead>
            <tbody>
              {parcelamentos.map(p => (
                <tr key={p.id} className={p.parcelasEmAtraso > 0 ? styles.rowAtraso : ''}>
                  <td>
                    <div className={styles.clienteCell}>
                      <span className={styles.clienteNome}>{p.clienteNome}</span>
                      <span className={styles.clienteDoc}>{p.documento}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.tipoBadge}>{TIPO_LABELS[p.tipo] || p.tipo}</span>
                  </td>
                  <td>{formatCurrency(p.total)}</td>
                  <td>{p.parcelas}</td>
                  <td>
                    {p.parcelasEmAtraso > 0 ? (
                      <span className={styles.badgeDanger}>
                        <AlertTriangle size={12} />
                        {p.parcelasEmAtraso}
                      </span>
                    ) : (
                      <span className={styles.badgeSuccess}>0</span>
                    )}
                  </td>
                  <td>
                    {p.valorAtraso > 0 ? (
                      <span className={styles.valorAtraso}>{formatCurrency(p.valorAtraso)}</span>
                    ) : (
                      <span className={styles.noValue}>-</span>
                    )}
                  </td>
                  <td>{p.inicio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
