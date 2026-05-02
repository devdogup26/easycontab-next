import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { DashboardCards } from './DashboardCards';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const perfil = (session.user as any).perfil;

  // Admin (isAdmin=true) goes to admin dashboard
  if (perfil?.isAdmin) {
    redirect('/dashboard/admin');
  }

  const escritorioId = (session.user as any).escritorioId;

  // ============================================
  // Dashboard - Client Base Stats
  // ============================================
  const [totalClientes, clientesSimplesNacional, clientesNormal] = await Promise.all([
    prisma.clienteFinal.count({ where: { escritorioId } }),
    prisma.clienteFinal.count({ where: { escritorioId, regime: 'SIMPLES_NACIONAL' } }),
    prisma.clienteFinal.count({ where: { escritorioId, regime: 'NORMAL' } }),
  ]);

  const [regularCount, regularizadoCount, irregularCount] = await Promise.all([
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'REGULAR' } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'REGULARIZADO' } }),
    prisma.clienteFinal.count({ where: { escritorioId, situacaoFiscal: 'IRREGULAR' } }),
  ]);

  // ============================================
  // DCTFWeb Stats
  // ============================================
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const dctfwebObligacoes = await prisma.obrigacao.findMany({
    where: {
      cliente: { escritorioId },
      tipo: 'DCTFWEB',
      ano: currentYear,
      mes: { gte: 1, lte: currentMonth },
    },
    select: { status: true },
  });

  const dctfwebStats = {
    total: dctfwebObligacoes.length,
    entregue: dctfwebObligacoes.filter(o => o.status === 'ENTREGUE').length,
    naoEntregue: dctfwebObligacoes.filter(o => o.status === 'NAO_ENTREGUE').length,
    inconsistencia: dctfwebObligacoes.filter(o => o.status === 'INCONSISTENCIA').length,
    emProcessamento: dctfwebObligacoes.filter(o => o.status === 'EM_PROCESSAMENTO').length,
    outros: dctfwebObligacoes.filter(o => o.status === 'OUTROS').length,
  };

  // ============================================
  // Parcelamentos Stats
  // ============================================
  const parcelamentos = await prisma.parcelamento.findMany({
    where: { cliente: { escritorioId } },
    select: { tipo: true, parcelasEmAtraso: true },
  });

  const parcelamentoAlert = {
    pgfnTotal: parcelamentos.filter(p => p.tipo === 'PGFN').length,
    pgfnAtraso: parcelamentos
      .filter(p => p.tipo === 'PGFN' && p.parcelasEmAtraso > 0)
      .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
    simplesTotal: parcelamentos.filter(p => p.tipo === 'SIMPLES_NACIONAL').length,
    simplesAtraso: parcelamentos
      .filter(p => p.tipo === 'SIMPLES_NACIONAL' && p.parcelasEmAtraso > 0)
      .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
    simplificadoTotal: parcelamentos.filter(p => p.tipo === 'SIMPLIFICADO').length,
    simplificadoAtraso: parcelamentos
      .filter(p => p.tipo === 'SIMPLIFICADO' && p.parcelasEmAtraso > 0)
      .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
    naoPrevTotal: parcelamentos.filter(p => p.tipo === 'NAO_PREVIDENCIARIO').length,
    naoPrevAtraso: parcelamentos
      .filter(p => p.tipo === 'NAO_PREVIDENCIARIO' && p.parcelasEmAtraso > 0)
      .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
    prevTotal: parcelamentos.filter(p => p.tipo === 'PREVIDENCIARIO').length,
    prevAtraso: parcelamentos
      .filter(p => p.tipo === 'PREVIDENCIARIO' && p.parcelasEmAtraso > 0)
      .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
  };

  // ============================================
  // e-CAC Alert (relevant unread messages)
  // ============================================
  const relevantUnreadMessages = await prisma.mensagem.findMany({
    where: {
      cliente: { escritorioId },
      relevancia: 'RELEVANTE',
      lida: false,
    },
    include: { cliente: { select: { nomeRazao: true } } },
    orderBy: { data: 'desc' },
    take: 10,
  });

  const ecacAlert = {
    count: relevantUnreadMessages.length,
    messages: relevantUnreadMessages.map(m => ({
      id: m.id,
      titulo: m.titulo,
      clienteNome: m.cliente.nomeRazao,
      tipo: m.tipo,
      data: m.data.toLocaleDateString('pt-BR'),
    })),
  };

  // ============================================
  // Prepare Dashboard Data
  // ============================================
  const dashboardData = {
    stats: {
      totalClientes,
      simplesNacionalCount: clientesSimplesNacional,
      normalCount: clientesNormal,
      regularCount,
      regularizadoCount,
      irregularCount,
    },
    dctfweb: dctfwebStats,
    ecacAlert,
    parcelamentoAlert,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Painel de Gestão de Clientes e Obrigações</p>
        </div>
        <div className={styles.contadorBadge}>{(session.user as any).escritorioNome}</div>
      </header>

      <DashboardCards data={dashboardData} />
    </div>
  );
}
