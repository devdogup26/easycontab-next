import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import bcrypt from 'bcryptjs';

// GET /api/escritorios/[id]/usuarios - List usuarios for escritorio
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const usuarios = await prisma.usuario.findMany({
    where: { escritorioId: id },
    include: { perfil: { select: { id: true, nome: true, isAdmin: true } } },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(usuarios);
}

// POST /api/escritorios/[id]/usuarios - Create new usuario for escritorio
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { nome, email, cargo, senha, tipoPerfil, login } = body;

  if (!nome || !email || !senha || !tipoPerfil || !login) {
    return NextResponse.json(
      { error: 'Nome, email, senha, tipo de perfil e login são obrigatórios' },
      { status: 400 }
    );
  }

  const perfilObj = await prisma.perfil.findFirst({
    where: { nome: tipoPerfil, escritorioId: id },
  });

  if (!perfilObj) {
    return NextResponse.json(
      { error: `Perfil ${tipoPerfil} não encontrado para este escritório` },
      { status: 400 }
    );
  }

  // Validate login uniqueness within this escritorio
  const existingLogin = await prisma.usuario.findFirst({
    where: { login, escritorioId: id },
  });
  if (existingLogin) {
    return NextResponse.json(
      { error: `Login "${login}" já existe neste escritório` },
      { status: 400 }
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        login,
        nome,
        email,
        cargo: cargo || null,
        globalRole: 'CONTADOR',
        escritorioId: id,
        perfilId: perfilObj.id,
        senha: senhaHash,
      },
      include: { perfil: { select: { id: true, nome: true, isAdmin: true } } },
    });
    return NextResponse.json(usuario, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002')
      return NextResponse.json({ error: 'Login ou email já cadastrado' }, { status: 409 });
    throw error;
  }
}
