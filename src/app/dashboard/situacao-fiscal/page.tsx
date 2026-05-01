import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { SituacaoFiscalClient } from './SituacaoFiscalClient';
import styles from './page.module.css';
import sharedStyles from '../_shared.module.css';

export const dynamic = 'force-dynamic';

export default async function SituacaoFiscalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const escritorioId = (session.user as any).escritorioId;

  const [totalClientes, regularCount, regularizadoCount, irregularCount] = await Promise.all([
    prisma.clienteFinal.count({ where: { escritorioId } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'REGULAR' } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'REGULARIZADO' } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'IRREGULAR' } }),
  ]);

  // Get clients by situation for the list
  const clientesRegular = await prisma.clienteFinal.findMany({
    where: { escritorioId, situacaoFiscal: 'REGULAR' },
    select: { id: true, nomeRazao: true, documento: true },
    take: 20,
  });

  const clientesRegularizado = await prisma.clienteFinal.findMany({
    where: { escritorioId, situacaoFiscal: 'REGULARIZADO' },
    select: { id: true, nomeRazao: true, documento: true },
    take: 20,
  });

  const clientesIrregular = await prisma.clienteFinal.findMany({
    where: { escritorioId, situacaoFiscal: 'IRREGULAR' },
    select: { id: true, nomeRazao: true, documento: true },
    take: 20,
  });

  const stats = {
    total: totalClientes,
    regular: regularCount,
    regularizado: regularizadoCount,
    irregular: irregularCount,
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
      />
    </div>
  );
}
