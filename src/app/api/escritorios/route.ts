import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import bcrypt from 'bcryptjs'

// GET /api/escritorios - List all escritorios (SUPER_ADMIN only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const escritorios = await prisma.escritorio.findMany({
      orderBy: { codigo: 'asc' }
    })

    return NextResponse.json(escritorios)
  } catch (error) {
    console.error('Error fetching escritorios:', error)
    throw error
  }
}

// POST /api/escritorios - Create new escritorio with associated contador
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any
  if (user.globalRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, documento, email, telefone, crc, status, dataVencimento, tipoPessoa } = body

  if (!nome || !documento || !email) {
    return NextResponse.json({ error: 'Nome, documento e email são obrigatórios' }, { status: 400 })
  }

  try {
    const nextCodeResult = await prisma.$queryRaw<[{ max: number | null }]>`
      SELECT COALESCE(MAX("codigo"), 0) + 1 as "max" FROM "Escritorio"
    `
    const nextCode = nextCodeResult[0].max || 1

    // Create Escritorio standalone
    const escritorio = await prisma.escritorio.create({
      data: {
        codigo: nextCode,
        nome,
        documento: documento.replace(/\D/g, ''),
        email,
        telefone,
        crc,
        status: status || 'ATIVO',
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        tipoPessoa: tipoPessoa || 'PJ'
      }
    })

    // Create default profiles
    const perfilAdmin = await prisma.perfil.create({
      data: {
        nome: 'ADMIN',
        isAdmin: true,
        escritorioId: escritorio.id
      }
    })

    await prisma.perfil.create({
      data: {
        nome: 'CONTADOR',
        isAdmin: false,
        escritorioId: escritorio.id
      }
    })

    await prisma.perfil.create({
      data: {
        nome: 'OPERADOR',
        isAdmin: false,
        escritorioId: escritorio.id
      }
    })

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.usuario.create({
      data: {
        login: `${nextCode}_admin`,
        email: email,
        senha: hashedPassword,
        nome: `Admin ${nome}`,
        cargo: 'Administrador',
        globalRole: 'CONTADOR',
        escritorioId: escritorio.id,
        perfilId: perfilAdmin.id
      }
    })

    return NextResponse.json(escritorio, { status: 201 })
  } catch (error: any) {
    console.error('Error creating escritorio:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Documento já existente' }, { status: 409 })
    }
    throw error
  }
}
