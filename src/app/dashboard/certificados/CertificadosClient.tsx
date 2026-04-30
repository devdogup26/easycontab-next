'use client'

import { SemiCircleGauge } from '@/components/charts'
import { Key, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import styles from './page.module.css'

interface Certificado {
  id: string
  clienteNome: string
  documento: string
  tipo: string
  validade: string
  status: string
  responsavel: string | null
}

interface Stats {
  total: number
  validos: number
  proximoVencimento: number
  vencidos: number
}

interface CertificadosClientProps {
  certificados: Certificado[]
  stats: Stats
  tudoOk: boolean
}

export function CertificadosClient({
  certificados,
  stats,
  tudoOk
}: CertificadosClientProps) {
  return (
    <div className={styles.content}>
      {/* Status Card */}
      <div className={`${styles.statusCard} ${tudoOk ? styles.statusOk : stats.vencidos > 0 ? styles.statusDanger : styles.statusWarning}`}>
        <div className={styles.statusIcon}>
          {tudoOk ? (
            <CheckCircle size={32} />
          ) : stats.vencidos > 0 ? (
            <XCircle size={32} />
          ) : (
            <AlertTriangle size={32} />
          )}
        </div>
        <div className={styles.statusContent}>
          {tudoOk ? (
            <>
              <h2 className={styles.statusTitle}>Tudo certo com seu certificado!</h2>
              <p className={styles.statusSubtitle}>Todos os certificados estão válidos e com folga de prazo.</p>
            </>
          ) : stats.vencidos > 0 ? (
            <>
              <h2 className={styles.statusTitle}>Atenção: Certificados vencidos</h2>
              <p className={styles.statusSubtitle}>{stats.vencidos} certificado(s) precisa(m) de renovação imediata.</p>
            </>
          ) : (
            <>
              <h2 className={styles.statusTitle}>Certificados próximos do vencimento</h2>
              <p className={styles.statusSubtitle}>{stats.proximoVencimento} certificado(s) vence(m) em até 30 dias.</p>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Left - Stats & Gauge */}
        <div className={styles.leftColumn}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <Key size={20} />
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={`${styles.statCard} ${styles.statSuccess}`}>
              <CheckCircle size={20} />
              <span className={styles.statValue}>{stats.validos}</span>
              <span className={styles.statLabel}>Válidos</span>
            </div>
            <div className={`${styles.statCard} ${styles.statWarning}`}>
              <AlertTriangle size={20} />
              <span className={styles.statValue}>{stats.proximoVencimento}</span>
              <span className={styles.statLabel}>Próx. Venc.</span>
            </div>
            <div className={`${styles.statCard} ${styles.statDanger}`}>
              <XCircle size={20} />
              <span className={styles.statValue}>{stats.vencidos}</span>
              <span className={styles.statLabel}>Vencidos</span>
            </div>
          </div>

          {/* Procurações e-CAC Gauge */}
          <div className={styles.gaugeCard}>
            <SemiCircleGauge
              emDia={stats.validos}
              proximoVencimento={stats.proximoVencimento}
              vencido={stats.vencidos}
              title="Procurações e-CAC"
            />
          </div>
        </div>

        {/* Right - Certificate List */}
        <div className={styles.rightColumn}>
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Certificados Digitais</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Validade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {certificados.map(cert => (
                    <tr key={cert.id} className={cert.status === 'VENCIDO' ? styles.rowVencido : ''}>
                      <td>
                        <div className={styles.clienteCell}>
                          <span className={styles.clienteNome}>{cert.clienteNome}</span>
                          <span className={styles.clienteDoc}>{cert.documento}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.tipoBadge}>{cert.tipo}</span>
                      </td>
                      <td className={cert.status === 'VENCIDO' ? styles.validadeVencida : ''}>
                        {cert.validade}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${cert.status === 'VALIDO' ? styles.badgeSuccess : styles.badgeDanger}`}>
                          {cert.status === 'VALIDO' ? 'Válido' : 'Vencido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
