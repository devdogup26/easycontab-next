import { prisma } from '@/lib/server/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import sharedStyles from '../_shared.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function ClientesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;
  const params = await searchParams;
  const search = params.search || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const where = {
    escritorioId,
    ...(search
      ? {
          OR: [
            { nomeRazao: { contains: search, mode: 'insensitive' as const } },
            { documento: { contains: search, mode: 'insensitive' as const } },
            { cidade: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [clientes, total] = await Promise.all([
    prisma.clienteFinal.findMany({
      where,
      orderBy: { nomeRazao: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.clienteFinal.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.page}>
      <div className={sharedStyles.header}>
        <div className={sharedStyles.headerContent}>
          <h1 className={sharedStyles.title}>Clientes</h1>
        </div>
        <Link href="/dashboard/clientes/novo" className={sharedStyles.newButton}>
          + Novo Cliente
        </Link>
      </div>

      <form method="GET" className={sharedStyles.searchBar}>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome, documento ou cidade..."
          className={sharedStyles.searchInput}
        />
        <button type="submit" className={sharedStyles.pageButton}>
          Buscar
        </button>
        {search && (
          <Link href="/dashboard/clientes" className={sharedStyles.pageButton}>
            Limpar
          </Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <div className={sharedStyles.emptyState}>
          {search ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente cadastrado ainda.'}
        </div>
      ) : (
        <>
          <div className={sharedStyles.tableContainer}>
            <table className={sharedStyles.table}>
              <thead>
                <tr>
                  <th>Nome/Razão</th>
                  <th>Documento</th>
                  <th>Cidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td>{cliente.nomeRazao}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                      {cliente.documento}
                    </td>
                    <td>{cliente.cidade || '-'}</td>
                    <td>
                      <Link
                        href={`/dashboard/clientes/${cliente.id}`}
                        className={sharedStyles.actionLink}
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={sharedStyles.pagination}>
              {page > 1 && (
                <Link
                  href={`/dashboard/clientes?page=${page - 1}${search ? `&search=${search}` : ''}`}
                  className={sharedStyles.pageButton}
                >
                  Anterior
                </Link>
              )}
              <span className={sharedStyles.pageInfo}>
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/clientes?page=${page + 1}${search ? `&search=${search}` : ''}`}
                  className={sharedStyles.pageButton}
                >
                  Próxima
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
