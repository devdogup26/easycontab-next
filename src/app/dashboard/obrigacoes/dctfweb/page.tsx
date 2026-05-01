import { prisma } from '@/lib/server/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DCTFWebClient from './DCTFWebClient';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function DCTFWebPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;

  const obrigacoes = await prisma.obrigacao.findMany({
    where: {
      cliente: { escritorioId },
      tipo: 'DCTFWEB',
    },
    include: {
      cliente: {
        select: {
          id: true,
          documento: true,
          nomeRazao: true,
        },
      },
    },
    orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    take: 50,
  });

  const stats = {
    emProcessamento: obrigacoes.filter(o => o.status === 'EM_PROCESSAMENTO').length,
    inconsistencia: obrigacoes.filter(o => o.status === 'INCONSISTENCIA').length,
    entregue: obrigacoes.filter(o => o.status === 'ENTREGUE').length,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>DCTFWeb em Andamento</h1>
          <p className={styles.subtitle}>Declarações sendo processadas ou com inconsistências</p>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={`${styles.statCard} ${styles.statWarning}`}>
          <div className={styles.statValue}>{stats.emProcessamento}</div>
          <div className={styles.statLabel}>Em Processamento</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCritical}`}>
          <div className={styles.statValue}>{stats.inconsistencia}</div>
          <div className={styles.statLabel}>Com Inconsistência</div>
        </div>
        <div className={`${styles.statCard} ${styles.statSuccess}`}>
          <div className={styles.statValue}>{stats.entregue}</div>
          <div className={styles.statLabel}>Entregues (Total)</div>
        </div>
      </div>

      <DCTFWebClient obrigacoes={obrigacoes} />
    </div>
  );
}
