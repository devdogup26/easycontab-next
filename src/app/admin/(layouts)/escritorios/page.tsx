import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { EscritoriosClient } from './EscritoriosClient';
import styles from '../dashboard/page.module.css';

export const dynamic = 'force-dynamic';

export default async function EscritoriosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  if (user.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all escritorios
  const escritorios = await prisma.escritorio.findMany({
    orderBy: { codigo: 'asc' },
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Escritórios Gerenciados</h1>
          <p className={styles.subtitle}>Gerencie os escritórios contábeis da plataforma</p>
        </div>
      </header>
      <EscritoriosClient escritorios={escritorios} />
    </div>
  );
}
