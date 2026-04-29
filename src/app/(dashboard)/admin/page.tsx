import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const isAdmin = (session.user as any).perfil?.isAdmin
  if (!isAdmin) redirect('/dashboard')

  const stats = {
    totalEscritorios: 24,
    totalClientes: 1847,
    obrigacoesAtrasadas: 156,
    receitaEstimada: 'R$ 127.400,00',
  }

  const escritoriosData = [
    { nome: 'Escritório Alpha', clientes: 187 },
    { nome: 'Borges & Associados', clientes: 156 },
    { nome: 'Costa Contabilidade', clientes: 134 },
    { nome: 'Lima & Lima', clientes: 128 },
    { nome: 'Santos Pereira', clientes: 112 },
  ]

  const maxClientes = Math.max(...escritoriosData.map((e) => e.clientes))

  const recentRegistrations = [
    { nome: 'Ramos & Castro Ltda', estado: 'SP', data: '2026-04-25' },
    { nome: 'Almeida Advocacia', estado: 'RJ', data: '2026-04-24' },
    { nome: 'Ferreira Assessoria', estado: 'MG', data: '2026-04-23' },
    { nome: 'Silva & Oliveira S/S', estado: 'RS', data: '2026-04-22' },
    { nome: 'Tech Solutions ME', estado: 'PR', data: '2026-04-21' },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard Admin</h1>
        <span className={styles.badge}>Modo Admin</span>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalEscritorios}</span>
          <span className={styles.statLabel}>Total de Escritórios</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalClientes.toLocaleString('pt-BR')}</span>
          <span className={styles.statLabel}>Total de Clientes</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.obrigacoesAtrasadas}</span>
          <span className={styles.statLabel}>Obrigações em Atraso</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.receitaEstimada}</span>
          <span className={styles.statLabel}>Receita Estimada</span>
        </div>
      </div>

      <section className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Top 5 Escritórios por Clientes</h2>
        <div className={styles.chartContainer}>
          {escritoriosData.map((escritorio, index) => (
            <div key={index} className={styles.chartRow}>
              <span className={styles.chartLabel}>{escritorio.nome}</span>
              <div className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{ width: `${(escritorio.clientes / maxClientes) * 100}%` }}
                >
                  <span className={styles.barValue}>{escritorio.clientes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>Registros Recentes</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Estado</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((reg, index) => (
                <tr key={index}>
                  <td>{reg.nome}</td>
                  <td>{reg.estado}</td>
                  <td>{reg.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}