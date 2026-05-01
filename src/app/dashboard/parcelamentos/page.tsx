import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { ParcelamentosClient } from './ParcelamentosClient';
import styles from './page.module.css';
import sharedStyles from '../_shared.module.css';

export const dynamic = 'force-dynamic';

export default async function ParcelamentosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const escritorioId = (session.user as any).escritorioId;

  const parcelamentos = await prisma.parcelamento.findMany({
    where: { cliente: { escritorioId } },
    include: {
      cliente: {
        select: {
          id: true,
          nomeRazao: true,
          documento: true,
        },
      },
    },
    orderBy: { inicio: 'desc' },
  });

  const stats = {
    PGFN: {
      total: parcelamentos.filter(p => p.tipo === 'PGFN').length,
      totalAtraso: parcelamentos
        .filter(p => p.tipo === 'PGFN')
        .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
      valorTotal: parcelamentos
        .filter(p => p.tipo === 'PGFN')
        .reduce((sum, p) => sum + Number(p.total), 0),
    },
    SIMPLES_NACIONAL: {
      total: parcelamentos.filter(p => p.tipo === 'SIMPLES_NACIONAL').length,
      totalAtraso: parcelamentos
        .filter(p => p.tipo === 'SIMPLES_NACIONAL')
        .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
      valorTotal: parcelamentos
        .filter(p => p.tipo === 'SIMPLES_NACIONAL')
        .reduce((sum, p) => sum + Number(p.total), 0),
    },
    SIMPLIFICADO: {
      total: parcelamentos.filter(p => p.tipo === 'SIMPLIFICADO').length,
      totalAtraso: parcelamentos
        .filter(p => p.tipo === 'SIMPLIFICADO')
        .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
      valorTotal: parcelamentos
        .filter(p => p.tipo === 'SIMPLIFICADO')
        .reduce((sum, p) => sum + Number(p.total), 0),
    },
    PREVIDENCIARIO: {
      total: parcelamentos.filter(p => p.tipo === 'PREVIDENCIARIO').length,
      totalAtraso: parcelamentos
        .filter(p => p.tipo === 'PREVIDENCIARIO')
        .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
      valorTotal: parcelamentos
        .filter(p => p.tipo === 'PREVIDENCIARIO')
        .reduce((sum, p) => sum + Number(p.total), 0),
    },
    NAO_PREVIDENCIARIO: {
      total: parcelamentos.filter(p => p.tipo === 'NAO_PREVIDENCIARIO').length,
      totalAtraso: parcelamentos
        .filter(p => p.tipo === 'NAO_PREVIDENCIARIO')
        .reduce((sum, p) => sum + p.parcelasEmAtraso, 0),
      valorTotal: parcelamentos
        .filter(p => p.tipo === 'NAO_PREVIDENCIARIO')
        .reduce((sum, p) => sum + Number(p.total), 0),
    },
  };

  const parcelamentosData = parcelamentos.map(p => ({
    id: p.id,
    clienteNome: p.cliente.nomeRazao,
    documento: p.cliente.documento,
    tipo: p.tipo,
    total: Number(p.total),
    parcelas: p.parcelas,
    parcelasEmAtraso: p.parcelasEmAtraso,
    valorAtraso: Number(p.valorAtraso),
    inicio: p.inicio.toLocaleDateString('pt-BR'),
  }));

  return (
    <div className={sharedStyles.page}>
      <div className={sharedStyles.header}>
        <div className={sharedStyles.headerContent}>
          <h1 className={sharedStyles.title}>Parcelamentos Federais</h1>
          <p className={sharedStyles.subtitle}>
            Monitoramento de débitos parcelados - Receita Federal e PGFN
          </p>
        </div>
      </div>

      <ParcelamentosClient parcelamentos={parcelamentosData} stats={stats} />
    </div>
  );
}
