import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clientes/[id] - Get single cliente
export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  const cliente = await prisma.clienteFinal.findFirst({
    where: { id, escritorioId },
  });

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

// PUT /api/clientes/[id] - Update cliente
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  // Verify cliente belongs to escritorio
  const existingCliente = await prisma.clienteFinal.findFirst({
    where: { id, escritorioId },
  });

  if (!existingCliente) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
  }

  try {
    const formData = await req.formData();

    const data: any = {};

    const fields = [
      'tipoPessoa', 'nomeRazao', 'nomeFantasia', 'estadoCivil',
      'inscricaoEstadual', 'inscricaoMunicipal', 'regime', 'situacaoFiscal',
      'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
      'cep', 'email', 'telefone', 'responsavelTecnico', 'dataAbertura', 'cnae'
    ];

    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        data[field] = value;
      }
    }

    // Handle optanteSimples as boolean
    const optanteSimples = formData.get('optanteSimples');
    if (optanteSimples !== null && optanteSimples !== undefined) {
      data.optanteSimples = optanteSimples === 'true';
    }

    // Uppercase string fields
    if (data.nomeRazao) data.nomeRazao = data.nomeRazao.toUpperCase();
    if (data.nomeFantasia) data.nomeFantasia = data.nomeFantasia.toUpperCase();
    if (data.logradouro) data.logradouro = data.logradouro.toUpperCase();
    if (data.bairro) data.bairro = data.bairro.toUpperCase();
    if (data.cidade) data.cidade = data.cidade.toUpperCase();
    if (data.email) data.email = data.email.toLowerCase();
    if (data.cep) data.cep = data.cep.replace(/\D/g, '');
    if (data.inscricaoMunicipal) data.inscricaoMunicipal = data.inscricaoMunicipal.replace(/\D/g, '');

    const cliente = await prisma.clienteFinal.update({
      where: { id },
      data,
    });

    // Create auditoria record
    await prisma.auditoria.create({
      data: {
        usuarioId: (session.user as any).id,
        usuarioNome: (session.user as any).nome || 'Usuário',
        escritorioId,
        acao: 'UPDATE',
        entidade: 'ClienteFinal',
        entidadeId: id,
        dadosAntigos: existingCliente,
        dadosNovos: cliente,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Update cliente error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}