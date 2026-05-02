import { z } from 'zod';

const minDate = new Date('1800-01-01');

export const createParcelamentoSchema = z.object({
  clienteId: z.string().cuid(),
  tipo: z.enum(['PGFN', 'NAO_PREVIDENCIARIO', 'SIMPLES_NACIONAL', 'SIMPLIFICADO', 'PREVIDENCIARIO']),
  total: z.number().positive(),
  parcelas: z.number().int().positive(),
  parcelasEmAtraso: z.number().int().min(0).default(0),
  valorAtraso: z.number().positive().optional(),
  inicio: z.string()
    .transform(v => new Date(v))
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
    .transform(v => new Date(v))
    .refine((d) => d >= minDate, { message: 'Data de início não pode ser anterior a 1800' })
    .optional(),
});

export type UpdateParcelamentoInput = z.infer<typeof updateParcelamentoSchema>;