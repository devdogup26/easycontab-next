import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { Prisma } from '@prisma/client';

// GET /api/admin/config-auxiliares - List all config-auxiliares, filter by tipo query param
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo');

  const where = tipo ? { tipo } : {};

  const items = await prisma.configAuxiliar.findMany({
    where,
    orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }],
  });

  return NextResponse.json(items);
}

// POST /api/admin/config-auxiliares - Create new record
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { tipo, codigo, descricao, aliquota } = body;

  if (!tipo || !codigo || !descricao) {
    return NextResponse.json(
      { error: 'Tipo, código e descrição são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const item = await prisma.configAuxiliar.create({
      data: {
        tipo,
        codigo,
        descricao,
        aliquota: aliquota ? new Prisma.Decimal(aliquota.toString()) : null,
      },
    });

    return NextResponse.json(item, { status: 201 });
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