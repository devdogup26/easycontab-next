import { prisma } from '@/lib/server/prisma';

export type AuditoriaAcao = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

interface AuditoriaParams {
  usuarioId: string;
  usuarioNome: string;
  escritorioId: string | number;
  acao: AuditoriaAcao;
  entidade: string;
  entidadeId?: string;
  dadosAntigos?: any;
  dadosNovos?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  detalhes?: string;
}

export async function registrarAuditoria(params: AuditoriaParams): Promise<void> {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        escritorioId: typeof params.escritorioId === 'string'
          ? parseInt(params.escritorioId, 10)
          : params.escritorioId,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId || null,
        dadosAntigos: params.dadosAntigos ? JSON.stringify(params.dadosAntigos) : null,
        dadosNovos: params.dadosNovos ? JSON.stringify(params.dadosNovos) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        detalhes: params.detalhes || null,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}