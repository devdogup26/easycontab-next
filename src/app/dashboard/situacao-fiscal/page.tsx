import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { SituacaoFiscalClient } from './SituacaoFiscalClient';
import styles from './page.module.css';
import sharedStyles from '../_shared.module.css';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string; situacao?: string }>;
}

export default async function SituacaoFiscalPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const escritorioId = (session.user as any).escritorioId;
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const activeSituacao = params.situacao || '';

  const [totalClientes, regularCount, regularizadoCount, irregularCount] = await Promise.all([
    prisma.clienteFinal.count({ where: { escritorioId } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'REGULAR' } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'REGULARIZADO' } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'IRREGULAR' } }),
  ]);

  const skip = (page - 1) * PAGE_SIZE;

  // Get clients by situation for the list
  const [clientesRegular, clientesRegularizado, clientesIrregular] = await Promise.all([
    prisma.clienteFinal.findMany({
      where: { escritorioId, situacaoFiscal: 'REGULAR' },
      select: { id: true, nomeRazao: true, documento: true },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.clienteFinal.findMany({
      where: { escritorioId, situacaoFiscal: 'REGULARIZADO' },
      select: { id: true, nomeRazao: true, documento: true },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.clienteFinal.findMany({
      where: { escritorioId, situacaoFiscal: 'IRREGULAR' },
      select: { id: true, nomeRazao: true, documento: true },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const stats = {
    total: totalClientes,
    regular: regularCount,
    regularizado: regularizadoCount,
    irregular: irregularCount,
  };

  const totalPages = Math.ceil(Math.max(regularCount, regularizadoCount, irregularCount) / PAGE_SIZE);

  const buildUrl = (updates: Record<string, string | null>) => {
    const base = { situacao: activeSituacao, page: String(page) };
    const merged = { ...base, ...updates };
    const searchParamsObj = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== '' && v !== '1') searchParamsObj.set(k, v);
    });
    const str = searchParamsObj.toString();
    return `/dashboard/situacao-fiscal${str ? '?' + str : ''}`;
  };

  return (
    <div className={sharedStyles.page}>
      <div className={sharedStyles.header}>
        <div className={sharedStyles.headerContent}>
          <h1 className={sharedStyles.title}>Situação Fiscal Federal</h1>
          <p className={sharedStyles.subtitle}>
            Visualização consolidada da regularidade fiscal da carteira de clientes
          </p>
        </div>
      </div>

      <SituacaoFiscalClient
        stats={stats}
        clientesRegular={clientesRegular}
        clientesRegularizado={clientesRegularizado}
        clientesIrregular={clientesIrregular}
        activeSituacao={activeSituacao}
        page={page}
        totalPages={totalPages}
        buildUrl={buildUrl}
      />
    </div>
  );
}
