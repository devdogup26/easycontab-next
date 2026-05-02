import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { createObrigacaoSchema } from '@/lib/validations/obrigacao';
import { registrarAuditoria } from '@/lib/auditoria';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;

  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get('clienteId');
  const tipo = searchParams.get('tipo');
  const status = searchParams.get('status');
  const ano = searchParams.get('ano');
  const mes = searchParams.get('mes');

  const where: Record<string, unknown> = {
    cliente: {
      escritorioId,
    },
  };

  if (clienteId) {
    where.clienteId = clienteId;
  }

  if (tipo) {
    where.tipo = tipo;
  }

  if (status) {
    where.status = status;
  }

  if (ano) {
    where.ano = parseInt(ano, 10);
  }

  if (mes) {
    where.mes = parseInt(mes, 10);
  }

  const obrigacoes = await prisma.obrigacao.findMany({
    where,
    include: {
      cliente: {
        select: {
          id: true,
          nomeRazao: true,
          documento: true,
        },
      },
    },
    orderBy: [
      { ano: 'desc' },
      { mes: 'desc' },
      { tipo: 'asc' },
    ],
  });

  return NextResponse.json(obrigacoes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;

  const body = await req.json();
  const parsed = createObrigacaoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e: z.ZodIssue) => e.message).join(', ') },
      { status: 400 }
    );
  }

  // Verify cliente belongs to escritorio
  const cliente = await prisma.clienteFinal.findFirst({
    where: { id: parsed.data.clienteId, escritorioId },
  });

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
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
    return NextResponse.json(
      { error: 'Obrigação já cadastrada para este cliente no mesmo período' },
      { status: 409 }
    );
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
        status: 'OUTROS',
      },
    });

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'CREATE',
      entidade: 'Obrigacao',
      entidadeId: obrigacao.id,
      dadosAntigos: null,
      dadosNovos: obrigacao,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json(obrigacao, { status: 201 });
  } catch (error: any) {
    console.error('Error creating obrigacao:', error);
    throw error;
  }
}