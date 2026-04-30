'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, FileText, AlertCircle, Plus, Edit2, Trash2, X, User, Shield } from 'lucide-react'
import Link from 'next/link'
import styles from '../../dashboard/page.module.css'

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

interface EscritorioDetailClientProps {
  escritorio: Escritorio
  stats: { totalClientes: number; totalObrigacoes: number }
}

const STATUS_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'SUSPENSO', label: 'Suspenso' }
]

interface Usuario {
  id: string
  login: string | null
  nome: string
  email: string
  cargo: string | null
  globalRole: string
  perfil: { id: string; nome: string; isAdmin: boolean } | null
  createdAt: string
}

function formatDate(dateStr: Date | string | null): string {
  if (!dateStr) return '-'
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

export function EscritorioDetailClient({ escritorio, stats }: EscritorioDetailClientProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [userForm, setUserForm] = useState({ nome: '', email: '', cargo: '', senha: '', login: '', tipoPerfil: 'OPERADOR' })
  const [userError, setUserError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/escritorios/${escritorio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao atualizar')
      }

      router.push('/admin/escritorios')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsuarios() {
    setLoadingUsers(true)
    try {
      const res = await fetch(`/api/escritorios/${escritorio.id}/usuarios`)
      if (res.ok) setUsuarios(await res.json())
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  function openNewUserModal() {
    setEditingUsuario(null)
    setUserForm({ nome: '', email: '', cargo: '', senha: '', login: `${escritorio.codigo}_`, tipoPerfil: 'OPERADOR' })
    setUserError(null)
    setShowUserModal(true)
    loadUsuarios()
  }

  function openEditUserModal(usuario: Usuario) {
    setEditingUsuario(usuario)
    setUserForm({
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo || '',
      senha: '',
      login: usuario.login || '',
      tipoPerfil: usuario.perfil?.nome || 'OPERADOR'
    })
    setUserError(null)
    setShowUserModal(true)
    loadUsuarios()
  }

  function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUserError(null)

    try {
      const method = editingUsuario ? 'PUT' : 'POST'

      const url = editingUsuario
        ? `/api/escritorios/${escritorio.id}/usuarios/${editingUsuario.id}`
        : `/api/escritorios/${escritorio.id}/usuarios`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      setShowUserModal(false)
      loadUsuarios()
    } catch (err: any) {
      setUserError(err.message)
    }
  }

  async function handleDeleteUser(usuario: Usuario) {
    if (usuario.email === 'admin@dogup.com.br') {
      alert('Usuário sistema não pode ser excluído')
      return
    }
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) return

    try {
      const res = await fetch(`/api/escritorios/${escritorio.id}/usuarios/${usuario.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir')
      }
      loadUsuarios()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className={styles.detailContainer}>
      <Link href="/admin/escritorios" className={styles.backBtn}>
        <ArrowLeft size={18} />
        Voltar para Lista
      </Link>

      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalClientes}</div>
            <div className={styles.statLabel}>Clientes Cadastrados</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FileText size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalObrigacoes}</div>
            <div className={styles.statLabel}>Obrigações Cadastradas</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Dados do Escritório</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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
              />
            </div>

            <div className={styles.formField}>
              <label>CNPJ</label>
              <input
                type="text"
                value={formData.documento}
                onChange={e => setFormData({ ...formData, documento: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label>Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div className={styles.formField}>
              <label>CRC</label>
              <input
                type="text"
                value={formData.crc}
                onChange={e => setFormData({ ...formData, crc: e.target.value })}
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
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <Save size={16} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Users size={18} />
            Usuários do Escritório
          </h2>
          <button className={styles.newBtn} onClick={openNewUserModal}>
            <Plus size={16} />
            Novo Usuário
          </button>
        </div>

        {loadingUsers ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando usuários...
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Login</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Perfil</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td>
                    <code style={{ fontSize: '12px', color: 'var(--accent)' }}>{usuario.login || '-'}</code>
                  </td>
                  <td>
                    <div className={styles.userInfo}>
                      <User size={14} />
                      <span>{usuario.nome}</span>
                    </div>
                  </td>
                  <td>{usuario.email}</td>
                  <td>{usuario.cargo || '-'}</td>
                  <td>
                    {usuario.perfil?.nome === 'ADMIN' ? (
                      <span className={styles.perfilBadgeAdmin}>
                        <Shield size={12} /> Admin
                      </span>
                    ) : usuario.perfil?.nome === 'CONTADOR' ? (
                      <span className={styles.perfilBadge} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                        Contador
                      </span>
                    ) : (
                      <span className={styles.perfilBadge}>Operador</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditUserModal(usuario)}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => handleDeleteUser(usuario)}
                        disabled={usuario.email === 'admin@dogup.com.br'}
                        title={usuario.email === 'admin@dogup.com.br' ? 'Usuário sistema' : 'Excluir'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showUserModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUserModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className={styles.modalClose} onClick={() => setShowUserModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className={styles.modalForm}>
              {userError && (
                <div className={styles.formError}>
                  <AlertCircle size={16} />
                  {userError}
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label>Nome</label>
                  <input
                    type="text"
                    value={userForm.nome}
                    onChange={e => setUserForm({ ...userForm, nome: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Login</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={`${escritorio.codigo}_`}
                      disabled
                      style={{ width: '60px', background: 'var(--bg-disabled)', textAlign: 'center', fontFamily: 'monospace' }}
                    />
                    <input
                      type="text"
                      value={userForm.login.replace(`${escritorio.codigo}_`, '')}
                      onChange={e => setUserForm({ ...userForm, login: `${escritorio.codigo}_${e.target.value}` })}
                      placeholder="nomeusuario"
                      required
                      pattern="[a-z0-9_]+"
                      style={{ flex: 1, fontFamily: 'monospace' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Apenas letras minúsculas, números e underscore</span>
                </div>

                <div className={styles.formField}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Cargo</label>
                  <input
                    type="text"
                    value={userForm.cargo}
                    onChange={e => setUserForm({ ...userForm, cargo: e.target.value })}
                    placeholder="Ex: Contador, Assistente"
                  />
                </div>

                {!editingUsuario && (
                  <div className={styles.formField}>
                    <label>Senha</label>
                    <input
                      type="password"
                      value={userForm.senha}
                      onChange={e => setUserForm({ ...userForm, senha: e.target.value })}
                      required={!editingUsuario}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                )}

                <div className={styles.formField}>
                  <label>Perfil</label>
                  <select
                    value={userForm.tipoPerfil}
                    onChange={e => setUserForm({ ...userForm, tipoPerfil: e.target.value })}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="CONTADOR">Contador</option>
                    <option value="OPERADOR">Operador</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowUserModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingUsuario ? 'Salvar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
