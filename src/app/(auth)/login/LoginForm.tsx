'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import styles from './LoginForm.module.css'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Credenciais inválidas')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Erro interno. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.error}>{error}</div>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>Email</label>
        <div className={styles.inputWrapper}>
          <Mail size={18} className={styles.icon} />
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>Senha</label>
        <div className={styles.inputWrapper}>
          <Lock size={18} className={styles.icon} />
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className={styles.input}
          />
        </div>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}