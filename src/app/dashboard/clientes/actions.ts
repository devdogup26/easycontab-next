'use server'

import { prisma } from '@/lib/server/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { updateClienteSchema } from '@/lib/validations/cliente'

export async function updateCliente(id: string, prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: 'Não autenticado. Faça login novamente.' }
  }

  const escritorioId = (session.user as any).escritorioId

  // Verify ownership
  const existing = await prisma.clienteFinal.findFirst({
    where: { id, escritorioId }
  })
  if (!existing) {
    return { error: 'Cliente não encontrado' }
  }

  const rawData = {
    tipoPessoa: formData.get('tipoPessoa') as string,
    documento: formData.get('documento') as string,
    nomeRazao: formData.get('nomeRazao') as string,
    nomeFantasia: formData.get('nomeFantasia') as string || undefined,
    estadoCivil: formData.get('estadoCivil') as string || undefined,
    inscricaoEstadual: formData.get('inscricaoEstadual') as string || undefined,
    regime: formData.get('regime') as string,
    situacaoFiscal: formData.get('situacaoFiscal') as string,
    logradouro: formData.get('logradouro') as string || undefined,
    bairro: formData.get('bairro') as string || undefined,
    cidade: formData.get('cidade') as string || undefined,
    uf: formData.get('uf') as string || undefined,
    cep: formData.get('cep') as string || undefined,
    email: formData.get('email') as string || undefined,
    telefone: formData.get('telefone') as string || undefined,
    responsavelTecnico: formData.get('responsavelTecnico') as string || undefined,
  }

  const result = updateClienteSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    return { errors }
  }

  const data = result.data

  // Format documento if provided (remove non-digits)
  const formattedDocumento = data.documento?.replace(/\D/g, '')

  // Check for existing cliente with same documento if documento is being updated
  if (formattedDocumento && formattedDocumento !== existing.documento) {
    const existingDoc = await prisma.clienteFinal.findUnique({
      where: { documento: formattedDocumento }
    })
    if (existingDoc && existingDoc.id !== id) {
      return { errors: { documento: ['Cliente já cadastrado com este documento'] } }
    }
  }

  try {
    const cliente = await prisma.clienteFinal.update({
      where: { id },
      data: {
        ...data,
        documento: formattedDocumento || existing.documento
      },
      include: {
        _count: {
          select: {
            obrigacoes: true,
            parcelamentos: true,
            mensagens: true
          }
        }
      }
    })

    revalidatePath('/dashboard/clientes')
    revalidatePath(`/dashboard/clientes/${id}`)

    return { success: true, cliente }
  } catch (error: any) {
    if (error?.message?.includes('Unique constraint')) {
      return { errors: { documento: ['Cliente já cadastrado com este documento'] } }
    }
    return { error: 'Erro ao atualizar cliente. Tente novamente.' }
  }
}