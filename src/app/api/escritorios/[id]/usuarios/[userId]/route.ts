import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import bcrypt from 'bcryptjs'

// PUT /api/escritorios/[id]/usuarios/[userId] - Update usuario
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, userId } = await params
  const body = await req.json()
  const { nome, email, cargo, senha } = body

  try {
    const updateData: any = { nome, email, cargo }
    if (senha) updateData.senha = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      include: { perfil: { select: { id: true, nome: true, isAdmin: true } } }
    })
    return NextResponse.json(usuario)
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    throw error
  }
}

// DELETE /api/escritorios/[id]/usuarios/[userId] - Delete usuario
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params

  const userToDelete = await prisma.usuario.findUnique({ where: { id: userId } })
  if (userToDelete?.email === 'admin@dogup.com.br') {
    return NextResponse.json({ error: 'Usuário sistema não pode ser excluído' }, { status: 403 })
  }

  try {
    await prisma.usuario.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    throw error
  }
}
