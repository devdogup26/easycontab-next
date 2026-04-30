import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; perfilId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, perfilId } = await params
  const body = await req.json()
  const { nome, isAdmin, permissoes } = body

  const permissaoRecords = await prisma.permissao.findMany({
    where: { codigo: { in: permissoes || [] } }
  })

  try {
    const perfil = await prisma.perfil.update({
      where: { id: perfilId },
      data: {
        nome,
        isAdmin: isAdmin || false,
        permissoes: { set: permissaoRecords.map(p => ({ id: p.id })) }
      },
      include: {
        _count: { select: { usuarios: true } },
        permissoes: { select: { codigo: true } }
      }
    })
    return NextResponse.json(perfil)
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    if (error.code === 'P2002') return NextResponse.json({ error: 'Nome do perfil já existe para este escritório' }, { status: 409 })
    throw error
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; perfilId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, perfilId } = await params

  try {
    await prisma.perfil.delete({ where: { id: perfilId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    throw error
  }
}