'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createObrigacao(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const escritorioId = (session.user as any).escritorioId

  const clienteId = formData.get('clienteId') as string
  const cliente = await prisma.clienteFinal.findFirst({
    where: { id: clienteId, escritorioId }
  })
  if (!cliente) throw new Error('Cliente não encontrado')

  await prisma.obrigacao.create({
    data: {
      clienteId,
      tipo: formData.get('tipo') as any,
      ano: parseInt(formData.get('ano') as string),
      mes: parseInt(formData.get('mes') as string),
      status: 'OUTROS' as any
    }
  })

  revalidatePath('/dashboard/obrigacoes')
}