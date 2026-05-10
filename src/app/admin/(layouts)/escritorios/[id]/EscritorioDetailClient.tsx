'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import styles from '../../dashboard/page.module.css';

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

interface EscritorioDetailClientProps {
  escritorio: Escritorio;
  stats: { totalClientes: number; totalObrigacoes: number };
}

const STATUS_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'SUSPENSO', label: 'Suspenso' },
];

export function EscritorioDetailClient({ escritorio, stats }: EscritorioDetailClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/escritorios/${escritorio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao atualizar');
      }

      router.push('/admin/escritorios');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <Save size={16} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}