'use client';

import { FileText, Building2, MapPin, ShieldCheck, ExternalLink, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import styles from './page.module.css';

interface Certidao {
  id: string;
  clienteId: string;
  clienteNome: string;
  documento: string;
  tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'CND';
  nome: string;
  validade: string | null;
  status: 'valido' | 'vencendo' | 'vencido';
  diasParaVencer: number | null;
  linkConsulta?: string;
}

interface CategoryCard {
  tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'CND';
  titulo: string;
  certidoes: Certidao[];
  stats: { total: number; validas: number; vencendo: number; vencidas: number };
}

const getCategoryIcon = (tipo: string) => {
  switch (tipo) {
    case 'FEDERAL':
      return <Building2 size={24} />;
    case 'ESTADUAL':
    case 'MUNICIPAL':
      return <MapPin size={24} />;
    case 'CND':
      return <ShieldCheck size={24} />;
    default:
      return <FileText size={24} />;
  }
};

const LINKS_CONSULTA: Record<string, string> = {
  FEDERAL: 'https://receita.fazenda.gov.br/Publica/autenticidade/index.xhtml',
  ESTADUAL: 'https://www.sefaz.sp.gov.br/consulta-cnpj/',
  MUNICIPAL: 'https://paulistafazenda.prefeitura.sp.gov.br/contas/certidao.aspx',
  CND: 'https://www.gov.br/pgfn/pt/acesso-a-informacao/divida-ativa-da-uniao/certidoes',
};

interface CertidoesClientProps {
  categoryData: CategoryCard[];
  overallStats: { total: number; validas: number; vencendo: number; vencidas: number };
  tudoOk: boolean;
}

export function CertidoesClient({ categoryData, overallStats, tudoOk }: CertidoesClientProps) {
  const getStatusBadge = (status: Certidao['status'], dias?: number | null) => {
    if (status === 'vencido') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusBadgeDanger}`}>
          <AlertTriangle size={12} />
          Vencido
        </span>
      );
    }
    if (status === 'vencendo') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>
          <Clock size={12} />
          {dias} dia{dias !== 1 ? 's' : ''}
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles.statusBadgeSuccess}`}>
        <CheckCircle size={12} />
        Válida
      </span>
    );
  };

  const getCategoryStatusClass = (stats: CategoryCard['stats']) => {
    if (stats.vencidas > 0) return styles.categoryCardDanger;
    if (stats.vencendo > 0) return styles.categoryCardWarning;
    return styles.categoryCardSuccess;
  };

  return (
    <div className={styles.content}>
      {/* Status Banner */}
      <div
        className={`${styles.statusCard} ${tudoOk ? styles.statusOk : overallStats.vencidas > 0 ? styles.statusDanger : styles.statusWarning}`}
      >
        <div className={styles.statusIcon}>
          {tudoOk ? (
            <CheckCircle size={32} />
          ) : overallStats.vencidas > 0 ? (
            <AlertTriangle size={32} />
          ) : (
            <Clock size={32} />
          )}
        </div>
        <div className={styles.statusContent}>
          {tudoOk ? (
            <>
              <h2 className={styles.statusTitle}>Certidões em dia!</h2>
              <p className={styles.statusSubtitle}>
                Todas as certidões estão válidas e com folga de prazo.
              </p>
            </>
          ) : overallStats.vencidas > 0 ? (
            <>
              <h2 className={styles.statusTitle}>Atenção: Certidões vencidas</h2>
              <p className={styles.statusSubtitle}>
                {overallStats.vencidas} certidão(ões) precisa(m) de regularização imediata.
              </p>
            </>
          ) : (
            <>
              <h2 className={styles.statusTitle}>Certidões próximas do vencimento</h2>
              <p className={styles.statusSubtitle}>
                {overallStats.vencendo} certidão(ões) vence(m) em breve. Faça a renovação com antecedência.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.statSuccess}`}>
          <CheckCircle size={20} />
          <span className={styles.statValue}>{overallStats.validas}</span>
          <span className={styles.statLabel}>Válidas</span>
        </div>
        <div className={`${styles.statCard} ${styles.statWarning}`}>
          <Clock size={20} />
          <span className={styles.statValue}>{overallStats.vencendo}</span>
          <span className={styles.statLabel}>Vencendo</span>
        </div>
        <div className={`${styles.statCard} ${styles.statDanger}`}>
          <AlertTriangle size={20} />
          <span className={styles.statValue}>{overallStats.vencidas}</span>
          <span className={styles.statLabel}>Vencidas</span>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className={styles.categoriesGrid}>
        {categoryData.map(category => (
          <div
            key={category.tipo}
            className={`${styles.categoryCard} ${getCategoryStatusClass(category.stats)}`}
          >
            <div className={styles.categoryHeader}>
              <div className={styles.categoryIcon}>{getCategoryIcon(category.tipo)}</div>
              <div className={styles.categoryTitleSection}>
                <h3 className={styles.categoryTitle}>{category.titulo}</h3>
                <span className={styles.categoryCount}>
                  {category.stats.total} certidão(ões)
                </span>
              </div>
              <a
                href={LINKS_CONSULTA[category.tipo]}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.consultLink}
              >
                <ExternalLink size={14} />
                Consultar
              </a>
            </div>

            <div className={styles.categoryStats}>
              <span className={`${styles.miniStat} ${styles.miniStatSuccess}`}>
                {category.stats.validas} válida(s)
              </span>
              <span className={`${styles.miniStat} ${styles.miniStatWarning}`}>
                {category.stats.vencendo} vencendo
              </span>
              <span className={`${styles.miniStat} ${styles.miniStatDanger}`}>
                {category.stats.vencidas} vencida(s)
              </span>
            </div>

            <div className={styles.certidoesList}>
              {category.certidoes.length === 0 ? (
                <div className={styles.emptyCategory}>Nenhuma certidão cadastrada</div>
              ) : (
                category.certidoes.map(cert => (
                  <div key={cert.id} className={styles.certidaoItem}>
                    <div className={styles.certidaoInfo}>
                      <div className={styles.certidaoClient}>
                        <span className={styles.certidaoClientName}>{cert.clienteNome}</span>
                        <span className={styles.certidaoClientDoc}>{cert.documento}</span>
                      </div>
                      <span className={styles.certidaoNome}>{cert.nome}</span>
                    </div>
                    <div className={styles.certidaoStatus}>
                      {getStatusBadge(cert.status, cert.diasParaVencer)}
                      {cert.validade && (
                        <span className={styles.certidaoValidade}>
                          {cert.validade}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}