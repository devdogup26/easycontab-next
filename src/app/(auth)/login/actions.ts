'use server'

import { signIn } from 'next-auth/react'
import { redirect } from 'next/navigation'

export type LoginState = { error: string | null }

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios' }
  }

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false
  })

  if (result?.error) {
    return { error: 'Credenciais inválidas' }
  }

  redirect('/dashboard')
}