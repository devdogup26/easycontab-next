// eSocial Workers API Route
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { trabalhadorSchema } from '@/lib/validations/esocial';
import { registrarAuditoria } from '@/lib/auditoria';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get('clienteId');

  const where: any = {
    cliente: { escritorioId },
  };

  if (clienteId) {
    where.clienteId = clienteId;
  }

  const trabalhadores = await prisma.trabalhador.findMany({
    where,
    include: {
      cliente: { select: { id: true, nomeRazao: true, documento: true } },
    },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(trabalhadores);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const parsed = trabalhadorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { clienteId, cpf, nome, dataNascimento, tipoRegime, ...endereco } = parsed.data;

    // Verify client belongs to escritorio
    const cliente = await prisma.clienteFinal.findFirst({
      where: { id: clienteId, escritorioId },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Check for existing worker with same CPF
    const existing = await prisma.trabalhador.findFirst({
      where: { cpf },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Trabalhador já cadastrado com este CPF' },
        { status: 409 }
      );
    }

    const Trabalhador = await prisma.trabalhador.create({
      data: {
        clienteId,
        cpf,
        nome: nome.toUpperCase(),
        dataNascimento: new Date(dataNascimento),
        tipoRegime,
        pis: endereco.pis || null,
        ctps: endereco.ctps || null,
        serieCtps: endereco.serieCtps || null,
        ufCtps: endereco.ufCtps || null,
        cnh: endereco.cnh || null,
        email: endereco.email?.toLowerCase() || null,
        telefone: endereco.telefone || null,
        rua: endereco.rua?.toUpperCase() || null,
        numero: endereco.numero || null,
        complemento: endereco.complemento?.toUpperCase() || null,
        bairro: endereco.bairro?.toUpperCase() || null,
        cidade: endereco.cidade?.toUpperCase() || null,
        uf: endereco.uf || null,
        cep: endereco.cep?.replace(/\D/g, '') || null,
      },
    });

    // Audit log
    registrarAuditoria({
      usuarioId: userId,
      usuarioNome: (session.user as any).nome || (session.user as any).email,
      escritorioId,
      acao: 'CREATE',
      entidade: 'Trabalhador',
      entidadeId: Trabalhador.id,
      dadosAntigos: null,
      dadosNovos: Trabalhador,
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    }).catch(console.error);

    return NextResponse.json(Trabalhador, { status: 201 });
  } catch (error: any) {
    console.error('Create Trabalhador error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Trabalhador já cadastrado com este CPF' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Erro ao criar trabalhador' }, { status: 500 });
  }
}