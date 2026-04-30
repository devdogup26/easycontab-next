import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { SituacaoFiscalClient } from './SituacaoFiscalClient'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function SituacaoFiscalPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const contadorId = (session.user as any).contadorId

  const [totalClientes, regularCount, regularizadoCount, irregularCount] = await Promise.all([
    prisma.clienteFinal.count({ where: { contadorId } }),
    prisma.clienteFinal.count({ where: { contadorId, situacaoFiscal: 'REGULAR' } }),
    prisma.clienteFinal.count({ where: { contadorId, situacaoFiscal: 'REGULARIZADO' } }),
    prisma.clienteFinal.count({ where: { contadorId, situacaoFiscal: 'IRREGULAR' } })
  ])

  // Get clients by situation for the list
  const clientesRegular = await prisma.clienteFinal.findMany({
    where: { contadorId, situacaoFiscal: 'REGULAR' },
    select: { id: true, nomeRazao: true, documento: true },
    take: 20
  })

  const clientesRegularizado = await prisma.clienteFinal.findMany({
    where: { contadorId, situacaoFiscal: 'REGULARIZADO' },
    select: { id: true, nomeRazao: true, documento: true },
    take: 20
  })

  const clientesIrregular = await prisma.clienteFinal.findMany({
    where: { contadorId, situacaoFiscal: 'IRREGULAR' },
    select: { id: true, nomeRazao: true, documento: true },
    take: 20
  })

  const stats = {
    total: totalClientes,
    regular: regularCount,
    regularizado: regularizadoCount,
    irregular: irregularCount
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Situação Fiscal Federal</h1>
          <p className={styles.subtitle}>
            Visualização consolidada da regularidade fiscal da carteira de clientes
          </p>
        </div>
      </header>

      <SituacaoFiscalClient
        stats={stats}
        clientesRegular={clientesRegular}
        clientesRegularizado={clientesRegularizado}
        clientesIrregular={clientesIrregular}
      />
    </div>
  )
}
