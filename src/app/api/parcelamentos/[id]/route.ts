import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { updateParcelamentoSchema } from '@/lib/validations/parcelamento';
import { registrarAuditoria } from '@/lib/auditoria';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  const parcelamento = await prisma.parcelamento.findFirst({
    where: {
      id,
      cliente: { escritorioId },
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

  if (!parcelamento) {
    return NextResponse.json({ error: 'Parcelamento não encontrado' }, { status: 404 });
  }

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
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const user = session.user as any;
  const { id } = await params;

  // Get existing parcelamento
  const existing = await prisma.parcelamento.findFirst({
    where: {
      id,
      cliente: { escritorioId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Parcelamento não encontrado' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const result = updateParcelamentoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    const updated = await prisma.parcelamento.update({
      where: { id },
      data: {
        ...(data.total !== undefined && { total: data.total }),
        ...(data.parcelas !== undefined && { parcelas: data.parcelas }),
        ...(data.parcelasEmAtraso !== undefined && { parcelasEmAtraso: data.parcelasEmAtraso }),
        ...(data.valorAtraso !== undefined && { valorAtraso: data.valorAtraso }),
        ...(data.inicio !== undefined && { inicio: data.inicio }),
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
      acao: 'UPDATE',
      entidade: 'Parcelamento',
      entidadeId: updated.id,
      dadosAntigos: existing,
      dadosNovos: updated,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      id: updated.id,
      clienteId: updated.clienteId,
      clienteNome: updated.cliente.nomeRazao,
      documento: updated.cliente.documento,
      tipo: updated.tipo,
      total: Number(updated.total),
      parcelas: updated.parcelas,
      parcelasEmAtraso: updated.parcelasEmAtraso,
      valorAtraso: updated.valorAtraso ? Number(updated.valorAtraso) : null,
      inicio: updated.inicio.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Update parcelamento error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar parcelamento' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const user = session.user as any;
  const { id } = await params;

  // Get existing parcelamento
  const existing = await prisma.parcelamento.findFirst({
    where: {
      id,
      cliente: { escritorioId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Parcelamento não encontrado' }, { status: 404 });
  }

  try {
    await prisma.parcelamento.delete({
      where: { id },
    });

    // Fire-and-forget auditoria
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId,
      acao: 'DELETE',
      entidade: 'Parcelamento',
      entidadeId: id,
      dadosAntigos: existing,
      dadosNovos: null,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete parcelamento error:', error);
    return NextResponse.json({ error: 'Erro ao remover parcelamento' }, { status: 500 });
  }
}