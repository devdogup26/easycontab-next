import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const perfis = await prisma.perfil.findMany({
    where: { contadorId: id },
    include: {
      _count: { select: { usuarios: true } },
      permissoes: { select: { codigo: true } }
    },
    orderBy: { nome: 'asc' }
  })

  return NextResponse.json(perfis)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { nome, isAdmin, permissoes } = body

  if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

  // Get permissao records
  const permissaoRecords = await prisma.permissao.findMany({
    where: { codigo: { in: permissoes || [] } }
  })

  try {
    const perfil = await prisma.perfil.create({
      data: {
        nome,
        isAdmin: isAdmin || false,
        contadorId: id,
        permissoes: { connect: permissaoRecords.map(p => ({ id: p.id })) }
      },
      include: {
        _count: { select: { usuarios: true } },
        permissoes: { select: { codigo: true } }
      }
    })
    return NextResponse.json(perfil, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Nome do perfil já existe para este escritório' }, { status: 409 })
    throw error
  }
}