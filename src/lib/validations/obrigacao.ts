import { z } from 'zod';

export const createObrigacaoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  tipo: z.enum([
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
  ]),
  ano: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  dataVencimento: z.string().datetime().optional().nullable(),
  observacao: z.string().optional(),
});

export type CreateObrigacaoInput = z.infer<typeof createObrigacaoSchema>;