import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { SessionProvider } from '@/components/providers/SessionProvider'
import styles from './layout.module.css'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <SessionProvider>
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}