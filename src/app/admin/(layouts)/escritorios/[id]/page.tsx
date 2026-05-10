import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { EscritorioDetailClient } from './EscritorioDetailClient';
import styles from '../../dashboard/page.module.css';

export const dynamic = 'force-dynamic';

export default async function EscritorioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  if (user.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const escritorioId = parseInt(id, 10);

  const escritorio = await prisma.escritorio.findUnique({
    where: { id: escritorioId },
    include: { clientes: { select: { id: true } } },
  });

  if (!escritorio) {
    redirect('/admin/escritorios');
  }

  const totalClientes = await prisma.clienteFinal.count({
    where: { escritorioId },
  });

  const totalObrigacoes = await prisma.obrigacao.count({
    where: { cliente: { escritorioId } },
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{escritorio.nome}</h1>
          <p className={styles.subtitle}>Detalhes do escritório</p>
        </div>
      </header>
      <EscritorioDetailClient escritorio={escritorio} stats={{ totalClientes, totalObrigacoes }} />
    </div>
  );
}
