import { z } from 'zod';

const documentoSchema = z.union([
  z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos numéricos'),
  z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
]);

export const createEscritorioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  documento: documentoSchema,
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  crc: z.string().optional(),
  status: z.enum(['ATIVO', 'VENCIDO', 'SUSPENSO']).optional(),
  dataVencimento: z.string().datetime().optional().nullable(),
  tipoPessoa: z.enum(['PF', 'PJ']).optional(),
});

export type CreateEscritorioInput = z.infer<typeof createEscritorioSchema>;

export const updateEscritorioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
  documento: documentoSchema.optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional().nullable(),
  crc: z.string().optional().nullable(),
  status: z.enum(['ATIVO', 'VENCIDO', 'SUSPENSO']).optional(),
  dataVencimento: z.string().datetime().optional().nullable(),
});

export type UpdateEscritorioInput = z.infer<typeof updateEscritorioSchema>;