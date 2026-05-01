import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSettingsClient } from './AdminSettingsClient';
import styles from '../dashboard/page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminConfiguracoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  if (user.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurações</h1>
          <p className={styles.subtitle}>Configurações da plataforma administrativa</p>
        </div>
      </header>
      <AdminSettingsClient />
    </div>
  );
}
