'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Building2, Users, Shield, Plus, Search, Edit, Trash2, X, Check, ChevronRight, ArrowLeft } from 'lucide-react'
import styles from './page.module.css'

interface Contador {
  id: string
  nome: string
  documento: string
  email: string
  telefone: string | null
  cidade: string | null
  uf: string
  crc: string | null
  _count: {
    clientes: number
    usuarios: number
  }
  createdAt: string
}

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string | null
  globalRole: string
  perfil: { id: string; nome: string; isAdmin: boolean } | null
  createdAt: string
}

interface Perfil {
  id: string
  nome: string
  isAdmin: boolean
  _count: { usuarios: number }
  permissoes: { codigo: string }[]
}

interface Permissao {
  id: string
  codigo: string
  descricao: string | null
}

export default function ContadoresPage() {
  const { data: session, status } = useSession()
  const [contadores, setContadores] = useState<Contador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showContadorModal, setShowContadorModal] = useState(false)
  const [editingContador, setEditingContador] = useState<Contador | null>(null)
  const [selectedContador, setSelectedContador] = useState<Contador | null>(null)
  const [activeTab, setActiveTab] = useState<'contadores' | 'usuarios' | 'perfis'>('contadores')

  // Users state
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showUsuarioModal, setShowUsuarioModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formUsuario, setFormUsuario] = useState({ nome: '', email: '', cargo: '', senha: '', isAdmin: false })

  // Perfis state
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null)
  const [formPerfil, setFormPerfil] = useState({ nome: '', isAdmin: false, permissoes: [] as string[] })

  const [formContador, setFormContador] = useState({
    nome: '', documento: '', email: '', telefone: '', cidade: '', uf: '', crc: '', tipoPessoa: 'PJ'
  })

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login')
    if (!(session?.user as any)?.perfil?.isAdmin) redirect('/dashboard')
    fetchContadores()
    fetchPermissoes()
  }, [status, session])

  async function fetchContadores() {
    try {
      const res = await fetch('/api/contadores')
      if (res.ok) setContadores(await res.json())
    } catch (error) {
      console.error('Error fetching contadores:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPermissoes() {
    try {
      const res = await fetch('/api/permissoes')
      if (res.ok) setPermissoes(await res.json())
    } catch (error) {
      console.error('Error fetching permissoes:', error)
    }
  }

  async function fetchUsuarios(contadorId: string) {
    try {
      const res = await fetch(`/api/contadores/${contadorId}/usuarios`)
      if (res.ok) setUsuarios(await res.json())
    } catch (error) {
      console.error('Error fetching usuarios:', error)
    }
  }

  async function fetchPerfis(contadorId: string) {
    try {
      const res = await fetch(`/api/contadores/${contadorId}/perfis`)
      if (res.ok) setPerfis(await res.json())
    } catch (error) {
      console.error('Error fetching perfis:', error)
    }
  }

  function selectContador(contador: Contador) {
    setSelectedContador(contador)
    setActiveTab('usuarios')
    fetchUsuarios(contador.id)
    fetchPerfis(contador.id)
  }

  // Contador CRUD
  function openContadorModal(contador?: Contador) {
    if (contador) {
      setEditingContador(contador)
      setFormContador({
        nome: contador.nome, documento: contador.documento, email: contador.email,
        telefone: contador.telefone || '', cidade: contador.cidade || '', uf: contador.uf,
        crc: contador.crc || '', tipoPessoa: 'PJ'
      })
    } else {
      setEditingContador(null)
      setFormContador({ nome: '', documento: '', email: '', telefone: '', cidade: '', uf: '', crc: '', tipoPessoa: 'PJ' })
    }
    setShowContadorModal(true)
  }

  async function handleContadorSubmit(e: React.FormEvent) {
    e.preventDefault()
    const method = editingContador ? 'PUT' : 'POST'
    const url = editingContador ? `/api/contadores/${editingContador.id}` : '/api/contadores'
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formContador) })
      if (res.ok) { fetchContadores(); setShowContadorModal(false) }
    } catch (error) { console.error('Error saving contador:', error) }
  }

  async function handleDeleteContador(id: string) {
    if (!confirm('Tem certeza que deseja excluir este escritório?')) return
    try {
      const res = await fetch(`/api/contadores/${id}`, { method: 'DELETE' })
      if (res.ok) fetchContadores()
    } catch (error) { console.error('Error deleting contador:', error) }
  }

  // Usuario CRUD
  function openUsuarioModal(usuario?: Usuario) {
    if (usuario) {
      setEditingUsuario(usuario)
      setFormUsuario({ nome: usuario.nome, email: usuario.email, cargo: usuario.cargo || '', senha: '', isAdmin: usuario.perfil?.isAdmin || false })
    } else {
      setEditingUsuario(null)
      setFormUsuario({ nome: '', email: '', cargo: '', senha: '', isAdmin: false })
    }
    setShowUsuarioModal(true)
  }

  async function handleUsuarioSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedContador) return
    const method = editingUsuario ? 'PUT' : 'POST'
    const url = editingUsuario ? `/api/contadores/${selectedContador.id}/usuarios/${editingUsuario.id}` : `/api/contadores/${selectedContador.id}/usuarios`
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formUsuario) })
      if (res.ok) { fetchUsuarios(selectedContador.id); setShowUsuarioModal(false) }
    } catch (error) { console.error('Error saving usuario:', error) }
  }

  async function handleDeleteUsuario(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    if (!selectedContador) return
    try {
      const res = await fetch(`/api/contadores/${selectedContador.id}/usuarios/${id}`, { method: 'DELETE' })
      if (res.ok) fetchUsuarios(selectedContador.id)
    } catch (error) { console.error('Error deleting usuario:', error) }
  }

  // Perfil CRUD
  function openPerfilModal(perfil?: Perfil) {
    if (perfil) {
      setEditingPerfil(perfil)
      setFormPerfil({ nome: perfil.nome, isAdmin: perfil.isAdmin, permissoes: perfil.permissoes.map(p => p.codigo) })
    } else {
      setEditingPerfil(null)
      setFormPerfil({ nome: '', isAdmin: false, permissoes: [] })
    }
    setShowPerfilModal(true)
  }

  async function handlePerfilSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedContador) return
    const method = editingPerfil ? 'PUT' : 'POST'
    const url = editingPerfil ? `/api/contadores/${selectedContador.id}/perfis/${editingPerfil.id}` : `/api/contadores/${selectedContador.id}/perfis`
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formPerfil) })
      if (res.ok) { fetchPerfis(selectedContador.id); setShowPerfilModal(false) }
    } catch (error) { console.error('Error saving perfil:', error) }
  }

  async function handleDeletePerfil(id: string) {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) return
    if (!selectedContador) return
    try {
      const res = await fetch(`/api/contadores/${selectedContador.id}/perfis/${id}`, { method: 'DELETE' })
      if (res.ok) fetchPerfis(selectedContador.id)
    } catch (error) { console.error('Error deleting perfil:', error) }
  }

  function togglePermissao(codigo: string) {
    setFormPerfil(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(codigo)
        ? prev.permissoes.filter(p => p !== codigo)
        : [...prev.permissoes, codigo]
    }))
  }

  const filteredContadores = contadores.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.documento.includes(search) || c.email.toLowerCase().includes(search)
  )

  if (loading) return <div className={styles.loading}>Carregando...</div>

  // Detail view
  if (selectedContador) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => setSelectedContador(null)}>
          <ArrowLeft size={18} /> <span>Voltar para Contadores</span>
        </button>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{selectedContador.nome}</h1>
            <p className={styles.subtitle}>{selectedContador.documento} • {selectedContador.cidade || '-'}</p>
          </div>
        </header>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'usuarios' ? styles.activeTab : ''}`} onClick={() => setActiveTab('usuarios')}>
            <Users size={16} /> Usuários ({usuarios.length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'perfis' ? styles.activeTab : ''}`} onClick={() => setActiveTab('perfis')}>
            <Shield size={16} /> Perfis ({perfis.length})
          </button>
        </div>

        {/* USUARIOS TAB */}
        {activeTab === 'usuarios' && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.searchBar}>
                <Search size={18} />
                <input type="text" placeholder="Buscar usuários..." className={styles.searchInput} />
              </div>
              <button className={styles.addBtn} onClick={() => openUsuarioModal()}>
                <Plus size={18} /> <span>Novo Usuário</span>
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead><tr><th>Nome</th><th>Email</th><th>Cargo</th><th>Perfil</th><th>Ações</th></tr></thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>{u.cargo || '-'}</td>
                      <td>{u.perfil ? <span className={`${styles.badge} ${u.perfil.isAdmin ? styles.badgeAdmin : ''}`}>{u.perfil.nome}</span> : '-'}</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.editBtn} onClick={() => openUsuarioModal(u)}><Edit size={16} /></button>
                          <button className={styles.deleteBtn} onClick={() => handleDeleteUsuario(u.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && <tr><td colSpan={5} className={styles.emptyRow}>Nenhum usuário encontrado</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PERFIS TAB */}
        {activeTab === 'perfis' && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.searchBar}>
                <Search size={18} />
                <input type="text" placeholder="Buscar perfis..." className={styles.searchInput} />
              </div>
              <button className={styles.addBtn} onClick={() => openPerfilModal()}>
                <Plus size={18} /> <span>Novo Perfil</span>
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead><tr><th>Nome</th><th>Admin</th><th>Usuários</th><th>Permissões</th><th>Ações</th></tr></thead>
                <tbody>
                  {perfis.map(p => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td>{p.isAdmin ? <span className={styles.badgeAdmin}>Sim</span> : 'Não'}</td>
                      <td>{p._count.usuarios}</td>
                      <td>{p.permissoes.length} permissões</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.editBtn} onClick={() => openPerfilModal(p)}><Edit size={16} /></button>
                          <button className={styles.deleteBtn} onClick={() => handleDeletePerfil(p.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {perfis.length === 0 && <tr><td colSpan={5} className={styles.emptyRow}>Nenhum perfil encontrado</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Usuario Modal */}
        {showUsuarioModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>{editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                <button onClick={() => setShowUsuarioModal(false)} className={styles.closeBtn}><X size={20} /></button>
              </div>
              <form onSubmit={handleUsuarioSubmit} className={styles.form}>
                <div className={styles.formGroup}><label>Nome</label><input type="text" value={formUsuario.nome} onChange={e => setFormUsuario({ ...formUsuario, nome: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>Email</label><input type="email" value={formUsuario.email} onChange={e => setFormUsuario({ ...formUsuario, email: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>Cargo</label><input type="text" value={formUsuario.cargo} onChange={e => setFormUsuario({ ...formUsuario, cargo: e.target.value })} /></div>
                {!editingUsuario && <div className={styles.formGroup}><label>Senha</label><input type="password" value={formUsuario.senha} onChange={e => setFormUsuario({ ...formUsuario, senha: e.target.value })} required={!editingUsuario} /></div>}
                <div className={styles.formActions}>
                  <button type="button" onClick={() => setShowUsuarioModal(false)} className={styles.cancelBtn}>Cancelar</button>
                  <button type="submit" className={styles.saveBtn}><Check size={16} /><span>{editingUsuario ? 'Salvar' : 'Criar'}</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Perfil Modal */}
        {showPerfilModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>{editingPerfil ? 'Editar Perfil' : 'Novo Perfil'}</h2>
                <button onClick={() => setShowPerfilModal(false)} className={styles.closeBtn}><X size={20} /></button>
              </div>
              <form onSubmit={handlePerfilSubmit} className={styles.form}>
                <div className={styles.formGroup}><label>Nome do Perfil</label><input type="text" value={formPerfil.nome} onChange={e => setFormPerfil({ ...formPerfil, nome: e.target.value })} required /></div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={formPerfil.isAdmin} onChange={e => setFormPerfil({ ...formPerfil, isAdmin: e.target.checked })} />
                    <span>Administrador do Escritório</span>
                  </label>
                </div>
                <div className={styles.formGroup}>
                  <label>Permissões</label>
                  <div className={styles.permissionsGrid}>
                    {permissoes.map(p => (
                      <label key={p.id} className={styles.permissionItem}>
                        <input type="checkbox" checked={formPerfil.permissoes.includes(p.codigo)} onChange={() => togglePermissao(p.codigo)} />
                        <span>{p.codigo}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="button" onClick={() => setShowPerfilModal(false)} className={styles.cancelBtn}>Cancelar</button>
                  <button type="submit" className={styles.saveBtn}><Check size={16} /><span>{editingPerfil ? 'Salvar' : 'Criar'}</span></button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main list view
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Contadores / Escritórios</h1>
          <p className={styles.subtitle}>Gerenciar escritórios, usuários e permissões</p>
        </div>
        <button className={styles.addBtn} onClick={() => openContadorModal()}>
          <Plus size={18} /> <span>Novo Escritório</span>
        </button>
      </header>

      <div className={styles.searchBar}>
        <Search size={18} />
        <input type="text" placeholder="Buscar por nome, documento ou email..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>Escritório</th><th>Documento</th><th>Cidade</th><th>Clientes</th><th>Usuários</th><th>Ações</th></tr></thead>
          <tbody>
            {filteredContadores.map(c => (
              <tr key={c.id}>
                <td>
                  <div className={styles.contadorInfo}>
                    <Building2 size={16} />
                    <div>
                      <span className={styles.contadorNome}>{c.nome}</span>
                      <span className={styles.contadorEmail}>{c.email}</span>
                    </div>
                  </div>
                </td>
                <td>{c.documento}</td>
                <td>{c.cidade || '-'}{c.uf ? `, ${c.uf}` : ''}</td>
                <td>{c._count.clientes}</td>
                <td>
                  <button className={styles.linkBtn} onClick={() => { setSelectedContador(c); fetchUsuarios(c.id); fetchPerfis(c.id); setActiveTab('usuarios') }}>
                    {c._count.usuarios} <ChevronRight size={14} />
                  </button>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => openContadorModal(c)}><Edit size={16} /></button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteContador(c.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredContadores.length === 0 && <tr><td colSpan={6} className={styles.emptyRow}>Nenhum escritório encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {showContadorModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingContador ? 'Editar Escritório' : 'Novo Escritório'}</h2>
              <button onClick={() => setShowContadorModal(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleContadorSubmit} className={styles.form}>
              <div className={styles.formGroup}><label>Nome / Razão Social</label><input type="text" value={formContador.nome} onChange={e => setFormContador({ ...formContador, nome: e.target.value })} required /></div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>CNPJ</label><input type="text" value={formContador.documento} onChange={e => setFormContador({ ...formContador, documento: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>CRC</label><input type="text" value={formContador.crc} onChange={e => setFormContador({ ...formContador, crc: e.target.value })} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Email</label><input type="email" value={formContador.email} onChange={e => setFormContador({ ...formContador, email: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>Telefone</label><input type="text" value={formContador.telefone} onChange={e => setFormContador({ ...formContador, telefone: e.target.value })} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Cidade</label><input type="text" value={formContador.cidade} onChange={e => setFormContador({ ...formContador, cidade: e.target.value })} /></div>
                <div className={styles.formGroup} style={{ maxWidth: '100px' }}><label>UF</label><input type="text" maxLength={2} value={formContador.uf} onChange={e => setFormContador({ ...formContador, uf: e.target.value.toUpperCase() })} /></div>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowContadorModal(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}><Check size={16} /><span>{editingContador ? 'Salvar' : 'Criar'}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}