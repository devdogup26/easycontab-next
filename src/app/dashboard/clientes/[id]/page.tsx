import { prisma } from '@/lib/server/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClienteEditForm from './ClienteEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDocumento(documento: string): string {
  if (documento.length === 14) {
    return `${documento.slice(0, 2)}.${documento.slice(2, 5)}.${documento.slice(5, 8)}/${documento.slice(8, 12)}-${documento.slice(12)}`;
  }
  if (documento.length === 11) {
    return `${documento.slice(0, 3)}.${documento.slice(3, 6)}.${documento.slice(6, 9)}-${documento.slice(9)}`;
  }
  return documento;
}

function formatCEP(cep: string): string {
  if (cep.length !== 8) return cep;
  return `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;
}

function getSituacaoBadge(situacao: string): { class: string; label: string } {
  const badges: Record<string, { class: string; label: string }> = {
    REGULAR: { class: 'status-success', label: 'Regular' },
    REGULARIZADO: { class: 'status-warning', label: 'Regularizado' },
    IRREGULAR: { class: 'status-critical', label: 'Irregular' },
  };
  return badges[situacao] || { class: '', label: situacao };
}

export default async function EditClientePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { id } = await params;
  const escritorioId = (session.user as any).escritorioId;

  const cliente = await prisma.clienteFinal.findFirst({
    where: { id, escritorioId },
    include: {
      _count: {
        select: {
          obrigacoes: true,
          parcelamentos: true,
          mensagens: true,
        },
      },
    },
  });

  if (!cliente) {
    redirect('/dashboard/clientes');
  }

  const clienteSituacao = getSituacaoBadge(cliente.situacaoFiscal);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/clientes"
            aria-label="Voltar para clientes"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">{cliente.nomeRazao}</h1>
            <p className="text-slate-400">{formatDocumento(cliente.documento)}</p>
          </div>
          <span className={`badge ${clienteSituacao.class}`}>{clienteSituacao.label}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Dados Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Cadastrais */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-semantic-info"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Dados Cadastrais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide block">
                  Razão Social
                </span>
                <p className="text-slate-800 mt-1">{cliente.nomeRazao}</p>
              </div>

              {cliente.nomeFantasia && (
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide block">
                    Nome Fantasia
                  </span>
                  <p className="text-slate-800 mt-1">{cliente.nomeFantasia}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide block">
                  Regime Tributário
                </span>
                <p className="text-slate-800 mt-1">
                  {cliente.regime === 'SIMPLES_NACIONAL' ? 'Simples Nacional' : 'Normal'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide block">
                  {cliente.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                </span>
                <p className="text-slate-800 mt-1 font-mono">
                  {formatDocumento(cliente.documento)}
                </p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          {cliente.logradouro || cliente.cidade || cliente.uf ? (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-semantic-info"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Endereço
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cliente.logradouro && (
                  <div className="md:col-span-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wide block">
                      Logradouro
                    </span>
                    <p className="text-slate-800 mt-1">{cliente.logradouro}</p>
                  </div>
                )}

                {cliente.cidade && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide block">
                      Cidade
                    </span>
                    <p className="text-slate-800 mt-1">
                      {cliente.cidade}
                      {cliente.uf ? ` - ${cliente.uf}` : ''}
                    </p>
                  </div>
                )}

                {cliente.cep && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide block">
                      CEP
                    </span>
                    <p className="text-slate-800 mt-1">{formatCEP(cliente.cep)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Contato */}
          {cliente.email || cliente.telefone || cliente.responsavelTecnico ? (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-semantic-info"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contato
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cliente.email && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide block">
                      E-mail
                    </span>
                    <p className="text-slate-800 mt-1">{cliente.email}</p>
                  </div>
                )}

                {cliente.telefone && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide block">
                      Telefone
                    </span>
                    <p className="text-slate-800 mt-1">{cliente.telefone}</p>
                  </div>
                )}

                {cliente.responsavelTecnico && (
                  <div className="md:col-span-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wide block">
                      Responsável Técnico
                    </span>
                    <p className="text-slate-800 mt-1">{cliente.responsavelTecnico}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column - Resumo */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Resumo</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-400">Obrigações</span>
                <span className="text-slate-800 font-medium">
                  {cliente._count?.obrigacoes || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-400">Parcelamentos</span>
                <span className="text-slate-800 font-medium">
                  {cliente._count?.parcelamentos || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-400">Mensagens</span>
                <span className="text-slate-800 font-medium">{cliente._count?.mensagens || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Cadastro</span>
                <span className="text-slate-800 font-medium text-sm">
                  {cliente.createdAt.toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Ações Rápidas</h2>

            <div className="space-y-2">
              <a
                href={`/dashboard/clientes/${cliente.id}/situacao-fiscal`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100/50 transition-colors text-slate-600 hover:text-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Situação Fiscal
              </a>
              <a
                href={`/dashboard/obrigacoes?cliente=${cliente.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100/50 transition-colors text-slate-600 hover:text-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Ver Obrigações
              </a>
              <a
                href={`/dashboard/parcelamentos?cliente=${cliente.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100/50 transition-colors text-slate-600 hover:text-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Ver Parcelamentos
              </a>
              <a
                href={`/dashboard/caixa-postal?cliente=${cliente.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100/50 transition-colors text-slate-600 hover:text-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Caixa Postal e-CAC
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      <div className="card p-6 mt-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar Cliente
        </h2>
        <ClienteEditForm cliente={cliente} />
      </div>
    </div>
  );
}
