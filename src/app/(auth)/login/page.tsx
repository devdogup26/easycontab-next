import { LoginForm } from './LoginForm'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logoIcon}>📊</span>
          <h1 className={styles.title}>EasyContab</h1>
          <p className={styles.subtitle}>Sistema de gestão contábil</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}