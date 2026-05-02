import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';

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