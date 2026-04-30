import { prisma } from '@/lib/server/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

const PAGE_SIZE = 20

export default async function ClientesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const escritorioId = (session.user as any).escritorioId
  const params = await searchParams
  const search = params.search || ''
  const page = Math.max(1, parseInt(params.page || '1', 10))

  const where = {
    escritorioId,
    ...(search ? {
      OR: [
        { nomeRazao: { contains: search, mode: 'insensitive' as const } },
        { documento: { contains: search, mode: 'insensitive' as const } },
        { cidade: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {})
  }

  const [clientes, total] = await Promise.all([
    prisma.clienteFinal.findMany({
      where,
      orderBy: { nomeRazao: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.clienteFinal.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
      </div>

      <form method="GET" className={styles.searchBar}>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome, documento ou cidade..."
          className={styles.searchInput}
        />
        <button type="submit" className={styles.pageButton}>Buscar</button>
        {search && (
          <Link href="/dashboard/clientes" className={styles.pageButton}>Limpar</Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <div className={styles.emptyState}>
          {search ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente cadastrado ainda.'}
        </div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome/Razão</th>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Cidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nomeRazao}</td>
                  <td>{cliente.documento}</td>
                  <td>{cliente.tipoPessoa}</td>
                  <td>{cliente.cidade || '-'}</td>
                  <td className={styles.actions}>
                    <Link
                      href={`/dashboard/clientes/${cliente.id}`}
                      className={`${styles.actionLink} ${styles.editButton}`}
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 && (
                <Link
                  href={`/dashboard/clientes?page=${page - 1}${search ? `&search=${search}` : ''}`}
                  className={styles.pageButton}
                >
                  Anterior
                </Link>
              )}
              <span className={styles.pageInfo}>
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/clientes?page=${page + 1}${search ? `&search=${search}` : ''}`}
                  className={styles.pageButton}
                >
                  Próxima
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}