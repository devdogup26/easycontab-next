'use client';

import { DoughnutChart, DCTFWebProgressBar, FiscalSituationChart } from '@/components/charts';
import {
  AlertTriangle,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  Bell,
  CheckCircle,
} from 'lucide-react';
import styles from './page.module.css';

interface DashboardStats {
  totalClientes: number;
  simplesNacionalCount: number;
  normalCount: number;
  regularCount: number;
  regularizadoCount: number;
  irregularCount: number;
}

interface DCTFWebStats {
  total: number;
  entregue: number;
  naoEntregue: number;
  inconsistencia: number;
  emProcessamento: number;
  outros: number;
}

interface ECACAlert {
  count: number;
  messages: {
    id: string;
    titulo: string;
    clienteNome: string;
    tipo: string;
    data: string;
  }[];
}

interface ParcelamentoAlert {
  pgfnTotal: number;
  pgfnAtraso: number;
  simplesTotal: number;
  simplesAtraso: number;
  simplificadoTotal: number;
  simplificadoAtraso: number;
  naoPrevTotal: number;
  naoPrevAtraso: number;
  prevTotal: number;
  prevAtraso: number;
}

interface DashboardData {
  stats: DashboardStats;
  dctfweb: DCTFWebStats;
  ecacAlert: ECACAlert;
  parcelamentoAlert: ParcelamentoAlert;
}

interface DashboardCardsProps {
  data: DashboardData;
}

export function DashboardCards({ data }: DashboardCardsProps) {
  const { stats, dctfweb, ecacAlert, parcelamentoAlert } = data;

  const simplesPercent =
    stats.totalClientes > 0
      ? ((stats.simplesNacionalCount / stats.totalClientes) * 100).toFixed(1)
      : '0';
  const normalPercent =
    stats.totalClientes > 0 ? ((stats.normalCount / stats.totalClientes) * 100).toFixed(1) : '0';

  return (
    <div className={styles.dashboardContent}>
      {/* Dashboard Header with stats */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerStat}>
          <Users size={24} className={styles.headerIcon} />
          <div className={styles.headerStatContent}>
            <span className={styles.headerStatValue}>{stats.totalClientes}</span>
            <span className={styles.headerStatLabel}>CNPJs Ativos</span>
          </div>
        </div>
        <div className={styles.headerDivider} />
        <div className={styles.headerStatGroup}>
          <span className={styles.regime}>
            <span className={styles.regimeLabel}>Simples Nacional</span>
            <span className={styles.regimeValue}>
              {stats.simplesNacionalCount} ({simplesPercent}%)
            </span>
          </span>
          <span className={styles.regime}>
            <span className={styles.regimeLabel}>Normal</span>
            <span className={styles.regimeValue}>
              {stats.normalCount} ({normalPercent}%)
            </span>
          </span>
        </div>
        <div className={styles.headerDivider} />
        <div className={`${styles.headerStat} ${styles.headerStatSuccess}`}>
          <CheckCircle size={24} className={styles.headerIconSuccess} />
          <div className={styles.headerStatContent}>
            <span className={styles.headerStatValue}>
              {stats.regularCount + stats.regularizadoCount}
            </span>
            <span className={styles.headerStatLabel}>Em Conformidade</span>
          </div>
        </div>
      </div>

      {/* e-CAC Alert Banner */}
      {ecacAlert.count > 0 && (
        <div className={styles.eCACBanner}>
          <div className={styles.eCACBannerIcon}>
            <Bell size={20} />
          </div>
          <p className={styles.eCACBannerText}>
            Você tem <strong>{ecacAlert.count} mensagens relevantes</strong> não lidas no e-CAC.
            Ignorar essas mensagens pode afetar a consulta de obrigações e situação fiscal.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* DCTFWeb Progress */}
          <div className={`${styles.glassCard} ${styles.fullWidth}`}>
            <div className={styles.cardHeader}>
              <FileText size={20} />
              <span>DCTFWeb em Andamento</span>
              <span className={styles.cardCount}>{dctfweb.total}</span>
            </div>
            <DCTFWebProgressBar
              entregue={dctfweb.entregue}
              naoEntregue={dctfweb.naoEntregue}
              inconsistencia={dctfweb.inconsistencia}
              emProcessamento={dctfweb.emProcessamento}
              outros={dctfweb.outros}
            />
          </div>

          {/* Parcelamentos Alert */}
          <div className={`${styles.glassCard} ${styles.fullWidth}`}>
            <div className={styles.cardHeader}>
              <CreditCard size={20} />
              <span>Parcelamentos Federais</span>
            </div>
            <div className={styles.parcelamentosGrid}>
              <ParcelamentoBadge
                label="PGFN"
                total={parcelamentoAlert.pgfnTotal}
                atrasado={parcelamentoAlert.pgfnAtraso}
              />
              <ParcelamentoBadge
                label="Simples Nacional"
                total={parcelamentoAlert.simplesTotal}
                atrasado={parcelamentoAlert.simplesAtraso}
              />
              <ParcelamentoBadge
                label="Simplificado"
                total={parcelamentoAlert.simplificadoTotal}
                atrasado={parcelamentoAlert.simplificadoAtraso}
              />
              <ParcelamentoBadge
                label="Não Prev."
                total={parcelamentoAlert.naoPrevTotal}
                atrasado={parcelamentoAlert.naoPrevAtraso}
              />
              <ParcelamentoBadge
                label="Prev."
                total={parcelamentoAlert.prevTotal}
                atrasado={parcelamentoAlert.prevAtraso}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Fiscal Situation */}
        <div className={styles.rightColumn}>
          <div className={`${styles.glassCard} ${styles.fiscalCard}`}>
            <FiscalSituationChart
              regular={stats.regularCount}
              regularizado={stats.regularizadoCount}
              irregular={stats.irregularCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ParcelamentoBadge({
  label,
  total,
  atrasado,
}: {
  label: string;
  total: number;
  atrasado: number;
}) {
  return (
    <div className={`${styles.parcelamentoBadge} ${atrasado > 0 ? styles.parcelamentoAtraso : ''}`}>
      <div className={styles.parcelamentoHeader}>
        <span className={styles.parcelamentoLabel}>{label}</span>
        {atrasado > 0 && (
          <span className={styles.parcelamentoUrgency}>
            <AlertTriangle size={12} />
            <sup>{atrasado}</sup>
          </span>
        )}
      </div>
      <div className={styles.parcelamentoStats}>
        <span className={styles.parcelamentoTotal}>{total}</span>
        <span className={styles.parcelamentoAtrasoLabel}>
          {atrasado > 0 ? `${atrasado} em atraso` : 'em dia'}
        </span>
      </div>
    </div>
  );
}
