import { z } from 'zod';

export const createUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  email: z.string().email('Email inválido'),
  cargo: z.string().max(100).optional().nullable(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
  login: z.string().min(1, 'Login é obrigatório').max(50),
  tipoPerfil: z.string().min(1, 'Tipo de perfil é obrigatório'),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

export const updateUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
  email: z.string().email('Email inválido').optional(),
  cargo: z.string().max(100).optional().nullable(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100).optional(),
});

export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;