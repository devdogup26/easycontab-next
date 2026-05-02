import { NextRequest, NextResponse } from 'next/server';

// CNPJ lookup via API Pública CNPJ (open source, no auth required)
const CNPJ_API_URL = 'https://publica.cnpj.ws/cnpj';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cnpj: string }> }) {
  try {
    const { cnpj } = await params;

    // Clean CNPJ - preserve alphanumeric characters
    const cleanCnpj = cnpj.replace(/[^A-Z0-9]/gi, '');

    if (cleanCnpj.length !== 14) {
      return NextResponse.json({ error: 'CNPJ inválido. Deve conter 14 caracteres.' }, { status: 400 });
    }

    // Check if alphanumeric
    const isAlphanumeric = /^[A-Z0-9]+$/.test(cleanCnpj) && /[A-Z]/i.test(cleanCnpj);

    // For alphanumeric CNPJs, we can't query the API (it only accepts numeric)
    // Return a message indicating the CNPJ was received but won't be looked up
    if (isAlphanumeric) {
      return NextResponse.json({
        tipoPessoa: 'PJ',
        documento: cleanCnpj,
        nomeRazao: '',
        nomeFantasia: null,
        inscricaoEstadual: null,
        situacaoFiscal: 'REGULAR',
        regime: 'SIMPLES_NACIONAL',
        logradouro: null,
        bairro: null,
        cidade: null,
        uf: null,
        cep: null,
        email: null,
        telefone: null,
        responsavelTecnico: null,
        message: 'CNPJ alfanumérico recebido. Consulta à Receita Federal não disponível para este formato.',
      });
    }

    // Query API Pública CNPJ (only works with numeric CNPJ)
    const response = await fetch(`${CNPJ_API_URL}/${cleanCnpj}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'CNPJ não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Erro ao consultar CNPJ' }, { status: 502 });
    }

    const data = await response.json();

    const estab = data.estabelecimento;

    const clientData = {
      tipoPessoa: 'PJ' as const,
      documento: cleanCnpj,
      nomeRazao: data.razao_social?.toUpperCase() || '',
      nomeFantasia: estab.nome_fantasia?.toUpperCase() || null,
      inscricaoEstadual: estab.inscricoes_estaduais?.[0]?.inscricao_estadual || null,
      situacaoFiscal: mapSituacao(estab.situacao_cadastral),
      regime: 'NORMAL' as const,
      logradouro: formatLogradouro(estab.tipo_logradouro, estab.logradouro, estab.numero, estab.complemento),
      bairro: estab.bairro?.toUpperCase() || null,
      cidade: estab.cidade?.nome?.toUpperCase() || null,
      uf: estab.estado?.sigla || null,
      cep: estab.cep?.replace(/\D/g, '') || null,
      email: estab.email || null,
      telefone: formatTelefone(estab.ddd1, estab.telefone1),
      responsavelTecnico: null,
    };

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('CNPJ lookup error:', error);
    return NextResponse.json({ error: 'Erro ao consultar CNPJ' }, { status: 500 });
  }
}

function mapSituacao(situacao: string): 'REGULAR' | 'REGULARIZADO' | 'IRREGULAR' {
  const upper = (situacao || '').toUpperCase();
  if (upper === 'ATIVA') return 'REGULAR';
  if (upper.includes('REGULARIZ')) return 'REGULARIZADO';
  return 'IRREGULAR';
}

function formatLogradouro(tipo: string, logradouro: string, numero: string, complemento: string): string {
  const parts = [];
  if (tipo) parts.push(tipo);
  if (logradouro) parts.push(logradouro);
  let address = parts.join(' ').toUpperCase();
  if (numero && numero !== 'SN') {
    address += `, ${numero}`;
  }
  if (complemento) {
    address += ` - ${complemento.toUpperCase()}`;
  }
  return address;
}

function formatTelefone(ddd: string | null, telefone: string | null): string | null {
  if (!ddd || !telefone) return null;
  const cleaned = `${ddd}${telefone}`.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
  return null;
}
