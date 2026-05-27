import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const escritorioId = (session.user as any).escritorioId;

  try {
    const existing = await prisma.certificado.findFirst({
      where: { id, escritorioId },
    });
    if (!existing) return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });

    const body = await req.json();
    const { nome, status, clienteId, password } = body;

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (status !== undefined) updateData.status = status;
    if (clienteId !== undefined) updateData.clienteId = clienteId || null;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const certificado = await prisma.certificado.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ...certificado, conteudo: undefined, passwordHash: undefined });
  } catch (error) {
    console.error('Update certificado error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar certificado' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const escritorioId = (session.user as any).escritorioId;

  try {
    const existing = await prisma.certificado.findFirst({
      where: { id, escritorioId },
    });
    if (!existing) return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });

    await prisma.certificado.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete certificado error:', error);
    return NextResponse.json({ error: 'Erro ao excluir certificado' }, { status: 500 });
  }
}
