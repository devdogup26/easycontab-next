import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { CertificadosClient } from './CertificadosClient'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function CertificadosPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const contadorId = (session.user as any).contadorId

  const certificados = await prisma.certificado.findMany({
    where: { cliente: { contadorId } },
    include: { cliente: { select: { id: true, nomeRazao: true, documento: true } } },
    orderBy: { validade: 'asc' }
  })

  const hoje = new Date()
  const em30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

  const stats = {
    total: certificados.length,
    validos: certificados.filter(c => c.status === 'VALIDO' && new Date(c.validade) > em30Dias).length,
    proximoVencimento: certificados.filter(c => c.status === 'VALIDO' && new Date(c.validade) <= em30Dias && new Date(c.validade) > hoje).length,
    vencidos: certificados.filter(c => c.status === 'VENCIDO' || (c.status === 'VALIDO' && new Date(c.validade) <= hoje)).length
  }

  const certificadosData = certificados.map(c => ({
    id: c.id,
    clienteNome: c.cliente.nomeRazao,
    documento: c.cliente.documento,
    tipo: c.tipo,
    validade: new Date(c.validade).toLocaleDateString('pt-BR'),
    status: c.status,
    responsavel: c.responsavel
  }))

  // Check overall certificate health
  const tudoOk = stats.total > 0 && stats.vencidos === 0 && stats.proximoVencimento === 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Certificados Digitais</h1>
          <p className={styles.subtitle}>
            Monitoramento de validade dos certificados digitais A1/A3
          </p>
        </div>
      </header>

      <CertificadosClient
        certificados={certificadosData}
        stats={stats}
        tudoOk={tudoOk}
      />
    </div>
  )
}
