import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { Prisma } from '@prisma/client';

// GET /api/admin/config-auxiliares/[id] - Single record
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
    const item = await prisma.configAuxiliar.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    throw error;
  }
}

// PUT /api/admin/config-auxiliares/[id] - Update record
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
  const { codigo, descricao, aliquota } = body;

  try {
    const item = await prisma.configAuxiliar.update({
      where: { id },
      data: {
        codigo,
        descricao,
        aliquota:
          aliquota !== undefined
            ? aliquota
              ? new Prisma.Decimal(aliquota.toString())
              : null
            : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Código já existente para este tipo' }, { status: 409 });
    }
    throw error;
  }
}

// DELETE /api/admin/config-auxiliares/[id] - Remove record
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
    await prisma.configAuxiliar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    throw error;
  }
}