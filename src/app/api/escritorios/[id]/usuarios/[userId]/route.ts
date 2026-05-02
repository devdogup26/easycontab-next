import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { registrarAuditoria } from '@/lib/auditoria';
import { updateUsuarioSchema } from '@/lib/validations/usuario';

// PUT /api/escritorios/[id]/usuarios/[userId] - Update usuario
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, userId } = await params;
  const body = await req.json();

  const parsed = updateUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e: z.ZodIssue) => e.message).join(', ') },
      { status: 400 }
    );
  }

  const { nome, email, cargo, senha } = parsed.data;

  try {
    const oldUsuario = await prisma.usuario.findUnique({ where: { id: userId } });

    const updateData: Prisma.UsuarioUpdateInput = { nome, email, cargo };
    if (senha) updateData.senha = await bcrypt.hash(senha, 12);

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      include: { perfil: { select: { id: true, nome: true, isAdmin: true } } },
    });

    const auditUser = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: auditUser.id,
      usuarioNome: auditUser.nome,
      escritorioId: id,
      acao: 'UPDATE',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      dadosAntigos: oldUsuario,
      dadosNovos: usuario,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json(usuario);
  } catch (error: any) {
    if (error.code === 'P2025')
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    if (error.code === 'P2002')
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    throw error;
  }
}

// DELETE /api/escritorios/[id]/usuarios/[userId] - Delete usuario
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;

  const userToDelete = await prisma.usuario.findUnique({ where: { id: userId } });
  if (userToDelete?.email === 'admin@dogup.com.br') {
    return NextResponse.json({ error: 'Usuário sistema não pode ser excluído' }, { status: 403 });
  }

  try {
    const deletedUsuario = await prisma.usuario.delete({ where: { id: userId } });
    const auditUser = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: auditUser.id,
      usuarioNome: auditUser.nome,
      escritorioId: id,
      acao: 'DELETE',
      entidade: 'Usuario',
      entidadeId: userId,
      dadosAntigos: deletedUsuario,
      dadosNovos: null,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025')
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    throw error;
  }
}
