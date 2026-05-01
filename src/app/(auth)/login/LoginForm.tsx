'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, Lock } from 'lucide-react';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const login = formData.get('login') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciais inválidas');
        setLoading(false);
        return;
      }

      // Fetch session to determine redirect based on role
      const response = await fetch('/api/auth/session');
      const session = await response.json();

      const user = session?.user;
      const callbackUrl = searchParams.get('callbackUrl');

      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (user?.globalRole === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro interno. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label htmlFor="login" className={styles.label}>
          Login
        </label>
        <div className={styles.inputWrapper}>
          <Mail size={18} className={styles.icon} />
          <input
            id="login"
            name="login"
            type="text"
            required
            placeholder="1_admin ou email@exemplo.com"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Senha
        </label>
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
  );
}
