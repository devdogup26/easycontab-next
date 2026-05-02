import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { Prisma } from '@prisma/client';
import { registrarAuditoria } from '@/lib/auditoria';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const perfil = (session.user as any).perfil;
  if (!perfil?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { codigo, descricao, aliquota } = body;

  try {
    const oldItem = await prisma.configAuxiliar.findUnique({ where: { id } });
    if (!oldItem) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

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

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId: user.escritorioId,
      acao: 'UPDATE',
      entidade: 'ConfigAuxiliar',
      entidadeId: item.id,
      dadosAntigos: oldItem,
      dadosNovos: item,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const perfil = (session.user as any).perfil;
  if (!perfil?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const itemToDelete = await prisma.configAuxiliar.findUnique({ where: { id } });
    if (!itemToDelete) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    await prisma.configAuxiliar.delete({ where: { id } });

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId: user.escritorioId,
      acao: 'DELETE',
      entidade: 'ConfigAuxiliar',
      entidadeId: id,
      dadosAntigos: itemToDelete,
      dadosNovos: null,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    throw error;
  }
}
