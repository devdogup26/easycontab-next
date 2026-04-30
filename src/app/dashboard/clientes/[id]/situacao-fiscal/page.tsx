import { prisma } from '@/lib/server/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClienteSituacaoFiscal } from './ClienteSituacaoFiscal'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

function getVencimento(tipo: string, mes: number, ano: number): Date {
  const nextMonth = mes === 12 ? 1 : mes + 1
  const nextYear = mes === 12 ? ano + 1 : ano
  return new Date(nextYear, nextMonth - 1, 15)
}

function isOverdue(dataVencimento: Date | null, status: string): boolean {
  if (status !== 'NAO_ENTREGUE') return false
  if (!dataVencimento) return false
  return dataVencimento < new Date()
}

export default async function ClienteSituacaoFiscalPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params
  const contadorId = (session.user as any).contadorId

  const cliente = await prisma.clienteFinal.findFirst({
    where: { id, contadorId },
    include: {
      obrigacoes: {
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }]
      }
    }
  })

  if (!cliente) {
    redirect('/dashboard/clientes')
  }

  const obligationsWithVencimento = cliente.obrigacoes.map(o => ({
    ...o,
    dataVencimento: getVencimento(o.tipo, o.mes, o.ano)
  }))

  const hasOverdue = obligationsWithVencimento.some(
    o => isOverdue(o.dataVencimento, o.status)
  )

  const obligationsByStatus = {
    ENTREGUE: obligationsWithVencimento.filter(o => o.status === 'ENTREGUE'),
    NAO_ENTREGUE: obligationsWithVencimento.filter(o => o.status === 'NAO_ENTREGUE'),
    INCONSISTENCIA: obligationsWithVencimento.filter(o => o.status === 'INCONSISTENCIA'),
    EM_PROCESSAMENTO: obligationsWithVencimento.filter(o => o.status === 'EM_PROCESSAMENTO'),
    OUTROS: obligationsWithVencimento.filter(o => o.status === 'OUTROS')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <a href={`/dashboard/clientes/${id}`} className={styles.backLink}>
          ← Voltar para {cliente.nomeRazao}
        </a>
        <h1 className={styles.title}>Situação Fiscal</h1>
      </div>

      <ClienteSituacaoFiscal
        cliente={cliente}
        obligationsByStatus={obligationsByStatus}
        hasOverdue={hasOverdue}
      />
    </div>
  )
}
