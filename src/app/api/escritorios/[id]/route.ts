import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
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
  const escritorioId = parseInt(id, 10);

  try {
    const escritorio = await prisma.escritorio.findUnique({
      where: { id: escritorioId },
    });

    if (!escritorio) {
      return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 });
    }

    const totalClientes = await prisma.clienteFinal.count({
      where: { escritorioId },
    });

    const totalObrigacoes = await prisma.obrigacao.count({
      where: { cliente: { escritorioId } },
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
  const escritorioId = parseInt(id, 10);
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
    const updatedEscritorio = await prisma.escritorio.update({
      where: { id: escritorioId },
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
  const escritorioId = parseInt(id, 10);

  try {
    await prisma.escritorio.delete({
      where: { id: escritorioId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting escritorio:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 });
    }
    throw error;
  }
}