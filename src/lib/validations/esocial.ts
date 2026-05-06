// eSocial Validation Schemas - Zod
import { z } from 'zod';

// ============================================
// Base schemas
// ============================================
const IdeEventoSchema = z.object({
  tpAmb: z.enum(['1', '2']),
  procEmi: z.enum(['1', '2', '3', '4']),
  verProc: z.string().min(1),
});

const IdeEmpregadorSchema = z.object({
  nrInsc: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
  ideEmpregador: z.string().optional(),
});

const IdeTrabalhadorSchema = z.object({
  cpfTrab: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  nisTrab: z.string().regex(/^\d{11}$/, 'NIS deve ter 11 dígitos').optional(),
});

// ============================================
// S-1200 Schema
// ============================================
export const s1200Schema = z.object({
  tipo: z.enum(['S_1200']),
  clienteId: z.string().cuid(),
  ano: z.number().int().min(2020).max(2099),
  mes: z.number().int().min(1).max(12),
  TrabalhadorId: z.string().cuid().optional(),
  ideEvento: IdeEventoSchema,
  ideEmpregador: IdeEmpregadorSchema,
  ideTrabalhador: IdeTrabalhadorSchema,
  dmDev: z.array(z.object({
    ideDmDev: z.string(),
    codCateg: z.string().regex(/^\d{3}$/, 'Código categoria deve ter 3 dígitos'),
    vrTotBcIRRF: z.number().optional(),
    vrTotRetDep: z.number().optional(),
  })),
});

export type S1200Input = z.infer<typeof s1200Schema>;

// ============================================
// S-1210 Schema
// ============================================
export const s1210Schema = z.object({
  tipo: z.enum(['S_1210']),
  clienteId: z.string().cuid(),
  ano: z.number().int().min(2020).max(2099),
  mes: z.number().int().min(1).max(12),
  TrabalhadorId: z.string().cuid().optional(),
  ideEvento: IdeEventoSchema,
  ideEmpregador: IdeEmpregadorSchema,
  ideTrabalhador: IdeTrabalhadorSchema,
  infoPgto: z.array(z.object({
    ideDmDev: z.string(),
    dtPgto: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    vrPgt: z.number().positive(),
    formaPgto: z.string().optional(),
  })),
});

export type S1210Input = z.infer<typeof s1210Schema>;

// ============================================
// S-1250 Schema
// ============================================
export const s1250Schema = z.object({
  tipo: z.enum(['S_1250']),
  clienteId: z.string().cuid(),
  ano: z.number().int().min(2020).max(2099),
  mes: z.number().int().min(1).max(12),
  TrabalhadorId: z.string().cuid().optional(),
  ideEvento: IdeEventoSchema,
  ideEmpregador: IdeEmpregadorSchema,
  ideTrabalhador: IdeTrabalhadorSchema,
  infoBenPrDS: z.array(z.object({
    ideBenPrDS: z.string(),
    cnpjOrigem: z.string().regex(/^\d{14}$/).optional(),
    dtIniBeneficio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    vrBene: z.number().optional(),
  })),
});

export type S1250Input = z.infer<typeof s1250Schema>;

// ============================================
// Worker (Trabalhador) Schema
// ============================================
export const trabalhadorSchema = z.object({
  clienteId: z.string().cuid(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  nome: z.string().min(2).max(100),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  tipoRegime: z.enum(['CLT', 'ESTATUTARIO', 'TERCEIRIZADO', 'AUTONOMO', 'PEQUENAS_EMPRESAS']),
  ctps: z.string().optional(),
  serieCtps: z.string().optional(),
  ufCtps: z.string().length(2).optional(),
  pis: z.string().regex(/^\d{11}$/).optional().or(z.literal('')),
  cnh: z.string().optional(),
  tipoCertidao: z.string().optional(),
  certidaoLivro: z.string().optional(),
  certidaoFolha: z.string().optional(),
  certidaoTermo: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  cep: z.string().regex(/^\d{8}$/).optional().or(z.literal('')),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
});

export type TrabalhadorInput = z.infer<typeof trabalhadorSchema>;

// ============================================
// Certificate Upload Schema
// ============================================
export const certificateUploadSchema = z.object({
  clienteId: z.string().cuid(),
  senha: z.string().min(1, 'Senha do certificado é obrigatória'),
});

export type CertificateUploadInput = z.infer<typeof certificateUploadSchema>;