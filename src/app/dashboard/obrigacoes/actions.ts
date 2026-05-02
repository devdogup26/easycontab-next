'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { registrarAuditoria } from '@/lib/auditoria';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { TipoObrigacao, StatusObrigacao } from '@prisma/client';
import { createObrigacaoSchema } from '@/lib/validations/obrigacao';

export async function createObrigacao(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;
  const user = session.user as any;
  const usuarioId = user.id;
  const usuarioNome = user.name || user.email;

  const clienteId = formData.get('clienteId') as string;
  const cliente = await prisma.clienteFinal.findFirst({
    where: { id: clienteId, escritorioId },
  });
  if (!cliente) throw new Error('Cliente não encontrado');

  const tipo = formData.get('tipo') as TipoObrigacao;
  const ano = parseInt(formData.get('ano') as string);
  const mes = parseInt(formData.get('mes') as string);

  const parsed = createObrigacaoSchema.safeParse({ clienteId, tipo, ano, mes });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((e: z.ZodIssue) => e.message).join(', '));
  }

  const obrigacao = await prisma.obrigacao.create({
    data: {
      clienteId,
      tipo: parsed.data.tipo,
      ano: parsed.data.ano,
      mes: parsed.data.mes,
      status: 'OUTROS' as StatusObrigacao,
    },
  });

  await registrarAuditoria({
    usuarioId,
    usuarioNome,
    escritorioId,
    acao: 'CREATE',
    entidade: 'Obrigacao',
    entidadeId: obrigacao.id,
    dadosAntigos: null,
    dadosNovos: obrigacao,
  });

  revalidatePath('/dashboard/obrigacoes');
}
