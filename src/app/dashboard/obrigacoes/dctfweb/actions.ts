'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface DCTFWebSimulation {
  status: 'rascunho' | 'validando' | 'processando' | 'entregue' | 'erro'
  protocolo: string | null
  dataEnvio: Date | null
  recibo: string | null
  erro?: string
}

export interface DCTFWebData {
  clienteId: string
  ano: number
  mes: number
  irpf?: number
  csll?: number
  pis?: number
  cofins?: number
  recolhimento?: number
}

export async function simulateDCTFWebTransmission(
  data: DCTFWebData
): Promise<DCTFWebSimulation> {
  // Simulate validation delay (2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Generate protocol number
  const protocolo = `PROT${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  // Generate mock receipt
  const recibo = `REC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  // Simulate processing (1 second)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    status: 'entregue',
    protocolo,
    dataEnvio: new Date(),
    recibo
  }
}

export async function transmitDCTFWeb(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const escritorioId = (session.user as any).escritorioId
  const userId = (session.user as any).id
  const userName = (session.user as any).name || 'Usuario'

  const clienteId = formData.get('clienteId') as string
  const ano = parseInt(formData.get('ano') as string)
  const mes = parseInt(formData.get('mes') as string)

  // Verify client belongs to contador
  const cliente = await prisma.clienteFinal.findFirst({
    where: { id: clienteId, escritorioId }
  })
  if (!cliente) throw new Error('Cliente não encontrado')

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
      ipAddress: null,
      userAgent: null
    }
  })

  revalidatePath('/dashboard/obrigacoes/dctfweb')
  revalidatePath('/dashboard/obrigacoes')

  return { success: true, obrigacaoId: obrigacao.id }
}