import { z } from 'zod';

const now = new Date();
const minDate = new Date('1800-01-01');
const maxFutureYears = 1;

export const maxDateFromNow = new Date();
maxDateFromNow.setFullYear(maxDateFromNow.getFullYear() + maxFutureYears);

// Helper to create date validators
function dateField(options: { min?: Date; max?: Date; allowFuture?: boolean; allowPast?: boolean } = {}) {
  const { min = minDate, max = maxDateFromNow, allowFuture = false, allowPast = true } = options;

  return z.coerce
    .date()
    .refine(
      (d) => d >= min,
      { message: `Data não pode ser anterior a ${min.getFullYear()}` }
    )
    .refine(
      (d) => {
        if (allowFuture) return true;
        return d <= (max || maxDateFromNow);
      },
      { message: 'Data não pode ser muito futura' }
    );
}

// ============ CLIENTE ============
const documentoSchema = z.union([
  z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos numéricos'),
  z.string().regex(/^[A-Z0-9]{14}$/, 'CNPJ alfanumérico deve ter 14 caracteres'),
  z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
]);

export const createClienteSchema = z.object({
  tipoPessoa: z.enum(['PF', 'PJ']),
  documento: documentoSchema,
  nomeRazao: z.string().min(1, 'Razão Social é obrigatória').max(255),
  nomeFantasia: z.string().max(255).optional(),
  estadoCivil: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  regime: z.enum(['SIMPLES_NACIONAL', 'NORMAL']),
  situacaoFiscal: z.enum(['REGULAR', 'REGULARIZADO', 'IRREGULAR']).optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  cep: z.string().regex(/^\d{8}$/).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().optional(),
  responsavelTecnico: z.string().optional(),
  dataAbertura: z.coerce
    .date()
    .refine((d) => d >= minDate, { message: 'Data de abertura não pode ser anterior a 1800' })
    .refine((d) => d <= new Date(), { message: 'Data de abertura não pode ser futura' })
    .optional(),
  cnae: z.string().regex(/^\d{7,8}$/, 'CNAE deve ter 7 ou 8 dígitos').optional(),
  optanteSimples: z.boolean().default(false),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;

export const updateClienteSchema = createClienteSchema.partial();

export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

// ============ PARCELAMENTO ============
export const createParcelamentoSchema = z.object({
  clienteId: z.string().cuid(),
  tipo: z.enum(['PGFN', 'NAO_PREVIDENCIARIO', 'SIMPLES_NACIONAL', 'SIMPLIFICADO', 'PREVIDENCIARIO']),
  total: z.number().positive('Valor total deve ser positivo'),
  parcelas: z.number().int().positive('Número de parcelas deve ser positivo'),
  parcelasEmAtraso: z.number().int().min(0).default(0),
  valorAtraso: z.number().positive().optional(),
  inicio: z.string()
    .transform((v) => new Date(v))
    .refine((d) => d >= minDate, { message: 'Data de início não pode ser anterior a 1800' })
    .refine((d) => d <= new Date(), { message: 'Data de início não pode ser futura' }),
});

export type CreateParcelamentoInput = z.infer<typeof createParcelamentoSchema>;

export const updateParcelamentoSchema = z.object({
  total: z.number().positive().optional(),
  parcelas: z.number().int().positive().optional(),
  parcelasEmAtraso: z.number().int().min(0).optional(),
  valorAtraso: z.number().positive().optional().nullable(),
  inicio: z.string()
    .transform((v) => new Date(v))
    .refine((d) => d >= minDate, { message: 'Data de início não pode ser anterior a 1800' })
    .optional(),
});

export type UpdateParcelamentoInput = z.infer<typeof updateParcelamentoSchema>;

// ============ CERTIFICADO ============
export const createCertificadoSchema = z.object({
  clienteId: z.string().cuid(),
  tipo: z.enum(['A1', 'A3']),
  cnpj: z.string().optional(),
  validade: z.string()
    .transform((v) => new Date(v))
    .refine((d) => d >= minDate, { message: 'Data de validade não pode ser anterior a 1800' })
    .refine((d) => d <= maxDateFromNow, { message: 'Data de validade não pode ser mais que 1 ano no futuro' }),
  responsavel: z.string().optional(),
});

export type CreateCertificadoInput = z.infer<typeof createCertificadoSchema>;

export const updateCertificadoSchema = z.object({
  tipo: z.enum(['A1', 'A3']).optional(),
  cnpj: z.string().optional().nullable(),
  validade: z.string()
    .transform((v) => v ? new Date(v) : new Date())
    .refine((d) => d >= minDate, { message: 'Data de validade não pode ser anterior a 1800' })
    .optional(),
  responsavel: z.string().optional().nullable(),
  status: z.enum(['VALIDO', 'VENCIDO', 'CANCELADO']).optional(),
});

export type UpdateCertificadoInput = z.infer<typeof updateCertificadoSchema>;

// ============ OBRIGACAO ============
export const tipoObrigacaoEnum = z.enum([
  'DCTFWEB',
  'EFD_ICMS_IPI',
  'DEFIS',
  'DMED',
  'ECD_SPED',
  'ECF_SPED',
  'EFD_CONTRIBUICOES',
  'ESOCIAL',
  'PGDAS',
  'REINF_R2099',
  'REINF_R4099',
]);

export const statusObrigacaoEnum = z.enum([
  'ENTREGUE',
  'NAO_ENTREGUE',
  'INCONSISTENCIA',
  'EM_PROCESSAMENTO',
  'OUTROS',
]);

export const createObrigacaoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  tipo: tipoObrigacaoEnum,
  ano: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  mes: z.number().int().min(1).max(12),
  dataVencimento: z.string()
    .datetime()
    .optional()
    .nullable()
    .transform((v) => v ? new Date(v) : undefined)
    .refine((d) => !d || d >= minDate, { message: 'Data de vencimento não pode ser anterior a 1800' })
    .refine((d) => !d || d <= maxDateFromNow, { message: 'Data de vencimento não pode ser mais que 1 ano no futuro' }),
  observacao: z.string().optional(),
});

export type CreateObrigacaoInput = z.infer<typeof createObrigacaoSchema>;

export const updateObrigacaoSchema = z.object({
  status: statusObrigacaoEnum.optional(),
  reciboUrl: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  dataVencimento: z.string()
    .datetime()
    .optional()
    .nullable()
    .transform((v) => v ? new Date(v) : undefined)
    .refine((d) => !d || d >= minDate, { message: 'Data de vencimento não pode ser anterior a 1800' }),
});

export type UpdateObrigacaoInput = z.infer<typeof updateObrigacaoSchema>;

// ============ PROCURACAO ============
export const createProcuracaoSchema = z.object({
  clienteId: z.string().cuid(),
  tipo: z.enum(['COMPLETA', 'PARCIAL', 'LIMITADA']),
  validade: z.string()
    .transform((v) => new Date(v))
    .refine((d) => d >= minDate, { message: 'Data de validade não pode ser anterior a 1800' })
    .refine((d) => d <= maxDateFromNow, { message: 'Data de validade não pode ser mais que 1 ano no futuro' }),
});

export type CreateProcuracaoInput = z.infer<typeof createProcuracaoSchema>;

// ============ UTILITIES ============
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function sanitizeDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isValidDate(date) ? date : null;
}