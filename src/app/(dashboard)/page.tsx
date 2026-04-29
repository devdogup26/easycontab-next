import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const contadorId = (session.user as any).contadorId

  // Fetch stats for this contador
  const [clienteCount, obrigacaoCount, obrigacoesPendentes] = await Promise.all([
    prisma.clienteFinal.count({ where: { contadorId } }),
    prisma.obrigacao.count({ where: { cliente: { contadorId } } }),
    prisma.obrigacao.count({
      where: {
        cliente: { contadorId },
        status: { in: ['NAO_ENTREGUE', 'INCONSISTENCIA', 'OUTROS'] }
      }
    })
  ])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Bem-vindo, {(session.user as any).nome}
          </p>
        </div>
        <div className={styles.contadorBadge}>
          {(session.user as any).contadorNome}
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>👥</div>
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>{clienteCount}</span>
            <span className={styles.cardLabel}>Clientes</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>📋</div>
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>{obrigacaoCount}</span>
            <span className={styles.cardLabel}>Obrigações</span>
          </div>
        </div>

        <div className={styles.cardWarning}>
          <div className={styles.cardIcon}>⚠️</div>
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>{obrigacoesPendentes}</span>
            <span className={styles.cardLabel}>Pendentes</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>✅</div>
          <div className={styles.cardContent}>
            <span className={styles.cardValue}>
              {obrigacaoCount - obrigacoesPendentes}
            </span>
            <span className={styles.cardLabel}>Entregues</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Acesso Rápido</h2>
        <div className={styles.quickAccess}>
          <a href="/dashboard/clientes" className={styles.quickLink}>
            👥 Gerenciar Clientes
          </a>
          <a href="/dashboard/obrigacoes" className={styles.quickLink}>
            📋 Obrigações Fiscais
          </a>
          <a href="/dashboard/situacao-fiscal" className={styles.quickLink}>
            🛡️ Situação Fiscal
          </a>
        </div>
      </div>
    </div>
  )
}