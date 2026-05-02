'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { registrarAuditoria } from '@/lib/auditoria';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { StatusObrigacao } from '@prisma/client';
import { createObrigacaoSchema, updateObrigacaoSchema } from '@/lib/validations/obrigacao';

export async function createObrigacao(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'Não autenticado. Faça login novamente.' };
  }

  const escritorioId = (session.user as any).escritorioId;
  const user = session.user as any;

  const rawData = {
    clienteId: formData.get('clienteId') as string,
    tipo: formData.get('tipo') as string,
    ano: formData.get('ano') as string,
    mes: formData.get('mes') as string,
    dataVencimento: (formData.get('dataVencimento') as string) || undefined,
    observacao: (formData.get('observacao') as string) || undefined,
  };

  const parsed = createObrigacaoSchema.safeParse(rawData);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors };
  }

  // Verify cliente belongs to escritorio
  const cliente = await prisma.clienteFinal.findFirst({
    where: { id: parsed.data.clienteId, escritorioId },
  });

  if (!cliente) {
    return { errors: { clienteId: ['Cliente não encontrado'] } };
  }

  // Check for duplicate (same cliente, tipo, ano, mes)
  const existing = await prisma.obrigacao.findFirst({
    where: {
      clienteId: parsed.data.clienteId,
      tipo: parsed.data.tipo,
      ano: parsed.data.ano,
      mes: parsed.data.mes,
    },
  });

  if (existing) {
    return { errors: { tipo: ['Obrigação já cadastrada para este cliente no mesmo período'] } };
  }

  try {
    const obrigacao = await prisma.obrigacao.create({
      data: {
        clienteId: parsed.data.clienteId,
        tipo: parsed.data.tipo,
        ano: parsed.data.ano,
        mes: parsed.data.mes,
        dataVencimento: parsed.data.dataVencimento
          ? new Date(parsed.data.dataVencimento)
          : null,
        observacao: parsed.data.observacao,
        status: 'OUTROS' as StatusObrigacao,
      },
    });

    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'CREATE',
      entidade: 'Obrigacao',
      entidadeId: obrigacao.id,
      dadosAntigos: null,
      dadosNovos: obrigacao,
    });

    revalidatePath('/dashboard/obrigacoes');
    redirect('/dashboard/obrigacoes');
  } catch (error: any) {
    console.error('Error creating obrigacao:', error);
    return { error: 'Erro ao criar obrigação. Tente novamente.' };
  }
}

export async function updateObrigacao(id: string, prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'Não autenticado. Faça login novamente.' };
  }

  const escritorioId = (session.user as any).escritorioId;
  const user = session.user as any;

  // Verify ownership
  const existing = await prisma.obrigacao.findFirst({
    where: {
      id,
      cliente: {
        escritorioId,
      },
    },
  });

  if (!existing) {
    return { error: 'Obrigação não encontrada' };
  }

  const rawData = {
    status: (formData.get('status') as string) || undefined,
    reciboUrl: (formData.get('reciboUrl') as string) || undefined,
    observacao: (formData.get('observacao') as string) || undefined,
    dataVencimento: (formData.get('dataVencimento') as string) || undefined,
  };

  const parsed = updateObrigacaoSchema.safeParse(rawData);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors };
  }

  try {
    const updated = await prisma.obrigacao.update({
      where: { id },
      data: {
        ...(parsed.data.status && { status: parsed.data.status }),
        ...(parsed.data.reciboUrl !== undefined && { reciboUrl: parsed.data.reciboUrl }),
        ...(parsed.data.observacao !== undefined && { observacao: parsed.data.observacao }),
        ...(parsed.data.dataVencimento !== undefined && {
          dataVencimento: parsed.data.dataVencimento
            ? new Date(parsed.data.dataVencimento)
            : null,
        }),
      },
    });

    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'UPDATE',
      entidade: 'Obrigacao',
      entidadeId: updated.id,
      dadosAntigos: existing,
      dadosNovos: updated,
    });

    revalidatePath('/dashboard/obrigacoes');
    return { success: true, obrigacao: updated };
  } catch (error: any) {
    console.error('Error updating obrigacao:', error);
    return { error: 'Erro ao atualizar obrigação. Tente novamente.' };
  }
}

export async function deleteObrigacao(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'Não autenticado. Faça login novamente.' };
  }

  const escritorioId = (session.user as any).escritorioId;
  const user = session.user as any;

  // Verify ownership
  const existing = await prisma.obrigacao.findFirst({
    where: {
      id,
      cliente: {
        escritorioId,
      },
    },
  });

  if (!existing) {
    return { error: 'Obrigação não encontrada' };
  }

  try {
    await prisma.obrigacao.delete({
      where: { id },
    });

    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'DELETE',
      entidade: 'Obrigacao',
      entidadeId: id,
      dadosAntigos: existing,
      dadosNovos: null,
    });

    revalidatePath('/dashboard/obrigacoes');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting obrigacao:', error);
    return { error: 'Erro ao excluir obrigação. Tente novamente.' };
  }
}