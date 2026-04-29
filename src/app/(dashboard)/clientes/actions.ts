'use server'

import { prisma } from '@/lib/server/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCliente(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const contadorId = (session.user as any).contadorId

  const data = {
    nomeRazao: formData.get('nomeRazao') as string,
    nomeFantasia: formData.get('nomeFantasia') as string,
    tipoPessoa: formData.get('tipoPessoa') as 'PF' | 'PJ',
    documento: formData.get('documento') as string,
    inscricaoEstadual: formData.get('inscricaoEstadual') as string,
    cidade: formData.get('cidade') as string,
    estado: formData.get('estado') as string,
    telefone: formData.get('telefone') as string,
    email: formData.get('email') as string,
    contadorId,
    regime: 'NORMAL' as const,
    situacaoFiscal: 'REGULAR' as const,
  }

  await prisma.clienteFinal.create({ data })
  revalidatePath('/dashboard/clientes')
  redirect('/dashboard/clientes')
}

export async function updateCliente(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const contadorId = (session.user as any).contadorId

  // Verify ownership
  const existing = await prisma.clienteFinal.findFirst({
    where: { id, contadorId }
  })
  if (!existing) throw new Error('Cliente não encontrado')

  const data = {
    nomeRazao: formData.get('nomeRazao') as string,
    nomeFantasia: formData.get('nomeFantasia') as string,
    tipoPessoa: formData.get('tipoPessoa') as 'PF' | 'PJ',
    documento: formData.get('documento') as string,
    inscricaoEstadual: formData.get('inscricaoEstadual') as string,
    cidade: formData.get('cidade') as string,
    estado: formData.get('estado') as string,
    telefone: formData.get('telefone') as string,
    email: formData.get('email') as string,
  }

  await prisma.clienteFinal.update({ where: { id }, data })
  revalidatePath('/dashboard/clientes')
  redirect('/dashboard/clientes')
}