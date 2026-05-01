import { prisma } from '@/lib/server/prisma';

export type TipoAuditoria = 'CREATE' | 'UPDATE' | 'DELETE';

export interface RegistrarAuditoriaParams {
  usuarioId: string;
  usuarioNome: string;
  escritorioId: string;
  acao: TipoAuditoria;
  entidade: string;
  entidadeId: string;
  dadosAntigos?: Record<string, any> | null;
  dadosNovos?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function registrarAuditoria(params: RegistrarAuditoriaParams): Promise<void> {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        escritorioId: params.escritorioId,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        dadosAntigos: params.dadosAntigos ?? undefined,
        dadosNovos: params.dadosNovos ?? undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (error) {
    // Fail silently - audit should not block the main operation
    console.error('[AUDITORIA] Erro ao registrar:', error);
  }
}