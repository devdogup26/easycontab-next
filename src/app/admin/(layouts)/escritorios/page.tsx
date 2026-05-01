import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { EscritoriosClient } from './EscritoriosClient';
import styles from '../dashboard/page.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

const PAGE_SIZE = 15;

export default async function EscritoriosPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  if (user.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const search = params.search || '';
  const status = params.status || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const where = {
    ...(search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' as const } },
            { documento: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as 'ATIVO' | 'VENCIDO' | 'SUSPENSO' } : {}),
  };

  const [escritorios, total] = await Promise.all([
    prisma.escritorio.findMany({
      where,
      orderBy: { codigo: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.escritorio.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Escritórios Gerenciados</h1>
          <p className={styles.subtitle}>{total} escritório{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
      </header>
      <EscritoriosClient
        escritorios={escritorios}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
      />
    </div>
  );
}
