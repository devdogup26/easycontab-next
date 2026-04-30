'use client'

import { useActionState } from 'react'
import { updateCliente } from '../actions'
import styles from './ClienteEditForm.module.css'

interface Cliente {
  id: string
  tipoPessoa: string
  documento: string
  nomeRazao: string
  nomeFantasia: string | null
  estadoCivil: string | null
  regime: string
  situacaoFiscal: string
  logradouro: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  email: string | null
  telefone: string | null
  responsavelTecnico: string | null
  inscricaoEstadual: string | null
  bairro: string | null
}

interface ClienteEditFormProps {
  cliente: Cliente
  onCancel: () => void
}

type ActionState = {
  errors?: Record<string, string[]>
  error?: string
  success?: boolean
  cliente?: Cliente
}

const initialState: ActionState = {}

export default function ClienteEditForm({ cliente, onCancel }: ClienteEditFormProps) {
  async function formAction(prevState: ActionState, formData: FormData) {
    return updateCliente(cliente.id, prevState, formData)
  }

  const [state, formAction2, isPending] = useActionState(formAction, initialState)

  if (state.success) {
    window.location.href = `/dashboard/clientes/${cliente.id}`
    return null
  }

  return (
    <form action={formAction2} className={styles.form}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="nomeRazao">Razão Social *</label>
          <input
            type="text"
            id="nomeRazao"
            name="nomeRazao"
            defaultValue={cliente.nomeRazao}
            required
            disabled={isPending}
          />
          {state.errors?.nomeRazao && (
            <span className={styles.error}>{state.errors.nomeRazao[0]}</span>
          )}
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
          <label htmlFor="tipoPessoa">Tipo de Pessoa *</label>
          <select id="tipoPessoa" name="tipoPessoa" defaultValue={cliente.tipoPessoa} required disabled={isPending}>
            <option value="PJ">Pessoa Jurídica (PJ)</option>
            <option value="PF">Pessoa Física (PF)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="documento">CPF/CNPJ *</label>
          <input
            type="text"
            id="documento"
            name="documento"
            defaultValue={cliente.documento}
            required
            disabled={isPending}
          />
          {state.errors?.documento && (
            <span className={styles.error}>{state.errors.documento[0]}</span>
          )}
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
          <label htmlFor="regime">Regime Tributário *</label>
          <select id="regime" name="regime" defaultValue={cliente.regime} required disabled={isPending}>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="situacaoFiscal">Situação Fiscal</label>
          <select id="situacaoFiscal" name="situacaoFiscal" defaultValue={cliente.situacaoFiscal} disabled={isPending}>
            <option value="REGULAR">Regular</option>
            <option value="REGULARIZADO">Regularizado</option>
            <option value="IRREGULAR">Irregular</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="estadoCivil">Estado Civil</label>
          <input
            type="text"
            id="estadoCivil"
            name="estadoCivil"
            defaultValue={cliente.estadoCivil || ''}
            disabled={isPending}
          />
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Endereço</h3>
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="logradouro">Logradouro</label>
          <input
            type="text"
            id="logradouro"
            name="logradouro"
            defaultValue={cliente.logradouro || ''}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="bairro">Bairro</label>
          <input
            type="text"
            id="bairro"
            name="bairro"
            defaultValue={cliente.bairro || ''}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="cidade">Cidade</label>
          <input
            type="text"
            id="cidade"
            name="cidade"
            defaultValue={cliente.cidade || ''}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="uf">UF</label>
          <input
            type="text"
            id="uf"
            name="uf"
            defaultValue={cliente.uf || ''}
            maxLength={2}
            disabled={isPending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="cep">CEP</label>
          <input
            type="text"
            id="cep"
            name="cep"
            defaultValue={cliente.cep || ''}
            disabled={isPending}
          />
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Contato</h3>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={cliente.email || ''}
            disabled={isPending}
          />
          {state.errors?.email && (
            <span className={styles.error}>{state.errors.email[0]}</span>
          )}
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

        <div className={`${styles.field} ${styles.fullWidth}`}>
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

      {state.error && (
        <div className={styles.errorMessage}>{state.error}</div>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={isPending}>
          Cancelar
        </button>
      </div>
    </form>
  )
}