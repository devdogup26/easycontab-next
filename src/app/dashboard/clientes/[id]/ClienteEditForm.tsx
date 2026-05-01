'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateCliente } from '../actions';
import styles from './ClienteEditForm.module.css';

interface Cliente {
  id: string;
  tipoPessoa: string;
  documento: string;
  nomeRazao: string;
  nomeFantasia: string | null;
  estadoCivil: string | null;
  regime: string;
  situacaoFiscal: string;
  logradouro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  email: string | null;
  telefone: string | null;
  responsavelTecnico: string | null;
  inscricaoEstadual: string | null;
  bairro: string | null;
}

interface ClienteEditFormProps {
  cliente: Cliente;
}

type ActionState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
  cliente?: Cliente;
};

const initialState: ActionState = {};

export default function ClienteEditForm({ cliente }: ClienteEditFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(formActionHandler, initialState);

  async function formActionHandler(prevState: ActionState, formData: FormData) {
    return updateCliente(cliente.id, prevState, formData);
  }

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/clientes');
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className={styles.form}>
      {/* Form fields remain the same */}
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="tipoPessoa">Tipo de Pessoa</label>
          <select
            id="tipoPessoa"
            name="tipoPessoa"
            defaultValue={cliente.tipoPessoa}
            disabled={isPending}
          >
            <option value="PJ">Pessoa Jurídica (CNPJ)</option>
            <option value="PF">Pessoa Física (CPF)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="documento">CNPJ/CPF</label>
          <input
            type="text"
            id="documento"
            name="documento"
            defaultValue={cliente.documento}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="nomeRazao">Razão Social / Nome</label>
          <input
            type="text"
            id="nomeRazao"
            name="nomeRazao"
            defaultValue={cliente.nomeRazao}
            required
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="nomeFantasia">Nome Fantasia</label>
          <input
            type="text"
            id="nomeFantasia"
            name="nomeFantasia"
            defaultValue={cliente.nomeFantasia || ''}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="regime">Regime Tributário</label>
          <select id="regime" name="regime" defaultValue={cliente.regime} disabled={isPending}>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="situacaoFiscal">Situação Fiscal</label>
          <select
            id="situacaoFiscal"
            name="situacaoFiscal"
            defaultValue={cliente.situacaoFiscal}
            disabled={isPending}
          >
            <option value="REGULAR">Regular</option>
            <option value="REGULARIZADO">Regularizado</option>
            <option value="IRREGULAR">Irregular</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="inscricaoEstadual">Inscrição Estadual</label>
          <input
            type="text"
            id="inscricaoEstadual"
            name="inscricaoEstadual"
            defaultValue={cliente.inscricaoEstadual || ''}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={cliente.email || ''}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="telefone">Telefone</label>
          <input
            type="text"
            id="telefone"
            name="telefone"
            defaultValue={cliente.telefone || ''}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="responsavelTecnico">Responsável Técnico</label>
          <input
            type="text"
            id="responsavelTecnico"
            name="responsavelTecnico"
            defaultValue={cliente.responsavelTecnico || ''}
            disabled={isPending}
          />
        </div>
      </div>

      {state.error && <div className={styles.errorMessage}>{state.error}</div>}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}
