import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { createParcelamentoSchema } from '@/lib/validations/parcelamento';
import { registrarAuditoria } from '@/lib/auditoria';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get('clienteId');
  const tipo = searchParams.get('tipo');

  const where: any = {
    cliente: { escritorioId },
  };

  if (clienteId) {
    where.clienteId = clienteId;
  }

  if (tipo) {
    where.tipo = tipo;
  }

  const parcelamentos = await prisma.parcelamento.findMany({
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
    orderBy: { inicio: 'desc' },
  });

  const data = parcelamentos.map(p => ({
    id: p.id,
    clienteId: p.clienteId,
    clienteNome: p.cliente.nomeRazao,
    documento: p.cliente.documento,
    tipo: p.tipo,
    total: Number(p.total),
    parcelas: p.parcelas,
    parcelasEmAtraso: p.parcelasEmAtraso,
    valorAtraso: p.valorAtraso ? Number(p.valorAtraso) : null,
    inicio: p.inicio.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const user = session.user as any;

  try {
    const body = await req.json();
    const result = createParcelamentoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify cliente belongs to escritorio
    const cliente = await prisma.clienteFinal.findFirst({
      where: { id: data.clienteId, escritorioId },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const parcelamento = await prisma.parcelamento.create({
      data: {
        clienteId: data.clienteId,
        tipo: data.tipo,
        total: data.total,
        parcelas: data.parcelas,
        parcelasEmAtraso: data.parcelasEmAtraso,
        valorAtraso: data.valorAtraso,
        inicio: data.inicio,
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

    // Fire-and-forget auditoria
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'CREATE',
      entidade: 'Parcelamento',
      entidadeId: parcelamento.id,
      dadosAntigos: null,
      dadosNovos: parcelamento,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      id: parcelamento.id,
      clienteId: parcelamento.clienteId,
      clienteNome: parcelamento.cliente.nomeRazao,
      documento: parcelamento.cliente.documento,
      tipo: parcelamento.tipo,
      total: Number(parcelamento.total),
      parcelas: parcelamento.parcelas,
      parcelasEmAtraso: parcelamento.parcelasEmAtraso,
      valorAtraso: parcelamento.valorAtraso ? Number(parcelamento.valorAtraso) : null,
      inicio: parcelamento.inicio.toISOString(),
      createdAt: parcelamento.createdAt.toISOString(),
      updatedAt: parcelamento.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create parcelamento error:', error);
    return NextResponse.json({ error: 'Erro ao criar parcelamento' }, { status: 500 });
  }
}