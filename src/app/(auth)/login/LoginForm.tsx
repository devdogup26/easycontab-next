'use client'

import { useFormState } from 'react-dom'
import { login, LoginState } from './actions'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import styles from './LoginForm.module.css'

const initialState: LoginState = { error: null }

export function LoginForm() {
  const [state, formAction] = useFormState(login, initialState)
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && (
        <div className={styles.error}>{state.error}</div>
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
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.toggleBtn}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" className={styles.submitBtn}>
        Entrar
      </button>
    </form>
  )
}

import React from 'react'