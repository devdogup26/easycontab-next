import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import Link from 'next/link'
import {
  Building2, Users, UserCheck, AlertTriangle, TrendingUp,
  FileText, CheckCircle, Clock, Shield, ArrowRight, Calendar
} from 'lucide-react'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) redirect('/dashboard')

  // Fetch all data
  const [
    contadores,
    stats,
    clientesPorSituacao,
    obrigacoesPorStatus,
    recentClientes,
    topEscritorios
  ] = await Promise.all([
    prisma.contador.findMany({
      include: {
        _count: { select: { clientes: true, usuarios: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.$transaction([
      prisma.contador.count(),
      prisma.clienteFinal.count(),
      prisma.usuario.count(),
      prisma.obrigacao.count({ where: { status: 'NAO_ENTREGUE' } }),
      prisma.clienteFinal.count({ where: { situacaoFiscal: 'IRREGULAR' } }),
      prisma.clienteFinal.count({ where: { regime: 'SIMPLES_NACIONAL' } })
    ]),
    prisma.clienteFinal.groupBy({
      by: ['situacaoFiscal'],
      _count: true
    }),
    prisma.obrigacao.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.clienteFinal.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { contador: { select: { nome: true } } }
    }),
    prisma.contador.findMany({
      take: 5,
      orderBy: { clientes: { _count: 'desc' } },
      include: {
        _count: { select: { clientes: true, usuarios: true } },
        clientes: {
          where: { situacaoFiscal: 'REGULAR' },
          select: { id: true }
        }
      }
    })
  ])

  const [
    totalEscritorios,
    totalClientes,
    totalUsuarios,
    obrigacoesAtrasadas,
    clientesIrregulares,
    clientesSimples
  ] = stats

  const maxClientes = Math.max(...contadores.map(c => c._count.clientes), 1)

  const situacaoMap = Object.fromEntries(clientesPorSituacao.map(s => [s.situacaoFiscal, s._count]))
  const statusMap = Object.fromEntries(obrigacoesPorStatus.map(s => [s.status, s._count]))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel Administrativo</h1>
          <p className={styles.subtitle}>Visão geral da plataforma</p>
        </div>
        <Link href="/dashboard/contadores" className={styles.manageBtn}>
          <span>Gerenciar Escritórios</span>
          <ArrowRight size={16} />
        </Link>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Building2 size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalEscritorios}</span>
            <span className={styles.statLabel}>Escritórios</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalClientes.toLocaleString('pt-BR')}</span>
            <span className={styles.statLabel}>Clientes</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <UserCheck size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalUsuarios}</span>
            <span className={styles.statLabel}>Usuários</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{obrigacoesAtrasadas}</span>
            <span className={styles.statLabel}>Obrigações Atrasadas</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.gridTwo}>
        {/* Left Column */}
        <div className={styles.column}>
          {/* Fiscal Situation Card */}
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
                  <div className={styles.situacaoProgress} style={{
                    width: `${((situacaoMap['REGULAR'] || 0) / totalClientes) * 100}%`,
                    background: 'linear-gradient(90deg, #10b981, #34d399)'
                  }} />
                </div>
              </div>
              <div className={styles.situacaoItem}>
                <span className={styles.situacaoValue}>{situacaoMap['REGULARIZADO'] || 0}</span>
                <span className={styles.situacaoLabel}>Regularizado</span>
                <div className={styles.situacaoBar}>
                  <div className={styles.situacaoProgress} style={{
                    width: `${((situacaoMap['REGULARIZADO'] || 0) / totalClientes) * 100}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  }} />
                </div>
              </div>
              <div className={styles.situacaoItem}>
                <span className={styles.situacaoValue}>{situacaoMap['IRREGULAR'] || 0}</span>
                <span className={styles.situacaoLabel}>Irregular</span>
                <div className={styles.situacaoBar}>
                  <div className={styles.situacaoProgress} style={{
                    width: `${((situacaoMap['IRREGULAR'] || 0) / totalClientes) * 100}%`,
                    background: 'linear-gradient(90deg, #ef4444, #f87171)'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Obrigações Status Card */}
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

        {/* Right Column */}
        <div className={styles.column}>
          {/* Top Escritórios Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <TrendingUp size={18} />
                Top 5 Escritórios
              </h2>
              <Link href="/dashboard/contadores" className={styles.cardLink}>Ver todos</Link>
            </div>
            <div className={styles.topList}>
              {topEscritorios.map((esc, idx) => (
                <div key={esc.id} className={styles.topItem}>
                  <span className={styles.topRank}>#{idx + 1}</span>
                  <div className={styles.topInfo}>
                    <span className={styles.topName}>{esc.nome}</span>
                    <span className={styles.topMeta}>{esc.cidade || 'Sem cidade'} • {esc._count.clientes} clientes</span>
                  </div>
                  <div className={styles.topStats}>
                    <span className={styles.topClients}>{esc._count.clientes}</span>
                    <span className={styles.topClientsLabel}>clientes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Clients Card */}
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
                      {cliente.contador.nome} • {cliente.regime.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`${styles.situacaoBadge} ${styles[`badge${cliente.situacaoFiscal}`]}`}>
                    {cliente.situacaoFiscal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Escritórios Chart */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Building2 size={18} />
            Distribuição de Clientes por Escritório
          </h2>
        </div>
        <div className={styles.chartList}>
          {contadores
            .sort((a, b) => b._count.clientes - a._count.clientes)
            .slice(0, 8)
            .map(esc => (
              <div key={esc.id} className={styles.chartItem}>
                <div className={styles.chartInfo}>
                  <span className={styles.chartName}>{esc.nome}</span>
                  <span className={styles.chartMeta}>{esc._count.usuarios} usuários</span>
                </div>
                <div className={styles.chartBar}>
                  <div
                    className={styles.chartProgress}
                    style={{ width: `${(esc._count.clientes / maxClientes) * 100}%` }}
                  />
                </div>
                <span className={styles.chartValue}>{esc._count.clientes}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}