import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  // Only SUPER_ADMIN can access admin area
  if (user.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Get all escritórios for SUPER_ADMIN
  const escritorios = await prisma.escritorio.findMany({
    orderBy: { codigo: 'asc' },
  });

  // Stats
  const totalEscritorios = escritorios.length;
  const escritoriosAtivos = escritorios.filter(e => e.status === 'ATIVO').length;
  const escritoriosVencidos = escritorios.filter(e => e.status === 'VENCIDO').length;
  const escritoriosSuspensos = escritorios.filter(e => e.status === 'SUSPENSO').length;

  const totalClientes = await prisma.clienteFinal.count();

  const adminData = {
    escritorios,
    stats: {
      totalEscritorios,
      escritoriosAtivos,
      escritoriosVencidos,
      escritoriosSuspensos,
      totalClientes,
    },
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel Administrativo</h1>
          <p className={styles.subtitle}>Gestão de Escritórios Contábeis</p>
        </div>
      </header>
      <AdminDashboard data={adminData} />
    </div>
  );
}
