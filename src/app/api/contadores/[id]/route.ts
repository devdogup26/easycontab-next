import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { nome, documento, email, telefone, cidade, uf, crc } = body

  try {
    const contador = await prisma.contador.update({
      where: { id },
      data: {
        nome,
        documento: documento?.replace(/\D/g, ''),
        email,
        telefone: telefone?.replace(/\D/g, ''),
        cidade,
        uf: uf?.toUpperCase(),
        crc
      }
    })

    return NextResponse.json(contador)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Contador não encontrado' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Documento ou email já cadastrado' }, { status: 409 })
    }
    throw error
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.contador.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Contador não encontrado' }, { status: 404 })
    }
    throw error
  }
}