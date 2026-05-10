'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Plus, Edit2, Trash2, X, AlertCircle, Search, Filter } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import styles from '../dashboard/page.module.css';

interface Escritorio {
  id: number;
  codigo: number;
  nome: string;
  documento: string;
  email: string;
  telefone: string | null;
  crc: string | null;
  status: string;
  dataVencimento: Date | string | null;
}

interface EscritoriosClientProps {
  escritorios: Escritorio[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'SUSPENSO', label: 'Suspenso' },
];

function formatDate(dateStr: Date | string | null): string {
  if (!dateStr) return '-';
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function getVencimentoStatus(dataVencimento: Date | string | null): 'ok' | 'proximo' | 'vencido' {
  if (!dataVencimento) return 'ok';
  const now = new Date();
  const venc = dataVencimento instanceof Date ? dataVencimento : new Date(dataVencimento);
  const diffDays = Math.ceil((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencido';
  if (diffDays <= 30) return 'proximo';
  return 'ok';
}

function validateCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  let sum = 0;
  let factor = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 9 ? 2 : factor + 1;
  }
  const rev13 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev13 !== parseInt(cnpj[12])) return false;
  sum = 0;
  factor = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 9 ? 2 : factor + 1;
  }
  const rev14 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return rev14 === parseInt(cnpj[13]);
}

function validateCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(.)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  const rev10 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev10 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  const rev11 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return rev11 === parseInt(cpf[10]);
}

function formatCNPJCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
  } else {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5');
  }
}

export function EscritoriosClient({ escritorios, total, page, totalPages, search, status }: EscritoriosClientProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingEscritorio, setEditingEscritorio] = useState<Escritorio | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    crc: '',
    status: 'ATIVO',
    dataVencimento: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; escritorioId: number | null; escritorioNome: string }>({
    isOpen: false,
    escritorioId: null,
    escritorioNome: '',
  });

  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const base = { search, status, page: String(page) };
    const merged = { ...base, ...updates };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== '' && v !== '1') params.set(k, v);
    });
    const str = params.toString();
    return `/admin/escritorios${str ? '?' + str : ''}`;
  };

  const openNewModal = () => {
    setEditingEscritorio(null);
    setFormData({
      nome: '',
      documento: '',
      email: '',
      telefone: '',
      crc: '',
      status: 'ATIVO',
      dataVencimento: '',
    });
    setError(null);
    setCnpjError(null);
    setCnpjValid(null);
    setShowModal(true);
  };

  const openEditModal = (escritorio: Escritorio) => {
    setEditingEscritorio(escritorio);
    setFormData({
      nome: escritorio.nome,
      documento: escritorio.documento,
      email: escritorio.email,
      telefone: escritorio.telefone || '',
      crc: escritorio.crc || '',
      status: escritorio.status,
      dataVencimento: escritorio.dataVencimento
        ? new Date(escritorio.dataVencimento).toISOString().split('T')[0]
        : '',
    });
    setError(null);
    setCnpjError(null);
    setCnpjValid(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEscritorio(null);
    setError(null);
    setCnpjError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCnpjError(null);

    const digits = formData.documento.replace(/\D/g, '');

    // Client-side CNPJ/CPF validation
    if (digits.length === 14 && !validateCNPJ(digits)) {
      setCnpjError('CNPJ inválido');
      setLoading(false);
      return;
    }
    if (digits.length === 11 && !validateCPF(digits)) {
      setCnpjError('CPF inválido');
      setLoading(false);
      return;
    }
    if (digits.length !== 14 && digits.length !== 11) {
      setCnpjError(digits.length < 14 ? 'CPF deve ter 11 dígitos' : 'CNPJ deve ter 14 dígitos');
      setLoading(false);
      return;
    }

    try {
      if (editingEscritorio) {
        // Update existing
        const res = await fetch(`/api/escritorios/${editingEscritorio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao atualizar');
        }
      } else {
        // Create new
        const res = await fetch('/api/escritorios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao criar');
        }
      }

      closeModal();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const escritorio = escritorios.find(e => e.id === id);
    if (!escritorio) return;
    setDeleteConfirm({ isOpen: true, escritorioId: id, escritorioNome: escritorio.nome });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.escritorioId) return;
    try {
      const res = await fetch(`/api/escritorios/${deleteConfirm.escritorioId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir');
      }
      setDeleteConfirm({ isOpen: false, escritorioId: null, escritorioNome: '' });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setDeleteConfirm({ isOpen: false, escritorioId: null, escritorioNome: '' });
    }
  };

  return (
    <>
      {/* Search and Filter Bar */}
      <form method="GET" className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Buscar por nome, CNPJ ou email..."
            className={styles.searchInput}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className={styles.filterSelect}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="submit" className={styles.pageButton}>
          <Filter size={14} />
          Filtrar
        </button>
        {(search || status) && (
          <Link href="/admin/escritorios" className={styles.secondaryButton}>
            Limpar
          </Link>
        )}
      </form>

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
              {escritorios.map(escritorio => {
                const vencimentoStatus = getVencimentoStatus(escritorio.dataVencimento);
                return (
                  <tr key={escritorio.id}>
                    <td>
                      <div className={styles.escritorioInfo}>
                        <span className={styles.escritorioNome}>
                          <span
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              marginRight: '6px',
                            }}
                          >
                            #{escritorio.codigo}
                          </span>
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
                      <span
                        className={`${styles.statusBadge} ${styles[`status${escritorio.status}`]}`}
                      >
                        {escritorio.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          vencimentoStatus === 'vencido'
                            ? styles.vencimentoVencido
                            : vencimentoStatus === 'proximo'
                              ? styles.vencimentoProximo
                              : ''
                        }
                      >
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className={styles.pageButton}>
              Anterior
            </Link>
          )}
          <span className={styles.pageInfo}>
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} className={styles.pageButton}>
              Próxima
            </Link>
          )}
        </div>
      )}

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
                    onChange={e => {
                      const masked = formatCNPJCPF(e.target.value);
                      setFormData({ ...formData, documento: masked });
                      setCnpjError(null);
                      setCnpjValid(null);

                      const digits = masked.replace(/\D/g, '');
                      if (digits.length === 14) {
                        if (validateCNPJ(digits)) {
                          setCnpjValid(true);
                        } else {
                          setCnpjError('CNPJ inválido');
                          setCnpjValid(false);
                        }
                      }
                    }}
                    onBlur={() => {
                      const digits = formData.documento.replace(/\D/g, '');
                      if (digits.length > 0 && digits.length < 14) {
                        setCnpjError('CNPJ deve ter 14 dígitos');
                        setCnpjValid(false);
                      } else if (digits.length === 14 && !validateCNPJ(digits)) {
                        setCnpjError('CNPJ inválido');
                        setCnpjValid(false);
                      }
                    }}
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    className={cnpjValid === true ? styles.inputValid : cnpjValid === false ? styles.inputInvalid : ''}
                  />
                  {cnpjError && (
                    <span className={styles.fieldError}>{cnpjError}</span>
                  )}
                  {cnpjValid === true && !cnpjError && (
                    <span className={styles.fieldSuccess}>CNPJ válido</span>
                  )}
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
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
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
                  {loading
                    ? 'Salvando...'
                    : editingEscritorio
                      ? 'Salvar Alterações'
                      : 'Criar Escritório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir Escritório"
        message={`Tem certeza que deseja excluir "${deleteConfirm.escritorioNome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, escritorioId: null, escritorioNome: '' })}
      />
    </>
  );
}
