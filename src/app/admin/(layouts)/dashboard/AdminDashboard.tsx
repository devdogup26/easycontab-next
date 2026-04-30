'use client'

import { Building2, Users, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import styles from './page.module.css'

interface Escritorio {
  id: string
  codigo: number
  nome: string
  documento: string
  email: string
  status: string
  dataVencimento: Date | string | null
}

interface AdminData {
  escritorios: Escritorio[]
  stats: {
    totalEscritorios: number
    escritoriosAtivos: number
    escritoriosVencidos: number
    escritoriosSuspensos: number
    totalClientes: number
  }
}

function formatDate(dateStr: Date | string | null): string {
  if (!dateStr) return '-'
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function getVencimentoStatus(dataVencimento: Date | string | null): 'ok' | 'proximo' | 'vencido' {
  if (!dataVencimento) return 'ok'
  const now = new Date()
  const venc = dataVencimento instanceof Date ? dataVencimento : new Date(dataVencimento)
  const diffDays = Math.ceil((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'vencido'
  if (diffDays <= 30) return 'proximo'
  return 'ok'
}

export function AdminDashboard({ data }: { data: AdminData }) {
  const { escritorios, stats } = data

  return (
    <>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Building2 size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalEscritorios}</div>
            <div className={styles.statLabel}>Total Escritórios</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconSuccess}`}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.escritoriosAtivos}</div>
            <div className={styles.statLabel}>Ativos</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconDanger}`}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.escritoriosVencidos}</div>
            <div className={styles.statLabel}>Vencidos</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconWarning}`}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.escritoriosSuspensos}</div>
            <div className={styles.statLabel}>Suspensos</div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalClientes}</div>
            <div className={styles.statLabel}>Total Clientes na Plataforma</div>
          </div>
        </div>
      </div>

      {/* Escritórios Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Escritórios Gerenciados</h2>
        </div>

        {escritorios.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <div className={styles.emptyText}>Nenhum escritório encontrado</div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Escritório</th>
                <th>Status</th>
                <th>Vencimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {escritorios.map((escritorio) => {
                const vencimentoStatus = getVencimentoStatus(escritorio.dataVencimento)
                return (
                  <tr key={escritorio.id}>
                    <td>
                      <div className={styles.escritorioInfo}>
                        <span className={styles.escritorioNome}>{escritorio.nome}</span>
                        <span className={styles.escritorioDoc}>{escritorio.documento}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${escritorio.status}`]}`}>
                        {escritorio.status}
                      </span>
                    </td>
                    <td>
                      <span className={
                        vencimentoStatus === 'vencido' ? styles.vencimentoVencido :
                        vencimentoStatus === 'proximo' ? styles.vencimentoProximo : ''
                      }>
                        {formatDate(escritorio.dataVencimento)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/admin/escritorios/${escritorio.id}`} className={styles.actionBtn}>
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
