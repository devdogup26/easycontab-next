'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/server/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

type ActionState = {
  success: boolean
  error?: string
  message?: string
}

export async function updateProfile(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = (session.user as any).id

  const nome = formData.get('nome') as string
  const email = formData.get('email') as string

  if (!nome || !email) {
    return { success: false, error: 'Nome e email são obrigatórios' }
  }

  try {
    await prisma.usuario.update({
      where: { id: userId },
      data: { nome, email }
    })
    revalidatePath('/dashboard/configuracoes')
    return { success: true, message: 'Perfil atualizado com sucesso' }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Erro ao atualizar perfil' }
  }
}

export async function updateEscritorio(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const escritorioId = (session.user as any).escritorioId

  const nome = formData.get('nome') as string

  if (!nome) {
    return { success: false, error: 'Nome é obrigatório' }
  }

  try {
    await prisma.escritorio.update({
      where: { id: escritorioId },
      data: { nome }
    })
    revalidatePath('/dashboard/configuracoes')
    return { success: true, message: 'Escritório atualizado com sucesso' }
  } catch (error) {
    console.error('Error updating escritorio:', error)
    return { success: false, error: 'Erro ao atualizar escritório' }
  }
}

export async function changePassword(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = (session.user as any).id

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: 'Todos os campos são obrigatórios' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Nova senha e confirmação não coincidem' }
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' }
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } })
    if (!usuario) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    const validPassword = await bcrypt.compare(currentPassword, usuario.senha)
    if (!validPassword) {
      return { success: false, error: 'Senha atual incorreta' }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.usuario.update({
      where: { id: userId },
      data: { senha: hashedPassword }
    })

    return { success: true, message: 'Senha alterada com sucesso' }
  } catch (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Erro ao alterar senha' }
  }
}

export async function terminateSession(sessionId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = (session.user as any).id

  if (!sessionId) {
    return { success: false, error: 'ID da sessão é obrigatório' }
  }

  try {
    await prisma.sessao.delete({
      where: { id: sessionId, usuarioId: userId }
    })
    revalidatePath('/dashboard/configuracoes')
    return { success: true, message: 'Sessão encerrada com sucesso' }
  } catch (error) {
    console.error('Error terminating session:', error)
    return { success: false, error: 'Erro ao encerrar sessão' }
  }
}
