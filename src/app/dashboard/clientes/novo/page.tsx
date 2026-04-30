'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClienteSchema, type CreateClienteInput } from '@/lib/validations/cliente'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function NovoClientePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateClienteInput>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      tipoPessoa: 'PJ',
      regime: 'SIMPLES_NACIONAL',
      situacaoFiscal: 'REGULAR'
    }
  })

  const tipoPessoa = watch('tipoPessoa')

  async function onSubmit(data: CreateClienteInput) {
    setIsLoading(true)
    setServerError(null)

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, value)
      }
    })

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          setServerError(Object.values(result.errors).flat().join(', '))
        } else {
          setServerError(result.error || 'Erro ao criar cliente')
        }
        return
      }

      router.push('/dashboard/clientes')
      router.refresh()
    } catch (error) {
      setServerError('Erro ao criar cliente. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    router.push('/dashboard/clientes')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Novo Cliente</h1>
          <p className={styles.subtitle}>Cadastre um novo cliente na base</p>
        </div>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {serverError && (
            <div className={styles.errorBanner}>
              {serverError}
            </div>
          )}

          {/* Tipo de Pessoa e Documento */}
          <div className={styles.grid}>
            <div>
              <label htmlFor="tipoPessoa" className={styles.label}>Tipo de Pessoa *</label>
              <select
                id="tipoPessoa"
                {...register('tipoPessoa')}
                className={styles.select}
              >
                <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                <option value="PF">Pessoa Física (CPF)</option>
              </select>
            </div>

            <div>
              <label htmlFor="documento" className={styles.label}>
                {tipoPessoa === 'PF' ? 'CPF *' : 'CNPJ *'}
              </label>
              <input
                type="text"
                id="documento"
                {...register('documento')}
                className={`${styles.input} ${errors.documento ? styles.inputError : ''}`}
                placeholder={tipoPessoa === 'PF' ? 'Digite o CPF' : 'Digite o CNPJ'}
              />
              {errors.documento && (
                <p className={styles.fieldError}>{errors.documento.message}</p>
              )}
            </div>
          </div>

          {/* Regime Tributario */}
          <div>
            <label htmlFor="regime" className={styles.label}>Regime Tributário *</label>
            <select id="regime" {...register('regime')} className={styles.select}>
              <option value="SIMPLES_NACIONAL">Simples Nacional</option>
              <option value="NORMAL">Normal (Lucro Presumido/Real)</option>
            </select>
          </div>

          {/* Razão Social */}
          <div>
            <label htmlFor="nomeRazao" className={styles.label}>
              {tipoPessoa === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
            </label>
            <input
              type="text"
              id="nomeRazao"
              {...register('nomeRazao')}
              className={`${styles.input} ${errors.nomeRazao ? styles.inputError : ''}`}
              placeholder={tipoPessoa === 'PF' ? 'Nome completo' : 'Razão Social completa'}
            />
            {errors.nomeRazao && (
              <p className={styles.fieldError}>{errors.nomeRazao.message}</p>
            )}
          </div>

          {/* Nome Fantasia / Estado Civil */}
          {tipoPessoa === 'PJ' ? (
            <div>
              <label htmlFor="nomeFantasia" className={styles.label}>Nome Fantasia</label>
              <input
                type="text"
                id="nomeFantasia"
                {...register('nomeFantasia')}
                className={styles.input}
                placeholder="Nome fantasia (opcional)"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="estadoCivil" className={styles.label}>Estado Civil</label>
              <select id="estadoCivil" {...register('estadoCivil')} className={styles.select}>
                <option value="">Selecione</option>
                <option value="SOLTEIRO">Solteiro(a)</option>
                <option value="CASADO">Casado(a)</option>
                <option value="DIVORCIADO">Divorcido(a)</option>
                <option value="VIUVO">Viúvo(a)</option>
                <option value="UNIAO_ESTAVEL">União Estável</option>
              </select>
            </div>
          )}

          {/* Situação Fiscal */}
          <div>
            <label htmlFor="situacaoFiscal" className={styles.label}>Situação Fiscal</label>
            <select id="situacaoFiscal" {...register('situacaoFiscal')} className={styles.select}>
              <option value="REGULAR">Regular</option>
              <option value="REGULARIZADO">Regularizado</option>
              <option value="IRREGULAR">Irregular</option>
            </select>
          </div>

          {/* Endereço */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Endereço</legend>

            <div className={styles.grid}>
              <div className={styles.colSpan2}>
                <label htmlFor="logradouro" className={styles.label}>Logradouro</label>
                <input
                  type="text"
                  id="logradouro"
                  {...register('logradouro')}
                  className={styles.input}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className={styles.colSpan2}>
                <label htmlFor="bairro" className={styles.label}>Bairro</label>
                <input
                  type="text"
                  id="bairro"
                  {...register('bairro')}
                  className={styles.input}
                  placeholder="Bairro"
                />
              </div>

              <div className={styles.colSpan2}>
                <label htmlFor="cidade" className={styles.label}>Cidade</label>
                <input
                  type="text"
                  id="cidade"
                  {...register('cidade')}
                  className={styles.input}
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label htmlFor="uf" className={styles.label}>UF</label>
                <select id="uf" {...register('uf')} className={styles.select}>
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>

              <div>
                <label htmlFor="cep" className={styles.label}>CEP</label>
                <input
                  type="text"
                  id="cep"
                  {...register('cep')}
                  className={styles.input}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </fieldset>

          {/* Contato */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Contato</legend>

            <div className={styles.grid}>
              <div>
                <label htmlFor="email" className={styles.label}>E-mail</label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className={styles.input}
                  placeholder="contato@empresa.com.br"
                />
              </div>

              <div>
                <label htmlFor="telefone" className={styles.label}>Telefone</label>
                <input
                  type="tel"
                  id="telefone"
                  {...register('telefone')}
                  className={styles.input}
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>
          </fieldset>

          {/* Responsável Técnico */}
          <div>
            <label htmlFor="responsavelTecnico" className={styles.label}>Responsável Técnico</label>
            <input
              type="text"
              id="responsavelTecnico"
              {...register('responsavelTecnico')}
              className={styles.input}
              placeholder="Nome do contador responsável"
            />
          </div>

          {/* Inscrição Estadual */}
          <div>
            <label htmlFor="inscricaoEstadual" className={styles.label}>Inscrição Estadual</label>
            <input
              type="text"
              id="inscricaoEstadual"
              {...register('inscricaoEstadual')}
              className={styles.input}
              placeholder="Inscrição Estadual (opcional)"
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? (
                <span className={styles.loading}>
                  <svg className={styles.spinner} fill="none" viewBox="0 0 24 24">
                    <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                'Criar Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}