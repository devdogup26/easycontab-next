import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function ObrigacoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const contadorId = (session.user as any).contadorId

  const obrigacoes = await prisma.obrigacao.findMany({
    where: { cliente: { contadorId } },
    include: { cliente: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const statusCounts = {
    total: obrigacoes.length,
    pendentes: obrigacoes.filter(o => ['NAO_ENTREGUE', 'INCONSISTENCIA', 'OUTROS'].includes(o.status)).length,
    entregue: obrigacoes.filter(o => o.status === 'ENTREGUE').length
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Obrigações Fiscais</h1>
          <p className={styles.subtitle}>
            Gerencie as obrigações fiscais dos seus clientes
          </p>
        </div>
        <div className={styles.countBadge}>
          {statusCounts.total} obrigações
        </div>
      </header>

      <div className={styles.tabs}>
        <a href="/dashboard/obrigacoes" className={`${styles.tab} ${styles.tabActive}`}>
          Todos ({statusCounts.total})
        </a>
        <a href="/dashboard/obrigacoes?filter=pendentes" className={styles.tab}>
          Pendentes ({statusCounts.pendentes})
        </a>
        <a href="/dashboard/obrigacoes?filter=entregue" className={styles.tab}>
          Entregues ({statusCounts.entregue})
        </a>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Período</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {obrigacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  Nenhuma obrigação encontrada
                </td>
              </tr>
            ) : (
              obrigacoes.map((obrigacao) => (
                <tr key={obrigacao.id}>
                  <td>{obrigacao.cliente.nomeRazao}</td>
                  <td>{obrigacao.tipo}</td>
                  <td>{obrigacao.mes}/{obrigacao.ano}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge${obrigacao.status}`]}`}>
                      {obrigacao.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/obrigacoes/${obrigacao.id}`} className={styles.actionLink}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}