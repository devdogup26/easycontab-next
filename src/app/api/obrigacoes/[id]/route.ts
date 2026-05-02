import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { updateObrigacaoSchema } from '@/lib/validations/obrigacao';
import { registrarAuditoria } from '@/lib/auditoria';
import { z } from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  const obrigacao = await prisma.obrigacao.findFirst({
    where: {
      id,
      cliente: {
        escritorioId,
      },
    },
    include: {
      cliente: {
        select: {
          id: true,
          nomeRazao: true,
          documento: true,
        },
      },
    },
  });

  if (!obrigacao) {
    return NextResponse.json({ error: 'Obrigação não encontrada' }, { status: 404 });
  }

  return NextResponse.json(obrigacao);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  // Get existing obrigacao
  const existing = await prisma.obrigacao.findFirst({
    where: {
      id,
      cliente: {
        escritorioId,
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Obrigação não encontrada' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateObrigacaoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e: z.ZodIssue) => e.message).join(', ') },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.obrigacao.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.reciboUrl !== undefined && { reciboUrl: parsed.data.reciboUrl }),
        ...(parsed.data.observacao !== undefined && { observacao: parsed.data.observacao }),
        ...(parsed.data.dataVencimento !== undefined && {
          dataVencimento: parsed.data.dataVencimento
            ? new Date(parsed.data.dataVencimento)
            : null,
        }),
      },
    });

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'UPDATE',
      entidade: 'Obrigacao',
      entidadeId: updated.id,
      dadosAntigos: existing,
      dadosNovos: updated,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating obrigacao:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Obrigação não encontrada' }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  // Get existing obrigacao
  const existing = await prisma.obrigacao.findFirst({
    where: {
      id,
      cliente: {
        escritorioId,
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Obrigação não encontrada' }, { status: 404 });
  }

  try {
    await prisma.obrigacao.delete({
      where: { id },
    });

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'DELETE',
      entidade: 'Obrigacao',
      entidadeId: id,
      dadosAntigos: existing,
      dadosNovos: null,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting obrigacao:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Obrigação não encontrada' }, { status: 404 });
    }
    throw error;
  }
}