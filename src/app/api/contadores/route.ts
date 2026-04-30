import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contadores = await prisma.contador.findMany({
    include: {
      _count: {
        select: { clientes: true, usuarios: true }
      }
    },
    orderBy: { nome: 'asc' }
  })

  return NextResponse.json(contadores)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, documento, email, telefone, cidade, uf, crc, tipoPessoa } = body

  if (!nome || !documento || !email) {
    return NextResponse.json({ error: 'Nome, documento e email são obrigatórios' }, { status: 400 })
  }

  // Generate slug from nome
  const slug = nome.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50)

  try {
    const contador = await prisma.contador.create({
      data: {
        nome,
        documento: documento.replace(/\D/g, ''),
        email,
        telefone: telefone?.replace(/\D/g, ''),
        cidade,
        uf: uf?.toUpperCase() || '',
        crc,
        slug: `${slug}-${Date.now()}`,
        tipoPessoa: tipoPessoa || 'PJ'
      }
    })

    return NextResponse.json(contador, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Documento ou email já cadastrado' }, { status: 409 })
    }
    throw error
  }
}