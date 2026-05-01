'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClienteSchema, type CreateClienteInput } from '@/lib/validations/cliente';
import { useRouter } from 'next/navigation';
import { Building2, Mail, MapPin, User, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from './page.module.css';

const UF_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'AC', label: 'AC' }, { value: 'AL', label: 'AL' }, { value: 'AP', label: 'AP' },
  { value: 'AM', label: 'AM' }, { value: 'BA', label: 'BA' }, { value: 'CE', label: 'CE' },
  { value: 'DF', label: 'DF' }, { value: 'ES', label: 'ES' }, { value: 'GO', label: 'GO' },
  { value: 'MA', label: 'MA' }, { value: 'MT', label: 'MT' }, { value: 'MS', label: 'MS' },
  { value: 'MG', label: 'MG' }, { value: 'PA', label: 'PA' }, { value: 'PB', label: 'PB' },
  { value: 'PR', label: 'PR' }, { value: 'PE', label: 'PE' }, { value: 'PI', label: 'PI' },
  { value: 'RJ', label: 'RJ' }, { value: 'RN', label: 'RN' }, { value: 'RS', label: 'RS' },
  { value: 'RO', label: 'RO' }, { value: 'RR', label: 'RR' }, { value: 'SC', label: 'SC' },
  { value: 'SP', label: 'SP' }, { value: 'SE', label: 'SE' }, { value: 'TO', label: 'TO' },
];

const TIPO_PESSOA_OPTIONS = [
  { value: 'PJ', label: 'Pessoa Jurídica (CNPJ)' },
  { value: 'PF', label: 'Pessoa Física (CPF)' },
];

const REGIME_OPTIONS = [
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'NORMAL', label: 'Normal (Lucro Presumido/Real)' },
];

const SITUACAO_OPTIONS = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'REGULARIZADO', label: 'Regularizado' },
  { value: 'IRREGULAR', label: 'Irregular' },
];

const ESTADO_CIVIL_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'SOLTEIRO', label: 'Solteiro(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUVO', label: 'Viúvo(a)' },
  { value: 'UNIAO_ESTAVEL', label: 'União Estável' },
];

export default function NovoClientePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateClienteInput>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      tipoPessoa: 'PJ',
      regime: 'SIMPLES_NACIONAL',
      situacaoFiscal: 'REGULAR',
    },
  });

  const tipoPessoa = watch('tipoPessoa');

  async function onSubmit(data: CreateClienteInput) {
    setIsLoading(true);
    setServerError(null);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setServerError(Object.values(result.errors).flat().join(', '));
        } else {
          setServerError(result.error || 'Erro ao criar cliente');
        }
        return;
      }

      router.push('/dashboard/clientes');
      router.refresh();
    } catch (error) {
      setServerError('Erro ao criar cliente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Novo Cliente</h1>
          <p className={styles.subtitle}>Cadastre um novo cliente na base</p>
        </div>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {serverError && (
            <div className={styles.errorBanner}>
              <Shield size={16} />
              {serverError}
            </div>
          )}

          {/* Dados principais */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <User size={16} />
              Dados Principais
            </h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Tipo de Pessoa *</label>
                <CustomSelect
                  value={tipoPessoa}
                  onChange={(val) => setValue('tipoPessoa', val as 'PJ' | 'PF')}
                  options={TIPO_PESSOA_OPTIONS}
                  name="tipoPessoa"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{tipoPessoa === 'PF' ? 'CPF *' : 'CNPJ *'}</label>
                <input
                  type="text"
                  {...register('documento')}
                  className={`${styles.input} ${errors.documento ? styles.inputError : ''}`}
                  placeholder={tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
                {errors.documento && <p className={styles.fieldError}>{errors.documento.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{tipoPessoa === 'PF' ? 'Nome Completo *' : 'Razão Social *'}</label>
                <input
                  type="text"
                  {...register('nomeRazao')}
                  className={`${styles.input} ${errors.nomeRazao ? styles.inputError : ''}`}
                  placeholder={tipoPessoa === 'PF' ? 'Nome completo' : 'Razão social completa'}
                />
                {errors.nomeRazao && <p className={styles.fieldError}>{errors.nomeRazao.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Regime Tributário *</label>
                <CustomSelect
                  value={watch('regime')}
                  onChange={(val) => setValue('regime', val as 'SIMPLES_NACIONAL' | 'NORMAL')}
                  options={REGIME_OPTIONS}
                  name="regime"
                />
              </div>

              {tipoPessoa === 'PJ' ? (
                <div className={styles.field}>
                  <label className={styles.label}>Nome Fantasia</label>
                  <input type="text" {...register('nomeFantasia')} className={styles.input} placeholder="Nome fantasia" />
                </div>
              ) : (
                <div className={styles.field}>
                  <label className={styles.label}>Estado Civil</label>
                  <CustomSelect
                    value={watch('estadoCivil') || ''}
                    onChange={(val) => setValue('estadoCivil', val as any)}
                    options={ESTADO_CIVIL_OPTIONS}
                    name="estadoCivil"
                  />
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>Situação Fiscal</label>
                <CustomSelect
                  value={watch('situacaoFiscal') || 'REGULAR'}
                  onChange={(val) => setValue('situacaoFiscal', val as 'REGULAR' | 'REGULARIZADO' | 'IRREGULAR')}
                  options={SITUACAO_OPTIONS}
                  name="situacaoFiscal"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Inscrição Estadual</label>
                <input type="text" {...register('inscricaoEstadual')} className={styles.input} placeholder="Inscrição estadual" />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <MapPin size={16} />
              Endereço
            </h2>
            <div className={styles.grid}>
              <div className={styles.gridColSpan2}>
                <label className={styles.label}>Logradouro</label>
                <input type="text" {...register('logradouro')} className={styles.input} placeholder="Rua, número, complemento" />
              </div>

              <div className={styles.gridColSpan2}>
                <label className={styles.label}>Bairro</label>
                <input type="text" {...register('bairro')} className={styles.input} placeholder="Bairro" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Cidade</label>
                <input type="text" {...register('cidade')} className={styles.input} placeholder="Cidade" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>UF</label>
                <CustomSelect
                  value={watch('uf') || ''}
                  onChange={(val) => setValue('uf', val)}
                  options={UF_OPTIONS}
                  name="uf"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>CEP</label>
                <input type="text" {...register('cep')} className={styles.input} placeholder="00000-000" maxLength={9} />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <Mail size={16} />
              Contato
            </h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>E-mail</label>
                <input type="email" {...register('email')} className={styles.input} placeholder="contato@empresa.com.br" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Telefone</label>
                <input type="tel" {...register('telefone')} className={styles.input} placeholder="(00) 0000-0000" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Responsável Técnico</label>
                <input type="text" {...register('responsavelTecnico')} className={styles.input} placeholder="Nome do contador responsável" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button type="button" onClick={() => router.push('/dashboard/clientes')} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Salvando...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Criar Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}