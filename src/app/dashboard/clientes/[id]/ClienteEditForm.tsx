'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateClienteSchema, type UpdateClienteInput } from '@/lib/validations/cliente';
import { useRouter } from 'next/navigation';
import { Mail, MapPin, User, FileText, Shield, Loader2, X, Trash2, Save } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import styles from '../novo/page.module.css';

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
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  email: string | null;
  telefone: string | null;
  responsavelTecnico: string | null;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  dataAbertura: string | null;
  cnae: string | null;
  optanteSimples: boolean;
}

interface ClienteEditFormProps {
  cliente: Cliente;
}

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

const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    if (year < 1800) return '';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const getDefaultValues = (cliente: Cliente) => ({
  tipoPessoa: cliente.tipoPessoa as 'PJ' | 'PF',
  documento: cliente.documento,
  nomeRazao: cliente.nomeRazao,
  nomeFantasia: cliente.nomeFantasia || '',
  estadoCivil: cliente.estadoCivil || '',
  inscricaoEstadual: cliente.inscricaoEstadual || '',
  inscricaoMunicipal: cliente.inscricaoMunicipal || '',
  regime: cliente.regime as 'SIMPLES_NACIONAL' | 'NORMAL',
  situacaoFiscal: cliente.situacaoFiscal as 'REGULAR' | 'REGULARIZADO' | 'IRREGULAR',
  logradouro: cliente.logradouro || '',
  numero: cliente.numero || '',
  complemento: cliente.complemento || '',
  bairro: cliente.bairro || '',
  cidade: cliente.cidade || '',
  uf: cliente.uf || '',
  cep: cliente.cep || '',
  email: cliente.email || '',
  telefone: cliente.telefone || '',
  responsavelTecnico: cliente.responsavelTecnico || '',
  cnae: cliente.cnae || '',
  optanteSimples: cliente.optanteSimples,
  dataAbertura: formatDateForInput(cliente.dataAbertura),
});

export default function ClienteEditForm({ cliente }: ClienteEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateClienteInput>({
    resolver: zodResolver(updateClienteSchema),
    defaultValues: getDefaultValues(cliente),
  });

  const tipoPessoa = watch('tipoPessoa');

  async function onSubmit(data: UpdateClienteInput) {
    setIsLoading(true);
    setServerError(null);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    try {
      const response = await fetch(`/api/clientes?id=${cliente.id}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setServerError(Object.values(result.errors).flat().join(', '));
        } else {
          setServerError(result.error || 'Erro ao atualizar cliente');
        }
        return;
      }

      router.push('/dashboard/clientes');
      router.refresh();
    } catch (error) {
      setServerError('Erro ao atualizar cliente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clientes?id=${cliente.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir');
      }
      // Redirect to clients list on success
      window.location.href = '/dashboard/clientes';
    } catch (err: any) {
      setServerError(err.message);
      setDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
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
                disabled
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{tipoPessoa === 'PF' ? 'Nome Completo *' : 'Razão Social *'}</label>
              <input
                type="text"
                {...register('nomeRazao')}
                className={`${styles.input} ${errors.nomeRazao ? styles.inputError : ''}`}
              />
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

            {tipoPessoa === 'PJ' && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Data Abertura</label>
                  <input type="date" {...register('dataAbertura')} className={styles.input} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>CNAE</label>
                  <input
                    type="text"
                    {...register('cnae')}
                    className={styles.input}
                    placeholder="0000000"
                    maxLength={8}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Inscrição Municipal</label>
                  <input
                    type="text"
                    {...register('inscricaoMunicipal')}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Optante pelo Simples</label>
                  <CustomSelect
                    value={watch('optanteSimples') ? 'true' : 'false'}
                    onChange={(val) => setValue('optanteSimples', val === 'true')}
                    options={[
                      { value: 'false', label: 'Não' },
                      { value: 'true', label: 'Sim' },
                    ]}
                    name="optanteSimples"
                  />
                </div>
              </>
            )}

            {tipoPessoa === 'PJ' ? (
              <div className={styles.field}>
                <label className={styles.label}>Nome Fantasia</label>
                <input type="text" {...register('nomeFantasia')} className={styles.input} />
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
              <input type="text" {...register('inscricaoEstadual')} className={styles.input} />
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
            <div className={`${styles.field} ${styles.gridColSpan2}`}>
              <label className={styles.label}>Logradouro</label>
              <input type="text" {...register('logradouro')} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Número</label>
              <input type="text" {...register('numero')} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Complemento</label>
              <input type="text" {...register('complemento')} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Bairro</label>
              <input type="text" {...register('bairro')} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cidade</label>
              <input type="text" {...register('cidade')} className={styles.input} />
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
              <input type="email" {...register('email')} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Telefone</label>
              <input type="tel" {...register('telefone')} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Responsável Técnico</label>
              <input type="text" {...register('responsavelTecnico')} className={styles.input} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/clientes')}
            className={styles.cancelButton}
            title="Cancelar"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className={styles.dangerButton}
            title="Excluir Cliente"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
          >
            <Trash2 size={16} />
          </button>
          <button type="submit" disabled={isLoading} className={styles.submitButton} title="Salvar Alterações" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#10b981' }}>
            {isLoading ? (
              <>
                <span className={styles.spinner} />
              </>
            ) : (
              <Save size={16} />
            )}
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={deleteConfirm}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${cliente.nomeRazao}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  );
}