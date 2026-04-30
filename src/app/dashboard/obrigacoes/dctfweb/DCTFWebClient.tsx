'use client'

import { useState } from 'react'
import styles from './page.module.css'

interface Cliente {
  id: string
  documento: string
  nomeRazao: string
}

interface Obrigacao {
  id: string
  tipo: string
  ano: number
  mes: number
  status: string
  reciboUrl: string | null
  createdAt: Date
  cliente: Cliente
}

interface DCTFWebClientProps {
  obrigacoes: Obrigacao[]
}

function getMonthName(month: number): string {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return months[month - 1]
}

function getStatusInfo(status: string) {
  const badges: Record<string, { class: string; label: string }> = {
    EM_PROCESSAMENTO: { class: styles.statusWarning, label: 'Em Processamento' },
    INCONSISTENCIA: { class: styles.statusCritical, label: 'Inconsistência' },
    ENTREGUE: { class: styles.statusSuccess, label: 'Entregue' }
  }
  return badges[status] || badges.EM_PROCESSAMENTO
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export default function DCTFWebClient({ obrigacoes }: DCTFWebClientProps) {
  const [transmitting, setTransmitting] = useState(false)

  const handleTransmit = async (clienteId: string, ano: number, mes: number) => {
    setTransmitting(true)
    try {
      const formData = new FormData()
      formData.set('clienteId', clienteId)
      formData.set('ano', ano.toString())
      formData.set('mes', mes.toString())

      const response = await fetch('/api/obrigacoes/dctfweb/transmit', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro ao transmitir')
      }

      window.location.reload()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao transmitir DCTFWeb')
    } finally {
      setTransmitting(false)
    }
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>CNPJ</th>
            <th className={styles.th}>Cliente</th>
            <th className={styles.th}>Período</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Início</th>
          </tr>
        </thead>
        <tbody>
          {obrigacoes.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.emptyState}>
                Nenhuma DCTFWeb em andamento
              </td>
            </tr>
          ) : (
            obrigacoes.map((obg) => {
              const statusInfo = getStatusInfo(obg.status)
              return (
                <tr key={obg.id} className={styles.tr}>
                  <td className={styles.td}>{obg.cliente.documento}</td>
                  <td className={styles.td}>{obg.cliente.nomeRazao}</td>
                  <td className={styles.td + ' ' + styles.textCenter}>
                    {getMonthName(obg.mes)}/{obg.ano}
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className={styles.td}>{formatDate(obg.createdAt)}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}