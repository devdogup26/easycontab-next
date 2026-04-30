import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { CaixaPostalClient } from './CaixaPostalClient'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function CaixaPostalPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const escritorioId = (session.user as any).escritorioId

  const [relevantUnread, otherMessages] = await Promise.all([
    prisma.mensagem.findMany({
      where: {
        cliente: { escritorioId },
        relevancia: 'RELEVANTE',
        lida: false
      },
      include: { cliente: { select: { id: true, nomeRazao: true } } },
      orderBy: { data: 'desc' }
    }),
    prisma.mensagem.findMany({
      where: {
        cliente: { escritorioId },
        OR: [
          { relevancia: 'NAO_RELEVANTE' },
          { relevancia: 'RELEVANTE', lida: true }
        ]
      },
      include: { cliente: { select: { id: true, nomeRazao: true } } },
      orderBy: { data: 'desc' },
      take: 50
    })
  ])

  const relevantUnreadMessages = relevantUnread.map(m => ({
    id: m.id,
    titulo: m.titulo,
    conteudo: m.conteudo,
    tipo: m.tipo,
    relevancia: m.relevancia,
    lida: m.lida,
    clienteNome: m.cliente.nomeRazao,
    data: m.data.toLocaleDateString('pt-BR')
  }))

  const otherMessagesData = otherMessages.map(m => ({
    id: m.id,
    titulo: m.titulo,
    conteudo: m.conteudo,
    tipo: m.tipo,
    relevancia: m.relevancia,
    lida: m.lida,
    clienteNome: m.cliente.nomeRazao,
    data: m.data.toLocaleDateString('pt-BR')
  }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Caixa Postal e-CAC</h1>
          <p className={styles.subtitle}>
            Mensagens e notificações dos portais governamentais
          </p>
        </div>
      </header>

      <CaixaPostalClient
        relevantUnreadMessages={relevantUnreadMessages}
        otherMessages={otherMessagesData}
      />
    </div>
  )
}
