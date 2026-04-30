import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const escritorioId = (session.user as any).escritorioId
  const userId = (session.user as any).id
  const userName = (session.user as any).nome || 'Usuario'

  try {
    const formData = await request.formData()
    const clienteId = formData.get('clienteId') as string
    const ano = parseInt(formData.get('ano') as string)
    const mes = parseInt(formData.get('mes') as string)

    // Verify client belongs to escritorio
    const cliente = await prisma.clienteFinal.findFirst({
      where: { id: clienteId, escritorioId }
    })
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Create or update obrigacao with EM_PROCESSAMENTO status
    const existingObrigacao = await prisma.obrigacao.findFirst({
      where: { clienteId, tipo: 'DCTFWEB', ano, mes }
    })

    let obrigacao
    if (existingObrigacao) {
      obrigacao = await prisma.obrigacao.update({
        where: { id: existingObrigacao.id },
        data: { status: 'EM_PROCESSAMENTO' }
      })
    } else {
      obrigacao = await prisma.obrigacao.create({
        data: {
          clienteId,
          tipo: 'DCTFWEB',
          ano,
          mes,
          status: 'EM_PROCESSAMENTO'
        }
      })
    }

    // Record audit trail
    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        usuarioNome: userName,
        escritorioId,
        acao: 'CREATE',
        entidade: 'Obrigacao',
        entidadeId: obrigacao.id,
        dadosNovos: obrigacao,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null
      }
    })

    return NextResponse.json({ success: true, obrigacaoId: obrigacao.id })
  } catch (error) {
    console.error('DCTFWeb transmission error:', error)
    return NextResponse.json({ error: 'Erro ao transmitir DCTFWeb' }, { status: 500 })
  }
}
