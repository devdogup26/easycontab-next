'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, Edit2, Trash2, X, AlertCircle, Users } from 'lucide-react'
import styles from '../dashboard/page.module.css'

interface Escritorio {
  id: string
  codigo: number
  nome: string
  documento: string
  email: string
  telefone: string | null
  crc: string | null
  status: string
  dataVencimento: Date | string | null
}

interface EscritoriosClientProps {
  escritorios: Escritorio[]
}

const STATUS_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'SUSPENSO', label: 'Suspenso' }
]

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

export function EscritoriosClient({ escritorios }: EscritoriosClientProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editingEscritorio, setEditingEscritorio] = useState<Escritorio | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    crc: '',
    status: 'ATIVO',
    dataVencimento: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const openNewModal = () => {
    setEditingEscritorio(null)
    setFormData({
      nome: '',
      documento: '',
      email: '',
      telefone: '',
      crc: '',
      status: 'ATIVO',
      dataVencimento: ''
    })
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (escritorio: Escritorio) => {
    setEditingEscritorio(escritorio)
    setFormData({
      nome: escritorio.nome,
      documento: escritorio.documento,
      email: escritorio.email,
      telefone: escritorio.telefone || '',
      crc: escritorio.crc || '',
      status: escritorio.status,
      dataVencimento: escritorio.dataVencimento
        ? new Date(escritorio.dataVencimento).toISOString().split('T')[0]
        : ''
    })
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEscritorio(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editingEscritorio) {
        // Update existing
        const res = await fetch(`/api/escritorios/${editingEscritorio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao atualizar')
        }
      } else {
        // Create new
        const res = await fetch('/api/escritorios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao criar')
        }
      }

      closeModal()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este escritório? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/escritorios/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir')
      }
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      {/* Table Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Lista de Escritórios</h2>
          <button className={styles.newBtn} onClick={openNewModal}>
            <Plus size={18} />
            Novo Escritório
          </button>
        </div>

        {escritorios.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏢</div>
            <div className={styles.emptyText}>Nenhum escritório cadastrado</div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Escritório</th>
                <th>Responsável</th>
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
                        <span className={styles.escritorioNome}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginRight: '6px' }}>#{escritorio.codigo}</span>
                          {escritorio.nome}
                        </span>
                        <span className={styles.escritorioDoc}>{escritorio.documento}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.escritorioInfo}>
                        <span>—</span>
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
                        <button
                          className={styles.actionBtn}
                          onClick={() => openEditModal(escritorio)}
                        >
                          <Edit2 size={14} />
                          Editar
                        </button>
                        <Link
                          href={`/admin/escritorios/${escritorio.id}`}
                          className={styles.actionBtn}
                        >
                          <Users size={14} />
                          Usuários
                        </Link>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(escritorio.id)}
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingEscritorio ? 'Editar Escritório' : 'Novo Escritório'}</h3>
              <button className={styles.modalClose} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {error && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label>Nome do Escritório</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                    placeholder="DOGUP Assessoria Contábil"
                  />
                </div>

                <div className={styles.formField}>
                  <label>CNPJ</label>
                  <input
                    type="text"
                    value={formData.documento}
                    onChange={e => setFormData({ ...formData, documento: e.target.value })}
                    required
                    placeholder="12345678000190"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="contato@escritorio.com.br"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className={styles.formField}>
                  <label>CRC</label>
                  <input
                    type="text"
                    value={formData.crc}
                    onChange={e => setFormData({ ...formData, crc: e.target.value })}
                    placeholder="SP123456"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={e => setFormData({ ...formData, dataVencimento: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Salvando...' : editingEscritorio ? 'Salvar Alterações' : 'Criar Escritório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}