import { z } from 'zod'

const documentoSchema = z.union([
  z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
  z.string().regex(/^[A-Z\d]{12}\d{2}$/, 'CNPJ alfanumérico inválido'),
  z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
])

export const createClienteSchema = z.object({
  tipoPessoa: z.enum(['PF', 'PJ']),
  documento: documentoSchema,
  nomeRazao: z.string().min(1, 'Razão Social é obrigatória').max(255),
  nomeFantasia: z.string().max(255).optional(),
  estadoCivil: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  regime: z.enum(['SIMPLES_NACIONAL', 'NORMAL']),
  situacaoFiscal: z.enum(['REGULAR', 'REGULARIZADO', 'IRREGULAR']).optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  cep: z.string().regex(/^\d{8}$/).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().optional(),
  responsavelTecnico: z.string().optional()
})

export type CreateClienteInput = z.infer<typeof createClienteSchema>

export const updateClienteSchema = z.object({
  tipoPessoa: z.enum(['PF', 'PJ']).optional(),
  documento: documentoSchema.optional(),
  nomeRazao: z.string().min(1, 'Razão Social é obrigatória').max(255).optional(),
  nomeFantasia: z.string().max(255).optional().nullable(),
  estadoCivil: z.string().optional().nullable(),
  inscricaoEstadual: z.string().optional().nullable(),
  regime: z.enum(['SIMPLES_NACIONAL', 'NORMAL']).optional(),
  situacaoFiscal: z.enum(['REGULAR', 'REGULARIZADO', 'IRREGULAR']).optional(),
  logradouro: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().length(2).optional().nullable(),
  cep: z.string().regex(/^\d{8}$/).optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  telefone: z.string().optional().nullable(),
  responsavelTecnico: z.string().optional().nullable()
})

export type UpdateClienteInput = z.infer<typeof updateClienteSchema>