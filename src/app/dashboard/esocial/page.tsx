import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EsocialClient from './components/EsocialClient';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function EsocialPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;

  // Fetch events for this escritorio
  const eventos = await prisma.eventoEsocial.findMany({
    where: { escritorioId },
    include: {
      cliente: { select: { id: true, nomeRazao: true } },
      Trabalhador: { select: { id: true, cpf: true, nome: true } },
    },
    orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  // Calculate stats
  const stats = {
    rascunho: eventos.filter(e => e.status === 'RASCUNHO').length,
    processando: eventos.filter(e => ['VALIDANDO', 'PROCESSANDO'].includes(e.status)).length,
    entregue: eventos.filter(e => e.status === 'ENTREGUE').length,
    erro: eventos.filter(e => e.status === 'ERRO').length,
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>eSocial</h1>
          <p className={styles.subtitle}>Eventos de folha de pagamento</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/esocial/trabalhadores" className={styles.newButton}>
            + Novo Trabalhador
          </Link>
          <Link href="/dashboard/esocial/novo-evento" className={styles.newButton}>
            + Novo Evento
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statNeutral}`}>
          <div className={styles.statValue}>{stats.rascunho}</div>
          <div className={styles.statLabel}>Rascunhos</div>
        </div>
        <div className={`${styles.statCard} ${styles.statWarning}`}>
          <div className={styles.statValue}>{stats.processando}</div>
          <div className={styles.statLabel}>Em Processamento</div>
        </div>
        <div className={`${styles.statCard} ${styles.statSuccess}`}>
          <div className={styles.statValue}>{stats.entregue}</div>
          <div className={styles.statLabel}>Entregues</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCritical}`}>
          <div className={styles.statValue}>{stats.erro}</div>
          <div className={styles.statLabel}>Erros</div>
        </div>
      </div>

      {/* Client component */}
      <EsocialClient initialEventos={eventos} />
    </div>
  );
}