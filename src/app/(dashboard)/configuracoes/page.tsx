import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { ConfiguracoesClient } from './ConfiguracoesClient'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = (session.user as any).id
  const contadorId = (session.user as any).contadorId

  const [usuario, contador] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      include: { perfil: true }
    }),
    prisma.contador.findUnique({
      where: { id: contadorId }
    })
  ])

  const usuarioData = usuario ? {
    id: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    cargo: usuario.cargo,
    perfil: usuario.perfil ? {
      id: usuario.perfil.id,
      nome: usuario.perfil.nome,
      isAdmin: usuario.perfil.isAdmin
    } : null
  } : null

  const contadorData = contador ? {
    id: contador.id,
    nome: contador.nome,
    slug: contador.slug,
    logoUrl: contador.logoUrl,
    email: contador.email,
    telefone: contador.telefone,
    crc: contador.crc,
    cna: contador.cna
  } : null

  return (
    <ConfiguracoesClient usuario={usuarioData} contador={contadorData} />
  )
}
