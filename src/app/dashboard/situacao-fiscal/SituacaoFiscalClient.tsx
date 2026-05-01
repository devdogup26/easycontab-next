'use client';

import { DoughnutChart } from '@/components/charts';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';

interface Cliente {
  id: string;
  nomeRazao: string;
  documento: string;
}

interface Stats {
  total: number;
  regular: number;
  regularizado: number;
  irregular: number;
}

interface SituacaoFiscalClientProps {
  stats: Stats;
  clientesRegular: Cliente[];
  clientesRegularizado: Cliente[];
  clientesIrregular: Cliente[];
}

export function SituacaoFiscalClient({
  stats,
  clientesRegular,
  clientesRegularizado,
  clientesIrregular,
}: SituacaoFiscalClientProps) {
  const chartData = [
    { name: 'Regular', value: stats.regular, color: '#10b981' },
    { name: 'Regularizado', value: stats.regularizado, color: '#f59e0b' },
    { name: 'Irregular', value: stats.irregular, color: '#ef4444' },
  ];

  const regularPercent = stats.total > 0 ? ((stats.regular / stats.total) * 100).toFixed(1) : '0';
  const regularizadoPercent =
    stats.total > 0 ? ((stats.regularizado / stats.total) * 100).toFixed(1) : '0';
  const irregularPercent =
    stats.total > 0 ? ((stats.irregular / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className={styles.content}>
      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Left - Doughnut Chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartCard}>
            <DoughnutChart
              data={chartData}
              title="Distribuição de Regularidade Fiscal"
              centerLabel="Total"
              centerValue={stats.total.toString()}
            />

            {/* Legend with details */}
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendSuccess}`}>
                  <CheckCircle size={16} />
                </div>
                <div className={styles.legendContent}>
                  <span className={styles.legendLabel}>Regular</span>
                  <span className={styles.legendValue}>
                    {stats.regular} clientes ({regularPercent}%)
                  </span>
                </div>
              </div>

              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendWarning}`}>
                  <Clock size={16} />
                </div>
                <div className={styles.legendContent}>
                  <span className={styles.legendLabel}>Regularizado</span>
                  <span className={styles.legendValue}>
                    {stats.regularizado} clientes ({regularizadoPercent}%)
                  </span>
                </div>
              </div>

              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendDanger}`}>
                  <AlertTriangle size={16} />
                </div>
                <div className={styles.legendContent}>
                  <span className={styles.legendLabel}>Irregular</span>
                  <span className={styles.legendValue}>
                    {stats.irregular} clientes ({irregularPercent}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Client Lists */}
        <div className={styles.listsSection}>
          {/* Regular */}
          <div className={styles.clientListCard}>
            <div className={`${styles.listHeader} ${styles.listHeaderSuccess}`}>
              <CheckCircle size={18} />
              <span>Regular ({stats.regular})</span>
            </div>
            <div className={styles.clientList}>
              {clientesRegular.length === 0 ? (
                <div className={styles.emptyList}>Nenhum cliente regular</div>
              ) : (
                clientesRegular.map(c => (
                  <div key={c.id} className={styles.clientItem}>
                    <span className={styles.clientName}>{c.nomeRazao}</span>
                    <span className={styles.clientDoc}>{c.documento}</span>
                  </div>
                ))
              )}
              {stats.regular > 20 && (
                <div className={styles.moreIndicator}>+{stats.regular - 20} outros</div>
              )}
            </div>
          </div>

          {/* Regularizado */}
          <div className={styles.clientListCard}>
            <div className={`${styles.listHeader} ${styles.listHeaderWarning}`}>
              <Clock size={18} />
              <span>Regularizado ({stats.regularizado})</span>
            </div>
            <div className={styles.clientList}>
              {clientesRegularizado.length === 0 ? (
                <div className={styles.emptyList}>Nenhum cliente regularizado</div>
              ) : (
                clientesRegularizado.map(c => (
                  <div key={c.id} className={styles.clientItem}>
                    <span className={styles.clientName}>{c.nomeRazao}</span>
                    <span className={styles.clientDoc}>{c.documento}</span>
                  </div>
                ))
              )}
              {stats.regularizado > 20 && (
                <div className={styles.moreIndicator}>+{stats.regularizado - 20} outros</div>
              )}
            </div>
          </div>

          {/* Irregular */}
          <div className={styles.clientListCard}>
            <div className={`${styles.listHeader} ${styles.listHeaderDanger}`}>
              <AlertTriangle size={18} />
              <span>Irregular ({stats.irregular})</span>
            </div>
            <div className={styles.clientList}>
              {clientesIrregular.length === 0 ? (
                <div className={styles.emptyList}>Nenhum cliente irregular</div>
              ) : (
                clientesIrregular.map(c => (
                  <div key={c.id} className={styles.clientItem}>
                    <span className={styles.clientName}>{c.nomeRazao}</span>
                    <span className={styles.clientDoc}>{c.documento}</span>
                  </div>
                ))
              )}
              {stats.irregular > 20 && (
                <div className={styles.moreIndicator}>+{stats.irregular - 20} outros</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
