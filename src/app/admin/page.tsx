import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { AdminDashboard } from './AdminDashboard'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any

  // Only SUPER_ADMIN can access admin area
  if (user.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  // Get escritórios where user is owner
  const escritorios = await prisma.escritorio.findMany({
    where: {
      owners: {
        some: { usuarioId: user.id }
      }
    },
    include: {
      contador: true,
      owners: {
        include: { usuario: { select: { id: true, nome: true, email: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Stats
  const totalEscritorios = escritorios.length
  const escritoriosAtivos = escritorios.filter(e => e.status === 'ATIVO').length
  const escritoriosVencidos = escritorios.filter(e => e.status === 'VENCIDO').length
  const escritoriosSuspensos = escritorios.filter(e => e.status === 'SUSPENSO').length

  const totalClientes = await prisma.clienteFinal.count()
  const totalObrigacoes = await prisma.obrigacao.count()

  const adminData = {
    escritorios,
    stats: {
      totalEscritorios,
      escritoriosAtivos,
      escritoriosVencidos,
      escritoriosSuspensos,
      totalClientes,
      totalObrigacoes
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel Administrativo</h1>
          <p className={styles.subtitle}>Gestão de Escritórios Contábeis</p>
        </div>
      </header>
      <AdminDashboard data={adminData} />
    </div>
  )
}