'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './page.module.css';

interface AuditoriaRecord {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  escritorioId: string;
  acao: 'CREATE' | 'UPDATE' | 'DELETE';
  entidade: string;
  entidadeId: string;
  dadosAntigos: Record<string, unknown> | null;
  dadosNovos: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Props {
  records: AuditoriaRecord[];
  currentPage: number;
  totalPages: number;
  total: number;
  searchParams: {
    search: string;
    entidade: string;
    acao: string;
    dataInicio: string;
    dataFim: string;
  };
}

export default function AuditoriaClient({
  records,
  currentPage,
  totalPages,
  total,
  searchParams,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedRecord, setSelectedRecord] = useState<AuditoriaRecord | null>(null);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    const newParams = { ...searchParams, ...updates };

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    if (newParams.page !== '1' && !updates.page) {
      params.delete('page');
    }

    return `${pathname}?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    router.push(updateParams({ search, page: '' }));
  };

  const handleFilterChange = (key: string, value: string) => {
    router.push(updateParams({ [key]: value, page: '' }));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBadgeClass = (acao: string) => {
    switch (acao) {
      case 'CREATE':
        return styles.badgeCreate;
      case 'UPDATE':
        return styles.badgeUpdate;
      case 'DELETE':
        return styles.badgeDelete;
      default:
        return '';
    }
  };

  const getAcaoLabel = (acao: string) => {
    switch (acao) {
      case 'CREATE':
        return 'Criou';
      case 'UPDATE':
        return 'Editou';
      case 'DELETE':
        return 'Excluiu';
      default:
        return acao;
    }
  };

  const getEntidadeLabel = (entidade: string) => {
    switch (entidade) {
      case 'Cliente':
        return 'Cliente';
      case 'Obrigacao':
        return 'Obrigacao';
      case 'Usuario':
        return 'Usuario';
      case 'Escritorio':
        return 'Escritorio';
      default:
        return entidade;
    }
  };

  const formatJson = (data: unknown): string => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Auditoria</h1>
          <p className={styles.subtitle}>
            {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <div className={styles.filtersBar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              name="search"
              placeholder="Buscar por usuario ou entidade..."
              defaultValue={searchParams.search}
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className={styles.filterBtn}>
            Buscar
          </button>
        </form>

        <select
          value={searchParams.entidade}
          onChange={(e) => handleFilterChange('entidade', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todas as entidades</option>
          <option value="Cliente">Cliente</option>
          <option value="Obrigacao">Obrigacao</option>
          <option value="Usuario">Usuario</option>
        </select>

        <select
          value={searchParams.acao}
          onChange={(e) => handleFilterChange('acao', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todas as acoes</option>
          <option value="CREATE">Criar</option>
          <option value="UPDATE">Alterar</option>
          <option value="DELETE">Excluir</option>
        </select>

        <input
          type="date"
          value={searchParams.dataInicio}
          onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
          className={styles.filterSelect}
          placeholder="Data inicio"
        />

        <input
          type="date"
          value={searchParams.dataFim}
          onChange={(e) => handleFilterChange('dataFim', e.target.value)}
          className={styles.filterSelect}
          placeholder="Data fim"
        />
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuario</th>
              <th>Acao</th>
              <th>Entidade</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={styles.clickableRow}
                >
                  <td className={styles.dateCell}>{formatDate(record.createdAt)}</td>
                  <td>{record.usuarioNome}</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(record.acao)}`}>
                      {getAcaoLabel(record.acao)}
                    </span>
                  </td>
                  <td>{getEntidadeLabel(record.entidade)}</td>
                  <td className={styles.idCell}>{record.entidadeId.substring(0, 8)}...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => router.push(updateParams({ page: String(currentPage - 1) }))}
            disabled={currentPage <= 1}
            className={styles.pageBtn}
          >
            Anterior
          </button>

          <span className={styles.pageInfo}>
            Pagina {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => router.push(updateParams({ page: String(currentPage + 1) }))}
            disabled={currentPage >= totalPages}
            className={styles.pageBtn}
          >
            Proximo
          </button>
        </div>
      )}

      {selectedRecord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRecord(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Detalhes da Auditoria</h3>
              <button className={styles.modalClose} onClick={() => setSelectedRecord(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Data/Hora</span>
                  <span className={styles.detailValue}>{formatDate(selectedRecord.createdAt)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Usuario</span>
                  <span className={styles.detailValue}>{selectedRecord.usuarioNome}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Acao</span>
                  <span className={`${styles.badge} ${getBadgeClass(selectedRecord.acao)}`}>
                    {getAcaoLabel(selectedRecord.acao)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Entidade</span>
                  <span className={styles.detailValue}>{getEntidadeLabel(selectedRecord.entidade)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Registro ID</span>
                  <span className={styles.detailValue}>{selectedRecord.entidadeId}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>IP</span>
                  <span className={styles.detailValue}>{selectedRecord.ipAddress || '-'}</span>
                </div>
              </div>

              <div className={styles.diffViewer}>
                <div className={styles.diffSection}>
                  <div className={styles.diffTitle}>Dados Anteriores</div>
                  <pre className={styles.diffContent}>
                    {selectedRecord.dadosAntigos
                      ? formatJson(selectedRecord.dadosAntigos)
                      : 'N/A'}
                  </pre>
                </div>
                <div className={styles.diffSection}>
                  <div className={styles.diffTitle}>Dados Novos</div>
                  <pre className={styles.diffContent}>
                    {selectedRecord.dadosNovos
                      ? formatJson(selectedRecord.dadosNovos)
                      : 'N/A'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}