import { z } from 'zod';

const minDate = new Date('1800-01-01');
const maxDateFromNow = new Date();
maxDateFromNow.setFullYear(maxDateFromNow.getFullYear() + 1);

export const createCertificadoSchema = z.object({
  clienteId: z.string().cuid(),
  tipo: z.enum(['A1', 'A3']),
  cnpj: z.string().optional(),
  validade: z.string()
    .transform(v => new Date(v))
    .refine((d) => d >= minDate, { message: 'Data de validade não pode ser anterior a 1800' })
    .refine((d) => d <= maxDateFromNow, { message: 'Data de validade não pode ser mais que 1 ano no futuro' }),
  responsavel: z.string().optional(),
});

export type CreateCertificadoInput = z.infer<typeof createCertificadoSchema>;

export const updateCertificadoSchema = z.object({
  tipo: z.enum(['A1', 'A3']).optional(),
  cnpj: z.string().optional().nullable(),
  validade: z.string()
    .transform(v => v ? new Date(v) : undefined)
    .refine((d) => !d || d >= minDate, { message: 'Data de validade não pode ser anterior a 1800' })
    .optional(),
  responsavel: z.string().optional().nullable(),
  status: z.enum(['VALIDO', 'VENCIDO', 'CANCELADO']).optional(),
});

export type UpdateCertificadoInput = z.infer<typeof updateCertificadoSchema>;
