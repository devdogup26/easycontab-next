import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import {
  Users,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  Shield,
  Calendar,
} from 'lucide-react';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const globalRole = (session.user as any).globalRole;
  if (globalRole !== 'ADMIN') redirect('/dashboard');

  const escritorioId = (session.user as any).escritorioId;

  const [
    stats,
    clientesPorSituacao,
    obrigacoesPorStatus,
    recentClientes,
  ] = await Promise.all([
    prisma.$transaction([
      prisma.clienteFinal.count({ where: { escritorioId } }),
      prisma.obrigacao.count({ where: { status: 'NAO_ENTREGUE', cliente: { escritorioId } } }),
      prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'IRREGULAR' } }),
      prisma.clienteFinal.count({ where: { escritorioId, regime: 'SIMPLES_NACIONAL' } }),
    ]),
    prisma.clienteFinal.groupBy({
      by: ['situacaoFiscal'],
      _count: true,
      where: { escritorioId },
    }),
    prisma.obrigacao.groupBy({
      by: ['status'],
      _count: true,
      where: { cliente: { escritorioId } },
    }),
    prisma.clienteFinal.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { escritorioId },
      include: { escritorio: { select: { nome: true } } },
    }),
  ]);

  const [
    totalClientes,
    obrigacoesAtrasadas,
    clientesIrregulares,
    clientesSimples,
  ] = stats;

  const situacaoMap = Object.fromEntries(
    clientesPorSituacao.map(s => [s.situacaoFiscal, s._count])
  );
  const statusMap = Object.fromEntries(obrigacoesPorStatus.map(s => [s.status, s._count]));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard do Escritório</h1>
          <p className={styles.subtitle}>Visão geral do seu escritório</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
          >
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalClientes.toLocaleString('pt-BR')}</span>
            <span className={styles.statLabel}>Clientes</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
          >
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{obrigacoesAtrasadas}</span>
            <span className={styles.statLabel}>Obrigações Atrasadas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
          >
            <Shield size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{clientesIrregulares}</span>
            <span className={styles.statLabel}>Clientes Irregulares</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
          >
            <FileText size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{clientesSimples}</span>
            <span className={styles.statLabel}>Simples Nacional</span>
          </div>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.column}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Shield size={18} />
                Situação Fiscal dos Clientes
              </h2>
            </div>
            <div className={styles.situacaoGrid}>
              <div className={styles.situacaoItem}>
                <span className={styles.situacaoValue}>{situacaoMap['REGULAR'] || 0}</span>
                <span className={styles.situacaoLabel}>Regular</span>
                <div className={styles.situacaoBar}>
                  <div
                    className={styles.situacaoProgress}
                    style={{
                      width: `${((situacaoMap['REGULAR'] || 0) / totalClientes) * 100}%`,
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                    }}
                  />
                </div>
              </div>
              <div className={styles.situacaoItem}>
                <span className={styles.situacaoValue}>{situacaoMap['REGULARIZADO'] || 0}</span>
                <span className={styles.situacaoLabel}>Regularizado</span>
                <div className={styles.situacaoBar}>
                  <div
                    className={styles.situacaoProgress}
                    style={{
                      width: `${((situacaoMap['REGULARIZADO'] || 0) / totalClientes) * 100}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    }}
                  />
                </div>
              </div>
              <div className={styles.situacaoItem}>
                <span className={styles.situacaoValue}>{situacaoMap['IRREGULAR'] || 0}</span>
                <span className={styles.situacaoLabel}>Irregular</span>
                <div className={styles.situacaoBar}>
                  <div
                    className={styles.situacaoProgress}
                    style={{
                      width: `${((situacaoMap['IRREGULAR'] || 0) / totalClientes) * 100}%`,
                      background: 'linear-gradient(90deg, #ef4444, #f87171)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <FileText size={18} />
                Status das Obrigações
              </h2>
            </div>
            <div className={styles.obrigacoesGrid}>
              <div className={styles.obrigacaoItem}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                <span className={styles.obrigacaoLabel}>Entregues</span>
                <span className={styles.obrigacaoValue}>{statusMap['ENTREGUE'] || 0}</span>
              </div>
              <div className={styles.obrigacaoItem}>
                <Clock size={20} style={{ color: '#f59e0b' }} />
                <span className={styles.obrigacaoLabel}>Não Entregues</span>
                <span className={styles.obrigacaoValue}>{statusMap['NAO_ENTREGUE'] || 0}</span>
              </div>
              <div className={styles.obrigacaoItem}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                <span className={styles.obrigacaoLabel}>Inconsistência</span>
                <span className={styles.obrigacaoValue}>{statusMap['INCONSISTENCIA'] || 0}</span>
              </div>
              <div className={styles.obrigacaoItem}>
                <TrendingUp size={20} style={{ color: '#3b82f6' }} />
                <span className={styles.obrigacaoLabel}>Em Processamento</span>
                <span className={styles.obrigacaoValue}>{statusMap['EM_PROCESSAMENTO'] || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Calendar size={18} />
                Clientes Recentes
              </h2>
            </div>
            <div className={styles.recentList}>
              {recentClientes.map(cliente => (
                <div key={cliente.id} className={styles.recentItem}>
                  <div className={styles.recentAvatar}>
                    {cliente.nomeRazao.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.recentInfo}>
                    <span className={styles.recentName}>{cliente.nomeRazao}</span>
                    <span className={styles.recentMeta}>
                      {cliente.regime.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    className={`${styles.situacaoBadge} ${styles[`badge${cliente.situacaoFiscal}`]}`}
                  >
                    {cliente.situacaoFiscal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
