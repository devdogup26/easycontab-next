import { z } from 'zod';

// Algoritmo de validação de CNPJ/CPF
function validateCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;

  // Calc first check digit
  let sum = 0;
  let factor = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 9 ? 2 : factor + 1;
  }
  const rev13 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev13 !== parseInt(cnpj[12])) return false;

  // Calc second check digit
  sum = 0;
  factor = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 9 ? 2 : factor + 1;
  }
  const rev14 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return rev14 === parseInt(cnpj[13]);
}

function validateCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(.)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  const rev10 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev10 !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  const rev11 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return rev11 === parseInt(cpf[10]);
}

const cnpjCpfSchema = z.string().refine((val) => {
  const digits = val.replace(/\D/g, '');
  if (digits.length === 14) return validateCNPJ(digits);
  if (digits.length === 11) return validateCPF(digits);
  return false;
}, 'CNPJ ou CPF inválido');

export const createEscritorioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  documento: cnpjCpfSchema,
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  crc: z.string().optional(),
  status: z.enum(['ATIVO', 'VENCIDO', 'SUSPENSO']).optional(),
  dataVencimento: z.string().optional().nullable(),
  tipoPessoa: z.enum(['PF', 'PJ']).optional(),
});

export type CreateEscritorioInput = z.infer<typeof createEscritorioSchema>;

export const updateEscritorioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
  documento: cnpjCpfSchema.optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional().nullable(),
  crc: z.string().optional().nullable(),
  status: z.enum(['ATIVO', 'VENCIDO', 'SUSPENSO']).optional(),
  dataVencimento: z.string().optional().nullable(),
});

export type UpdateEscritorioInput = z.infer<typeof updateEscritorioSchema>;