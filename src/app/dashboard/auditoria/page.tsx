import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import AuditoriaClient from './AuditoriaClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    entidade?: string;
    acao?: string;
    dataInicio?: string;
    dataFim?: string;
  }>;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;
  const params = await searchParams;

  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const entidade = params.entidade || '';
  const acao = params.acao || '';
  const dataInicio = params.dataInicio || '';
  const dataFim = params.dataFim || '';

  const pageSize = 10;

  const where: Record<string, unknown> = {
    escritorioId,
  };

  if (search) {
    where.OR = [
      { usuarioNome: { contains: search, mode: 'insensitive' } },
      { entidade: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (entidade) {
    where.entidade = entidade;
  }

  if (acao) {
    where.acao = acao;
  }

  if (dataInicio || dataFim) {
    where.createdAt = {};
    if (dataInicio) {
      where.createdAt.gte = new Date(dataInicio);
    }
    if (dataFim) {
      const endDate = new Date(dataFim);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const [records, total] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditoria.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AuditoriaClient
      records={records}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      searchParams={{
        search,
        entidade,
        acao,
        dataInicio,
        dataFim,
      }}
    />
  );
}