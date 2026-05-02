import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { CertidoesClient } from './CertidoesClient';
import sharedStyles from '../_shared.module.css';

export const dynamic = 'force-dynamic';

interface CertidaoData {
  id: string;
  clienteId: string;
  clienteNome: string;
  documento: string;
  tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'CND';
  nome: string;
  validade: string | null;
  status: 'valido' | 'vencendo' | 'vencido';
  diasParaVencer: number | null;
  linkConsulta?: string;
}

interface CategoryData {
  tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'CND';
  titulo: string;
  certidoes: CertidaoData[];
  stats: { total: number; validas: number; vencendo: number; vencidas: number };
}

export default async function CertidoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const escritorioId = (session.user as any).escritorioId;

  // Fetch clientes with their certificados and procuracoes
  const clientes = await prisma.clienteFinal.findMany({
    where: { escritorioId },
    select: {
      id: true,
      nomeRazao: true,
      documento: true,
      inscricaoEstadual: true,
      uf: true,
      certificados: {
        select: {
          id: true,
          tipo: true,
          validade: true,
          status: true,
        },
      },
      procuracoes: {
        select: {
          id: true,
          tipo: true,
          validade: true,
          status: true,
        },
      },
    },
  });

  const hoje = new Date();

  // Helper to determine status based on expiry
  const getCertStatus = (dataValidade: Date | null, currentStatus: string): { status: 'valido' | 'vencendo' | 'vencido'; dias: number | null } => {
    if (!dataValidade) return { status: 'valido', dias: null };

    const diasParaVencer = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasParaVencer < 0) return { status: 'vencido', dias: diasParaVencer };
    if (diasParaVencer <= 30) return { status: 'vencendo', dias: diasParaVencer };
    return { status: 'valido', dias: diasParaVencer };
  };

  // Process certificates into certidões data
  const certidoesData: CertidaoData[] = [];

  clientes.forEach(cliente => {
    // Process Certificados Digitais (Federal)
    cliente.certificados.forEach(cert => {
      const dataValidade = new Date(cert.validade);
      const { status, dias } = getCertStatus(dataValidade, cert.status);

      certidoesData.push({
        id: cert.id,
        clienteId: cliente.id,
        clienteNome: cliente.nomeRazao,
        documento: cliente.documento,
        tipo: 'FEDERAL',
        nome: `Certificado Digital ${cert.tipo}`,
        validade: dataValidade.toLocaleDateString('pt-BR'),
        status,
        diasParaVencer: dias,
      });
    });

    // Process Procurações (Federal - e-CAC)
    cliente.procuracoes.forEach(proc => {
      const dataValidade = new Date(proc.validade);
      const { status, dias } = getCertStatus(dataValidade, proc.status);

      certidoesData.push({
        id: proc.id,
        clienteId: cliente.id,
        clienteNome: cliente.nomeRazao,
        documento: cliente.documento,
        tipo: 'FEDERAL',
        nome: `Procuração e-CAC (${proc.tipo})`,
        validade: dataValidade.toLocaleDateString('pt-BR'),
        status,
        diasParaVencer: dias,
      });
    });

    // Inscrição Estadual (Estadual) - derived from cliente data
    if (cliente.inscricaoEstadual) {
      // IE is stored but we don't track expiry, so show as valid with no expiry date
      certidoesData.push({
        id: `ie-${cliente.id}`,
        clienteId: cliente.id,
        clienteNome: cliente.nomeRazao,
        documento: cliente.documento,
        tipo: 'ESTADUAL',
        nome: `Inscrição Estadual: ${cliente.inscricaoEstadual}`,
        validade: null,
        status: 'valido',
        diasParaVencer: null,
        linkConsulta: `https://www.sefaz${cliente.uf?.toLowerCase() || 'sp'}.gov.br/consulta-cnpj/`,
      });
    }

    // Placeholder for Municipal (ISS) - would need separate model in future
    if (cliente.cidade && cliente.uf) {
      certidoesData.push({
        id: `iss-${cliente.id}`,
        clienteId: cliente.id,
        clienteNome: cliente.nomeRazao,
        documento: cliente.documento,
        tipo: 'MUNICIPAL',
        nome: `ISS - ${cliente.cidade}/${cliente.uf}`,
        validade: null,
        status: 'valido',
        diasParaVencer: null,
      });
    }

    // CND placeholder - these are typically fetched on-demand
    certidoesData.push({
      id: `cnd-${cliente.id}`,
      clienteId: cliente.id,
      clienteNome: cliente.nomeRazao,
      documento: cliente.documento,
      tipo: 'CND',
      nome: 'Certidão Negativa de Débitos',
      validade: null,
      status: 'valido',
      diasParaVencer: null,
    });
  });

  // Group by tipo
  const groupByTipo = (
    items: CertidaoData[]
  ): Record<'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'CND', CertidaoData[]> => {
    return items.reduce(
      (acc, item) => {
        acc[item.tipo].push(item);
        return acc;
      },
      { FEDERAL: [], ESTADUAL: [], MUNICIPAL: [], CND: [] } as Record<
        'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'CND',
        CertidaoData[]
      >
    );
  };

  const grouped = groupByTipo(certidoesData);

  // Calculate category stats and build category cards
  const TIPO_CONFIG = {
    FEDERAL: { titulo: 'Certidões Federais' },
    ESTADUAL: { titulo: 'Inscrição Estadual' },
    MUNICIPAL: { titulo: 'ISS / Certidões Municipais' },
    CND: { titulo: 'CND - Certidão Negativa de Débitos' },
  };

  const categoryData: CategoryData[] = (
    ['FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'CND'] as const
  ).map(tipo => {
    const items = grouped[tipo];
    const stats = {
      total: items.length,
      validas: items.filter(i => i.status === 'valido').length,
      vencendo: items.filter(i => i.status === 'vencendo').length,
      vencidas: items.filter(i => i.status === 'vencido').length,
    };

    return {
      tipo,
      titulo: TIPO_CONFIG[tipo].titulo,
      certidoes: items,
      stats,
    };
  });

  // Overall stats
  const overallStats = categoryData.reduce(
    (acc, cat) => ({
      total: acc.total + cat.stats.total,
      validas: acc.validas + cat.stats.validas,
      vencendo: acc.vencendo + cat.stats.vencendo,
      vencidas: acc.vencidas + cat.stats.vencidas,
    }),
    { total: 0, validas: 0, vencendo: 0, vencidas: 0 }
  );

  const tudoOk =
    overallStats.total > 0 &&
    overallStats.vencidas === 0 &&
    overallStats.vencendo === 0;

  return (
    <div className={sharedStyles.page}>
      <div className={sharedStyles.header}>
        <div className={sharedStyles.headerContent}>
          <h1 className={sharedStyles.title}>Certidões</h1>
          <p className={sharedStyles.subtitle}>
            Visão consolidada das certidões e regularidade fiscal dos clientes
          </p>
        </div>
      </div>

      <CertidoesClient
        categoryData={categoryData}
        overallStats={overallStats}
        tudoOk={tudoOk}
      />
    </div>
  );
}