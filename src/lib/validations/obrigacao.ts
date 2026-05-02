import { z } from 'zod';
import { TipoObrigacao, StatusObrigacao } from '@prisma/client';

const minDate = new Date('1800-01-01');
const maxDateFromNow = new Date();
maxDateFromNow.setFullYear(maxDateFromNow.getFullYear() + 1);

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
  ano: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  dataVencimento: z.string()
    .datetime()
    .optional()
    .nullable()
    .transform(v => v ? new Date(v) : undefined)
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
    .transform(v => v ? new Date(v) : undefined)
    .refine((d) => !d || d >= minDate, { message: 'Data de vencimento não pode ser anterior a 1800' }),
});

export type UpdateObrigacaoInput = z.infer<typeof updateObrigacaoSchema>;