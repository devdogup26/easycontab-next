import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { registrarAuditoria } from '@/lib/auditoria';
import { updateEscritorioSchema } from '@/lib/validations/escritorio';

// GET /api/escritorios/[id] - Get single escritorio with full details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const escritorio = await prisma.escritorio.findUnique({
      where: { id },
    });

    if (!escritorio) {
      return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 });
    }

    // Get stats for this escritorio
    const totalClientes = await prisma.clienteFinal.count({
      where: { escritorioId: id },
    });

    const totalObrigacoes = await prisma.obrigacao.count({
      where: { cliente: { escritorioId: id } },
    });

    return NextResponse.json({ ...escritorio, totalClientes, totalObrigacoes });
  } catch (error) {
    console.error('Error fetching escritorio:', error);
    throw error;
  }
}

// PUT /api/escritorios/[id] - Update escritorio
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const parsed = updateEscritorioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e: z.ZodIssue) => e.message).join(', ') },
      { status: 400 }
    );
  }

  const { nome, documento, email, telefone, crc, status, dataVencimento } = parsed.data;

  try {
    // Fetch current escritorio before update for audit
    const oldEscritorio = await prisma.escritorio.findUnique({
      where: { id },
    });

    if (!oldEscritorio) {
      return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 });
    }

    const updatedEscritorio = await prisma.escritorio.update({
      where: { id },
      data: {
        nome,
        documento: documento?.replace(/\D/g, ''),
        email,
        telefone,
        crc,
        status,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      },
    });

    // Fire-and-forget audit logging
    registrarAuditoria({
      acao: 'UPDATE',
      entidade: 'Escritorio',
      entidadeId: id,
      dadosAntigos: oldEscritorio,
      dadosNovos: updatedEscritorio,
    }).catch(() => {});

    return NextResponse.json(updatedEscritorio);
  } catch (error: any) {
    console.error('Error updating escritorio:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Documento já existente' }, { status: 409 });
    }
    throw error;
  }
}

// DELETE /api/escritorios/[id] - Delete escritorio
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Fetch escritorio before deletion for audit
    const deletedEscritorio = await prisma.escritorio.findUnique({
      where: { id },
    });

    if (!deletedEscritorio) {
      return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 });
    }

    await prisma.escritorio.delete({
      where: { id },
    });

    // Fire-and-forget audit logging
    registrarAuditoria({
      acao: 'DELETE',
      entidade: 'Escritorio',
      entidadeId: id,
      dadosAntigos: deletedEscritorio,
      dadosNovos: null,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting escritorio:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 });
    }
    throw error;
  }
}
