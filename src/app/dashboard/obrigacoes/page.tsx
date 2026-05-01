import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import sharedStyles from '../_shared.module.css';

export const dynamic = 'force-dynamic';

export default async function ObrigacoesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;

  const obrigacoes = await prisma.obrigacao.findMany({
    where: { cliente: { escritorioId } },
    include: { cliente: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const statusCounts = {
    total: obrigacoes.length,
    pendentes: obrigacoes.filter(o =>
      ['NAO_ENTREGUE', 'INCONSISTENCIA', 'OUTROS'].includes(o.status)
    ).length,
    entregue: obrigacoes.filter(o => o.status === 'ENTREGUE').length,
  };

  return (
    <div className={sharedStyles.page}>
      <div className={sharedStyles.header}>
        <div className={sharedStyles.headerContent}>
          <h1 className={sharedStyles.title}>Obrigações Fiscais</h1>
          <p className={sharedStyles.subtitle}>Gerencie as obrigações fiscais dos seus clientes</p>
        </div>
        <span className={sharedStyles.countBadge}>{statusCounts.total} obrigações</span>
      </div>

      <div className={sharedStyles.tabs}>
        <a href="/dashboard/obrigacoes" className={`${sharedStyles.tab} ${sharedStyles.tabActive}`}>
          Todos ({statusCounts.total})
        </a>
        <a href="/dashboard/obrigacoes?filter=pendentes" className={sharedStyles.tab}>
          Pendentes ({statusCounts.pendentes})
        </a>
        <a href="/dashboard/obrigacoes?filter=entregue" className={sharedStyles.tab}>
          Entregues ({statusCounts.entregue})
        </a>
      </div>

      <div className={sharedStyles.tableContainer}>
        <table className={sharedStyles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Período</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {obrigacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className={sharedStyles.emptyState}>
                  Nenhuma obrigação encontrada
                </td>
              </tr>
            ) : (
              obrigacoes.map(obrigacao => (
                <tr key={obrigacao.id}>
                  <td>{obrigacao.cliente.nomeRazao}</td>
                  <td>{obrigacao.tipo}</td>
                  <td>
                    {obrigacao.mes}/{obrigacao.ano}
                  </td>
                  <td>
                    <span className={`${sharedStyles.badge} ${sharedStyles.badgeNeutral}`}>
                      {obrigacao.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/obrigacoes/${obrigacao.id}`}
                      className={sharedStyles.actionLink}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
