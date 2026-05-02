import { prisma } from '@/lib/server/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DCTFWebClient from './DCTFWebClient';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ ano?: string; mes?: string; page?: string }>;
}

const PAGE_SIZE = 20;

const ANO_OPTIONS = [
  { value: '', label: 'Todos os anos' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
];

const MES_OPTIONS = [
  { value: '', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export default async function DCTFWebPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;
  const params = await searchParams;

  const ano = params.ano || '';
  const mes = params.mes || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const where: any = {
    cliente: { escritorioId },
    tipo: 'DCTFWEB',
  };

  if (ano) where.ano = parseInt(ano, 10);
  if (mes) where.mes = parseInt(mes, 10);

  const [obrigacoes, total] = await Promise.all([
    prisma.obrigacao.findMany({
      where,
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.obrigacao.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const stats = {
    rascunho: obrigacoes.filter(o => ['RASCUNHO', 'VALIDANDO', 'PROCESSAMENTO'].includes(o.status)).length,
    inconsistencia: obrigacoes.filter(o => o.status === 'INCONSISTENCIA').length,
    entregue: obrigacoes.filter(o => o.status === 'ENTREGUE').length,
    erro: obrigacoes.filter(o => o.status === 'ERRO').length,
  };

  const buildUrl = (updates: Record<string, string | null>) => {
    const base = { ano, mes, page: String(page) };
    const merged = { ...base, ...updates };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== '' && v !== '1') params.set(k, v);
    });
    const str = params.toString();
    return `/dashboard/obrigacoes/dctfweb${str ? '?' + str : ''}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>DCTFWeb em Andamento</h1>
          <p className={styles.subtitle}>{total} declaração{total !== 1 ? 'ções' : ''} encontrad{total !== 1 ? 'as' : 'a'}</p>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={`${styles.statCard} ${styles.statWarning}`}>
          <div className={styles.statValue}>{stats.rascunho}</div>
          <div className={styles.statLabel}>Em Transmissão</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCritical}`}>
          <div className={styles.statValue}>{stats.inconsistencia}</div>
          <div className={styles.statLabel}>Com Inconsistência</div>
        </div>
        <div className={`${styles.statCard} ${styles.statSuccess}`}>
          <div className={styles.statValue}>{stats.entregue}</div>
          <div className={styles.statLabel}>Entregues (Total)</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCritical}`}>
          <div className={styles.statValue}>{stats.erro}</div>
          <div className={styles.statLabel}>Com Erro</div>
        </div>
      </div>

      <form method="GET" className={styles.filterBar}>
        <select name="ano" defaultValue={ano} className={styles.filterSelect}>
          {ANO_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select name="mes" defaultValue={mes} className={styles.filterSelect}>
          {MES_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="submit" className={styles.filterBtn}>Filtrar</button>
        {(ano || mes) && (
          <a href="/dashboard/obrigacoes/dctfweb" className={styles.clearBtn}>Limpar</a>
        )}
      </form>

      <DCTFWebClient
        obrigacoes={obrigacoes}
        page={page}
        totalPages={totalPages}
        buildUrl={buildUrl}
      />
    </div>
  );
}