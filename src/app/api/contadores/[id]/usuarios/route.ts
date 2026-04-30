import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const usuarios = await prisma.usuario.findMany({
    where: { contadorId: id },
    include: { perfil: { select: { id: true, nome: true, isAdmin: true } } },
    orderBy: { nome: 'asc' }
  })

  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { nome, email, cargo, senha, isAdmin } = body

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
  }

  // Create default perfil if isAdmin
  let perfilId = null
  if (isAdmin) {
    const perfil = await prisma.perfil.findFirst({ where: { contadorId: id, isAdmin: true } })
    if (perfil) {
      perfilId = perfil.id
    } else {
      const newPerfil = await prisma.perfil.create({
        data: { nome: 'Administrador', isAdmin: true, contadorId: id }
      })
      perfilId = newPerfil.id
    }
  }

  const senhaHash = await bcrypt.hash(senha, 10)

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nome, email, cargo: cargo || null,
        globalRole: 'CONTADOR',
        contadorId: id,
        perfilId,
        senha: senhaHash
      },
      include: { perfil: { select: { id: true, nome: true, isAdmin: true } } }
    })
    return NextResponse.json(usuario, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    throw error
  }
}