'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createParcelamentoSchema, type CreateParcelamentoInput } from '@/lib/validations/parcelamento';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from '../page.module.css';
import formStyles from '../../clientes/novo/page.module.css';

const TIPO_OPTIONS = [
  { value: 'PGFN', label: 'PGFN - Dívida Ativa da União' },
  { value: 'NAO_PREVIDENCIARIO', label: 'Não Previdenciário' },
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'SIMPLIFICADO', label: 'Simplificado' },
  { value: 'PREVIDENCIARIO', label: 'Previdenciário' },
];

interface Cliente {
  id: string;
  nomeRazao: string;
  documento: string;
}

export default function NovoParcelamentoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateParcelamentoInput>({
    resolver: zodResolver(createParcelamentoSchema),
    defaultValues: {
      parcelasEmAtraso: 0,
    },
  });

  useEffect(() => {
    async function fetchClientes() {
      try {
        const res = await fetch('/api/clientes');
        if (res.ok) {
          const data = await res.json();
          setClientes(data.map((c: any) => ({
            id: c.id,
            nomeRazao: c.nomeRazao,
            documento: c.documento,
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
      } finally {
        setIsLoadingClientes(false);
      }
    }
    fetchClientes();
  }, []);

  const clienteOptions = [
    { value: '', label: 'Selecione um cliente' },
    ...clientes.map(c => ({
      value: c.id,
      label: `${c.nomeRazao} (${c.documento})`,
    })),
  ];

  async function onSubmit(data: CreateParcelamentoInput) {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch('/api/parcelamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || result.details || 'Erro ao criar parcelamento');
        return;
      }

      router.push('/dashboard/parcelamentos');
      router.refresh();
    } catch (error) {
      setServerError('Erro ao criar parcelamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={formStyles.page}>
      <div className={formStyles.header}>
        <div className={formStyles.headerContent}>
          <h1 className={formStyles.title}>Novo Parcelamento</h1>
          <p className={formStyles.subtitle}>Cadastre um novo parcelamento federal</p>
        </div>
      </div>

      <div className={formStyles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={formStyles.form}>
          {serverError && (
            <div className={formStyles.errorBanner}>
              <AlertTriangle size={16} />
              {serverError}
            </div>
          )}

          {/* Dados do Parcelamento */}
          <div className={formStyles.formSection}>
            <h2 className={formStyles.sectionTitle}>
              <CreditCard size={16} />
              Dados do Parcelamento
            </h2>
            <div className={formStyles.grid}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Cliente *</label>
                <CustomSelect
                  value={watch('clienteId') || ''}
                  onChange={(val) => setValue('clienteId', val)}
                  options={clienteOptions}
                  name="clienteId"
                  disabled={isLoadingClientes}
                />
                {errors.clienteId && <p className={formStyles.fieldError}>{errors.clienteId.message}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Tipo de Parcelamento *</label>
                <CustomSelect
                  value={watch('tipo') || ''}
                  onChange={(val) => setValue('tipo', val as CreateParcelamentoInput['tipo'])}
                  options={TIPO_OPTIONS}
                  name="tipo"
                />
                {errors.tipo && <p className={formStyles.fieldError}>{errors.tipo.message}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('total', { valueAsNumber: true })}
                  className={`${formStyles.input} ${errors.total ? formStyles.inputError : ''}`}
                  placeholder="0.00"
                />
                {errors.total && <p className={formStyles.fieldError}>{errors.total.message}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Número de Parcelas *</label>
                <input
                  type="number"
                  {...register('parcelas', { valueAsNumber: true })}
                  className={`${formStyles.input} ${errors.parcelas ? formStyles.inputError : ''}`}
                  placeholder="0"
                  min="1"
                />
                {errors.parcelas && <p className={formStyles.fieldError}>{errors.parcelas.message}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Parcelas em Atraso</label>
                <input
                  type="number"
                  {...register('parcelasEmAtraso', { valueAsNumber: true })}
                  className={formStyles.input}
                  placeholder="0"
                  min="0"
                />
                {errors.parcelasEmAtraso && <p className={formStyles.fieldError}>{errors.parcelasEmAtraso.message}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Valor em Atraso (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('valorAtraso', { valueAsNumber: true })}
                  className={formStyles.input}
                  placeholder="0.00"
                />
                {errors.valorAtraso && <p className={formStyles.fieldError}>{errors.valorAtraso.message}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Data de Início *</label>
                <input
                  type="date"
                  {...register('inicio')}
                  className={`${formStyles.input} ${errors.inicio ? formStyles.inputError : ''}`}
                />
                {errors.inicio && <p className={formStyles.fieldError}>{errors.inicio.message}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={formStyles.actions}>
            <button type="button" onClick={() => router.push('/dashboard/parcelamentos')} className={formStyles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className={formStyles.submitButton}>
              {isLoading ? (
                <>
                  <span className={formStyles.spinner} />
                  Salvando...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Criar Parcelamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}