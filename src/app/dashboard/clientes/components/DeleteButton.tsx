'use client';

import { Trash2 } from 'lucide-react';
import sharedStyles from '../../_shared.module.css';

interface DeleteButtonProps {
  clienteId: string;
}

export function DeleteButton({ clienteId }: DeleteButtonProps) {
  return (
    <button
      onClick={() => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
          fetch(`/api/clientes?id=${clienteId}`, { method: 'DELETE' })
            .then(res => {
              if (res.ok) {
                window.location.reload();
              } else {
                alert('Erro ao excluir cliente');
              }
            });
        }
      }}
      className={sharedStyles.actionLink}
      title="Excluir"
      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
    >
      <Trash2 size={16} />
    </button>
  );
}