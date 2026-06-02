import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function TrabalhadoresPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;

  const trabalhadores = await prisma.trabalhador.findMany({
    where: {
      cliente: { escritorioId },
    },
    include: {
      cliente: { select: { id: true, nomeRazao: true } },
    },
    orderBy: { nome: 'asc' },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Trabalhadores</h1>
          <p className={styles.subtitle}>{trabalhadores.length} trabalhador(es) cadastrado(s)</p>
        </div>
        <Link href="/dashboard/esocial/trabalhadores/novo" className={styles.newButton}>
          + Novo Trabalhador
        </Link>
      </div>

      {trabalhadores.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhum trabalhador cadastrado ainda.</p>
          <Link href="/dashboard/esocial/trabalhadores/novo" className={styles.emptyButton}>
            Cadastrar Primeiro Trabalhador
          </Link>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>CPF</th>
                <th>Nome</th>
                <th>Cliente</th>
                <th>Regime</th>
                <th>CTPS</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {trabalhadores.map(trab => (
                <tr key={trab.id}>
                  <td className={styles.cpf}>{trab.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                  <td>{trab.nome}</td>
                  <td>{trab.cliente.nomeRazao}</td>
                  <td>
                    <span className={styles.badge}>
                      {trab.tipoRegime === 'CLT' ? 'CLT' : trab.tipoRegime}
                    </span>
                  </td>
                  <td>{trab.ctps ? `${trab.ctps}${trab.serieCtps ? ` (${trab.serieCtps})` : ''}` : '-'}</td>
                  <td>{formatDate(trab.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}