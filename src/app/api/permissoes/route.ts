import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (!perfil?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const permissoes = await prisma.permissao.findMany({
    orderBy: { codigo: 'asc' }
  })

  return NextResponse.json(permissoes)
}