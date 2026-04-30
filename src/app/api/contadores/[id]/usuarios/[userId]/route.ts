import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, userId } = await params

  try {
    await prisma.usuario.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    throw error
  }
}