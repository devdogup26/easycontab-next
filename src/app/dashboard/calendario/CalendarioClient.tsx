'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Clock, CheckCircle, CreditCard, FileText, Award } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

interface Obligation {
  id: string;
  tipo: string;
  clienteId: string;
  clienteNome: string;
  dataVencimento: Date | null;
  status: string;
  ano: number;
  mes: number;
}

interface Parcelamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: string;
  inicio: Date;
  total: number;
  parcelas: number;
  parcelasEmAtraso: number;
}

interface Certificado {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: string;
  validade: Date;
  status: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  obligations: Obligation[];
  parcelamentos: Parcelamento[];
  certificados: Certificado[];
}

interface CalendarioClientProps {
  currentMonth: number;
  currentYear: number;
  calendarDays: CalendarDay[];
  monthStats: {
    overdue: number;
    dueToday: number;
    upcoming: number;
  };
  obligations: Obligation[];
  parcelamentos: Parcelamento[];
  certificados: Certificado[];
}

const TIPO_LABELS: Record<string, string> = {
  DCTFWEB: 'DCTFWeb',
  EFD_ICMS_IPI: 'EFD ICMS/IPI',
  DEFIS: 'DEFIS',
  DMED: 'DMED',
  ECD_SPED: 'ECD/SPED',
  ECF_SPED: 'ECF/SPED',
  EFD_CONTRIBUICOES: 'EFD Contribuições',
  ESOCIAL: 'eSocial',
  PGDAS: 'PGDAS',
  REINF_R2099: 'REINF R-2099',
  REINF_R4099: 'REINF R-4099',
  PGFN: 'PGFN',
  SIMPLES_NACIONAL: 'Simples Nacional',
  SIMPLIFICADO: 'Simplificado',
  PREVIDENCIARIO: 'Previdenciário',
  NAO_PREVIDENCIARIO: 'Não Previenciário',
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'ENTREGUE':
      return styles.statusSuccess;
    case 'NAO_ENTREGUE':
      return styles.statusDanger;
    case 'INCONSISTENCIA':
      return styles.statusWarning;
    default:
      return styles.statusNeutral;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ENTREGUE':
      return 'Entregue';
    case 'NAO_ENTREGUE':
      return 'Não Entregue';
    case 'INCONSISTENCIA':
      return 'Inconsistência';
    case 'EM_PROCESSAMENTO':
      return 'Em Processamento';
    default:
      return status;
  }
}

export function CalendarioClient({
  currentMonth,
  currentYear,
  calendarDays,
  monthStats,
  obligations,
  parcelamentos,
  certificados,
}: CalendarioClientProps) {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const totalItems = obligations.length + parcelamentos.length + certificados.length;
  const hasOverdue = monthStats.overdue > 0;
  const hasDueToday = monthStats.dueToday > 0;

  return (
    <div className={styles.content}>
      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={`${styles.statItem} ${hasOverdue ? styles.statItemDanger : ''}`}>
          <AlertTriangle size={18} />
          <span className={styles.statLabel}>Vencidas</span>
          <span className={styles.statValue}>{monthStats.overdue}</span>
        </div>
        <div className={`${styles.statItem} ${hasDueToday ? styles.statItemWarning : ''}`}>
          <Clock size={18} />
          <span className={styles.statLabel}>Vence Hoje</span>
          <span className={styles.statValue}>{monthStats.dueToday}</span>
        </div>
        <div className={styles.statItem}>
          <Calendar size={18} />
          <span className={styles.statLabel}>Próximas</span>
          <span className={styles.statValue}>{monthStats.upcoming}</span>
        </div>
        <div className={styles.statItem}>
          <FileText size={18} />
          <span className={styles.statLabel}>Obrigações</span>
          <span className={styles.statValue}>{obligations.length}</span>
        </div>
        <div className={styles.statItem}>
          <CreditCard size={18} />
          <span className={styles.statLabel}>Parcelamentos</span>
          <span className={styles.statValue}>{parcelamentos.length}</span>
        </div>
        <div className={styles.statItem}>
          <Award size={18} />
          <span className={styles.statLabel}>Certificados</span>
          <span className={styles.statValue}>{certificados.length}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarCard}>
        {/* Calendar Header */}
        <div className={styles.calendarHeader}>
          <div className={styles.monthYear}>
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </div>
          <div className={styles.navButtons}>
            <button className={styles.navButton} disabled>
              <ChevronLeft size={20} />
            </button>
            <button className={styles.navButton} disabled>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className={styles.dayHeaders}>
          {DAY_NAMES.map(day => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const hasItems = day.obligations.length > 0 || day.parcelamentos.length > 0 || day.certificados.length > 0;
            const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();

            return (
              <div
                key={index}
                className={`
                  ${styles.dayCell}
                  ${!day.isCurrentMonth ? styles.otherMonth : ''}
                  ${day.isToday ? styles.today : ''}
                  ${hasItems ? styles.hasItems : ''}
                  ${isSelected ? styles.selected : ''}
                `}
                onClick={() => setSelectedDay(day)}
              >
                <span className={styles.dayNumber}>{day.day}</span>
                {hasItems && (
                  <div className={styles.itemIndicators}>
                    {day.obligations.length > 0 && (
                      <div className={`${styles.indicator} ${styles.indicatorObligacao}`}>
                        {day.obligations.length}
                      </div>
                    )}
                    {day.parcelamentos.length > 0 && (
                      <div className={`${styles.indicator} ${styles.indicatorParcelamento}`}>
                        {day.parcelamentos.length}
                      </div>
                    )}
                    {day.certificados.length > 0 && (
                      <div className={`${styles.indicator} ${styles.indicatorCertificado}`}>
                        {day.certificados.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendObligacao}`} />
            <span>Obrigação</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendParcelamento}`} />
            <span>Parcelamento</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendCertificado}`} />
            <span>Certificado</span>
          </div>
        </div>
      </div>

      {/* Day Details Panel */}
      {selectedDay && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsHeader}>
            <h3 className={styles.detailsTitle}>
              {selectedDay.date.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedDay(null)}
            >
              ×
            </button>
          </div>

          <div className={styles.detailsContent}>
            {/* Obligations */}
            {selectedDay.obligations.length > 0 && (
              <div className={styles.detailsSection}>
                <h4 className={styles.detailsSectionTitle}>
                  <FileText size={16} />
                  Obrigações ({selectedDay.obligations.length})
                </h4>
                <div className={styles.detailsList}>
                  {selectedDay.obligations.map(o => (
                    <div key={o.id} className={styles.detailsItem}>
                      <div className={styles.itemMain}>
                        <span className={styles.itemTipo}>{TIPO_LABELS[o.tipo] || o.tipo}</span>
                        <Link
                          href={`/dashboard/clientes/${o.clienteId}`}
                          className={styles.itemCliente}
                        >
                          {o.clienteNome}
                        </Link>
                      </div>
                      <div className={styles.itemMeta}>
                        <span className={`${styles.statusBadge} ${getStatusClass(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </span>
                        <span className={styles.itemDate}>
                          Vencimento: {formatDate(o.dataVencimento)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parcelamentos */}
            {selectedDay.parcelamentos.length > 0 && (
              <div className={styles.detailsSection}>
                <h4 className={styles.detailsSectionTitle}>
                  <CreditCard size={16} />
                  Parcelamentos ({selectedDay.parcelamentos.length})
                </h4>
                <div className={styles.detailsList}>
                  {selectedDay.parcelamentos.map(p => (
                    <div key={p.id} className={styles.detailsItem}>
                      <div className={styles.itemMain}>
                        <span className={styles.itemTipo}>{TIPO_LABELS[p.tipo] || p.tipo}</span>
                        <Link
                          href={`/dashboard/clientes/${p.clienteId}`}
                          className={styles.itemCliente}
                        >
                          {p.clienteNome}
                        </Link>
                      </div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemDate}>
                          {p.parcelas} parcelas
                        </span>
                        {p.parcelasEmAtraso > 0 && (
                          <span className={styles.atrasoBadge}>
                            <AlertTriangle size={12} />
                            {p.parcelasEmAtraso} em atraso
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificados */}
            {selectedDay.certificados.length > 0 && (
              <div className={styles.detailsSection}>
                <h4 className={styles.detailsSectionTitle}>
                  <Award size={16} />
                  Certificados ({selectedDay.certificados.length})
                </h4>
                <div className={styles.detailsList}>
                  {selectedDay.certificados.map(c => (
                    <div key={c.id} className={styles.detailsItem}>
                      <div className={styles.itemMain}>
                        <span className={styles.itemTipo}>Certificado {c.tipo}</span>
                        <Link
                          href={`/dashboard/clientes/${c.clienteId}`}
                          className={styles.itemCliente}
                        >
                          {c.clienteNome}
                        </Link>
                      </div>
                      <div className={styles.itemMeta}>
                        <span className={`${styles.statusBadge} ${c.status === 'VALIDO' ? styles.statusSuccess : styles.statusDanger}`}>
                          {c.status === 'VALIDO' ? 'Válido' : 'Vencido'}
                        </span>
                        <span className={styles.itemDate}>
                          Validade: {formatDate(c.validade)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Day */}
            {selectedDay.obligations.length === 0 &&
              selectedDay.parcelamentos.length === 0 &&
              selectedDay.certificados.length === 0 && (
                <div className={styles.emptyDay}>
                  <Calendar size={32} />
                  <p>Nenhum evento neste dia</p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className={styles.emptyState}>
          <Calendar size={48} />
          <h3>Nenhum evento este mês</h3>
          <p>Não há obrigações, parcelamentos ou certificados com vencimento neste mês.</p>
        </div>
      )}
    </div>
  );
}
