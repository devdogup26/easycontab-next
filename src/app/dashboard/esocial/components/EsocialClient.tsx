'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface Evento {
  id: string;
  tipo: string;
  ano: number;
  mes: number;
  status: string;
  protocolo?: string;
  dataEnvio?: string;
  cliente?: { nomeRazao: string };
  Trabalhador?: { nome: string; cpf: string };
}

interface EsocialClientProps {
  initialEventos: Evento[];
}

export default function EsocialClient({ initialEventos }: EsocialClientProps) {
  const [eventos, setEventos] = useState<Evento[]>(initialEventos);
  const [loading, setLoading] = useState(false);
  const [selectedEventos, setSelectedEventos] = useState<string[]>([]);

  const statusLabels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    VALIDANDO: 'Validando',
    PROCESSANDO: 'Processando',
    ENTREGUE: 'Entregue',
    INCONSISTENCIA: 'Inconsistência',
    ERRO: 'Erro',
  };

  const statusStyles: Record<string, string> = {
    RASCUNHO: styles.statusNeutral,
    VALIDANDO: styles.statusWarning,
    PROCESSANDO: styles.statusWarning,
    ENTREGUE: styles.statusSuccess,
    INCONSISTENCIA: styles.statusCritical,
    ERRO: styles.statusCritical,
  };

  function formatMes(mes: number): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[mes - 1]}/${mes}`;
  }

  function toggleSelect(id: string) {
    setSelectedEventos(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (selectedEventos.length === eventos.filter(e => e.status === 'RASCUNHO').length) {
      setSelectedEventos([]);
    } else {
      setSelectedEventos(eventos.filter(e => e.status === 'RASCUNHO').map(e => e.id));
    }
  }

  async function transmitEvents() {
    if (selectedEventos.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/esocial/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventoIds: selectedEventos }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh events
        const refresh = await fetch('/api/esocial');
        const refreshed = await refresh.json();
        setEventos(refreshed);
        setSelectedEventos([]);
      } else {
        alert(data.error || 'Erro ao transmitir');
      }
    } catch (error) {
      alert('Erro ao transmitir eventos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.content}>
      {/* Actions bar */}
      <div className={styles.actionsBar}>
        <div className={styles.selectionInfo}>
          {selectedEventos.length > 0 && (
            <span>{selectedEventos.length} evento(s) selecionado(s)</span>
          )}
        </div>
        <button
          className={styles.transmitButton}
          disabled={selectedEventos.length === 0 || loading}
          onClick={transmitEvents}
        >
          {loading ? 'Transmitindo...' : 'Transmitir Selecionados'}
        </button>
      </div>

      {/* Events table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkColumn}>
                <input
                  type="checkbox"
                  checked={selectedEventos.length === eventos.filter(e => e.status === 'RASCUNHO').length && selectedEventos.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Trabalhador</th>
              <th>Período</th>
              <th>Status</th>
              <th>Protocolo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map(evento => (
              <tr key={evento.id} className={selectedEventos.includes(evento.id) ? styles.selectedRow : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedEventos.includes(evento.id)}
                    onChange={() => toggleSelect(evento.id)}
                    disabled={evento.status !== 'RASCUNHO'}
                  />
                </td>
                <td className={styles.tipoCell}>{evento.tipo}</td>
                <td>{evento.cliente?.nomeRazao || '-'}</td>
                <td>{evento.Trabalhador ? `${evento.Trabalhador.nome} (${evento.Trabalhador.cpf})` : '-'}</td>
                <td>{formatMes(evento.mes)}/{evento.ano}</td>
                <td>
                  <span className={`${styles.statusBadge} ${statusStyles[evento.status] || styles.statusNeutral}`}>
                    {statusLabels[evento.status] || evento.status}
                  </span>
                </td>
                <td className={styles.protocoloCell}>{evento.protocolo || '-'}</td>
                <td>
                  <button className={styles.actionButton}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {eventos.length === 0 && (
          <div className={styles.emptyState}>
            <p>Nenhum evento eSocial cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}