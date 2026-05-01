'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { TableProperties, Plus, Search, Edit, Trash2, X, Check, FolderTree } from 'lucide-react';
import styles from './page.module.css';

type ConfigType = 'cfop' | 'ncm' | 'cst' | 'aliquotas';

interface ConfigItem {
  id: string;
  codigo: string;
  descricao: string;
  tipo?: string;
  aliquota?: number;
  createdAt: string;
}

export default function ConfigAuxiliaresPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<ConfigType>('cfop');
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);

  const [form, setForm] = useState({ codigo: '', descricao: '', tipo: '', aliquota: '' });

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
    if (!(session?.user as any)?.perfil?.isAdmin) redirect('/dashboard');
    fetchItems();
  }, [status, session, activeTab]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(`/api/config-auxiliares?type=${activeTab}`);
      if (res.ok) setItems(await res.json());
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/config-auxiliares/${editingItem.id}` : '/api/config-auxiliares';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tipo: activeTab,
          aliquota: form.aliquota ? parseFloat(form.aliquota) : null,
        }),
      });
      if (res.ok) {
        fetchItems();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      const res = await fetch(`/api/config-auxiliares/${id}?type=${activeTab}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  function openModal(item?: ConfigItem) {
    if (item) {
      setEditingItem(item);
      setForm({
        codigo: item.codigo,
        descricao: item.descricao,
        tipo: item.tipo || '',
        aliquota: item.aliquota?.toString() || '',
      });
    } else {
      setEditingItem(null);
      setForm({ codigo: '', descricao: '', tipo: '', aliquota: '' });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingItem(null);
  }

  const filteredItems = items.filter(
    item =>
      item.codigo.toLowerCase().includes(search.toLowerCase()) ||
      item.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: ConfigType; label: string }[] = [
    { key: 'cfop', label: 'CFOP' },
    { key: 'ncm', label: 'NCM' },
    { key: 'cst', label: 'CST' },
    { key: 'aliquotas', label: 'Alíquotas' },
  ];

  const getColumnTitle = () => {
    switch (activeTab) {
      case 'cfop':
        return 'Código CFOP';
      case 'ncm':
        return 'Código NCM';
      case 'cst':
        return 'Código CST';
      case 'aliquotas':
        return 'Código';
      default:
        return 'Código';
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurações Auxiliares</h1>
          <p className={styles.subtitle}>CFOP, NCM, CST, Alíquotas e outros dados fiscais</p>
        </div>
      </header>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} />
          <input
            type="text"
            placeholder={`Buscar ${activeTab.toUpperCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} />
          <span>Novo</span>
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{getColumnTitle()}</th>
              <th>Descrição</th>
              {activeTab === 'aliquotas' && <th>Alíquota (%)</th>}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>
                  <code className={styles.code}>{item.codigo}</code>
                </td>
                <td>{item.descricao}</td>
                {activeTab === 'aliquotas' && <td>{item.aliquota ? `${item.aliquota}%` : '-'}</td>}
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => openModal(item)}>
                      <Edit size={16} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={activeTab === 'aliquotas' ? 4 : 3} className={styles.emptyRow}>
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>
                {editingItem ? 'Editar' : 'Novo'} {activeTab.toUpperCase()}
              </h2>
              <button onClick={closeModal} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>{getColumnTitle()}</label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descrição</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  required
                />
              </div>
              {activeTab === 'aliquotas' && (
                <div className={styles.formGroup}>
                  <label>Alíquota (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.aliquota}
                    onChange={e => setForm({ ...form, aliquota: e.target.value })}
                  />
                </div>
              )}
              <div className={styles.formActions}>
                <button type="button" onClick={closeModal} className={styles.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  <Check size={16} />
                  <span>{editingItem ? 'Salvar' : 'Criar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
