import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';

// GET /api/clientes - List clientes for escritorio
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;

  const clientes = await prisma.clienteFinal.findMany({
    where: { escritorioId },
    select: {
      id: true,
      nomeRazao: true,
      documento: true,
      tipoPessoa: true,
    },
    orderBy: { nomeRazao: 'asc' },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;

  try {
    const formData = await req.formData();

    const tipoPessoa = formData.get('tipoPessoa') as string;
    const documento = formData.get('documento') as string;
    const nomeRazao = formData.get('nomeRazao') as string;
    const nomeFantasia = formData.get('nomeFantasia') as string || null;
    const estadoCivil = formData.get('estadoCivil') as string || null;
    const inscricaoEstadual = formData.get('inscricaoEstadual') as string || null;
    const regime = formData.get('regime') as string;
    const situacaoFiscal = formData.get('situacaoFiscal') as string || 'REGULAR';
    const logradouro = formData.get('logradouro') as string || null;
    const bairro = formData.get('bairro') as string || null;
    const cidade = formData.get('cidade') as string || null;
    const uf = formData.get('uf') as string || null;
    const cep = formData.get('cep') as string || null;
    const email = formData.get('email') as string || null;
    const telefone = formData.get('telefone') as string || null;
    const responsavelTecnico = formData.get('responsavelTecnico') as string || null;
    const dataAbertura = formData.get('dataAbertura') as string || null;
    const cnae = formData.get('cnae') as string || null;
    const inscricaoMunicipal = formData.get('inscricaoMunicipal') as string || null;
    const optanteSimples = formData.get('optanteSimples') === 'true';

    if (!documento || !nomeRazao || !tipoPessoa || !regime) {
      return NextResponse.json({ error: 'Campos obrigatórios missing' }, { status: 400 });
    }

    // Clean documento
    const cleanDocumento = documento.replace(/\D/g, '');

    // Check for existing cliente with same documento in this escritorio
    const existing = await prisma.clienteFinal.findFirst({
      where: { documento: cleanDocumento, escritorioId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Cliente já cadastrado com este documento' }, { status: 409 });
    }

    const cliente = await prisma.clienteFinal.create({
      data: {
        tipoPessoa: tipoPessoa as 'PJ' | 'PF',
        documento: cleanDocumento,
        nomeRazao: nomeRazao.toUpperCase(),
        nomeFantasia: nomeFantasia?.toUpperCase() || null,
        estadoCivil,
        inscricaoEstadual,
        regime: regime as 'SIMPLES_NACIONAL' | 'NORMAL',
        situacaoFiscal: situacaoFiscal as 'REGULAR' | 'REGULARIZADO' | 'IRREGULAR',
        logradouro: logradouro?.toUpperCase() || null,
        bairro: bairro?.toUpperCase() || null,
        cidade: cidade?.toUpperCase() || null,
        uf,
        cep: cep?.replace(/\D/g, '') || null,
        email: email?.toLowerCase() || null,
        telefone,
        responsavelTecnico,
        escritorioId,
        dataAbertura: dataAbertura ? new Date(dataAbertura) : null,
        cnae: cnae || null,
        inscricaoMunicipal,
        optanteSimples,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    console.error('Create cliente error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cliente já cadastrado com este documento' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}

// PUT /api/clientes?id=xxx - Update cliente
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
  }

  try {
    const formData = await req.formData();

    // Verify cliente belongs to escritorio
    const existing = await prisma.clienteFinal.findFirst({
      where: { id, escritorioId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const nomeRazao = formData.get('nomeRazao') as string;
    const nomeFantasia = formData.get('nomeFantasia') as string || null;
    const estadoCivil = formData.get('estadoCivil') as string || null;
    const inscricaoEstadual = formData.get('inscricaoEstadual') as string || null;
    const regime = formData.get('regime') as string;
    const situacaoFiscal = formData.get('situacaoFiscal') as string || 'REGULAR';
    const logradouro = formData.get('logradouro') as string || null;
    const bairro = formData.get('bairro') as string || null;
    const cidade = formData.get('cidade') as string || null;
    const uf = formData.get('uf') as string || null;
    const cep = formData.get('cep') as string || null;
    const email = formData.get('email') as string || null;
    const telefone = formData.get('telefone') as string || null;
    const responsavelTecnico = formData.get('responsavelTecnico') as string || null;
    const inscricaoMunicipal = formData.get('inscricaoMunicipal') as string || null;
    const dataAbertura = formData.get('dataAbertura') as string || null;
    const cnae = formData.get('cnae') as string || null;
    const optanteSimples = formData.get('optanteSimples') === 'true';

    if (!nomeRazao || !regime) {
      return NextResponse.json({ error: 'Campos obrigatórios missing' }, { status: 400 });
    }

    console.log('PUT updating cliente:', id, 'dataAbertura:', dataAbertura, 'cnae:', cnae);

    const cliente = await prisma.clienteFinal.update({
      where: { id },
      data: {
        nomeRazao: nomeRazao.toUpperCase(),
        nomeFantasia: nomeFantasia?.toUpperCase() || null,
        estadoCivil: estadoCivil || null,
        inscricaoEstadual: inscricaoEstadual || null,
        inscricaoMunicipal: inscricaoMunicipal || null,
        regime: regime as 'SIMPLES_NACIONAL' | 'NORMAL',
        situacaoFiscal: situacaoFiscal as 'REGULAR' | 'REGULARIZADO' | 'IRREGULAR',
        logradouro: logradouro?.toUpperCase() || null,
        bairro: bairro?.toUpperCase() || null,
        cidade: cidade?.toUpperCase() || null,
        uf,
        cep: cep?.replace(/\D/g, '') || null,
        email: email?.toLowerCase() || null,
        telefone,
        responsavelTecnico,
        dataAbertura: dataAbertura ? new Date(dataAbertura) : null,
        cnae: cnae || null,
        optanteSimples,
      },
    });

    console.log('Cliente atualizado:', JSON.stringify(cliente));

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Update cliente error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

// DELETE /api/clientes?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
  }

  try {
    // Verify cliente belongs to escritorio
    const cliente = await prisma.clienteFinal.findFirst({
      where: { id, escritorioId },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Delete cliente
    await prisma.clienteFinal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete cliente error:', error);
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 });
  }
}