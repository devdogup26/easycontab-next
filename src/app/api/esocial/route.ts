// eSocial Events API Route
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { s1200Schema, s1210Schema, s1250Schema } from '@/lib/validations/esocial';
import { generateEventoXml, generateProtocolo } from '@/lib/esocial/event-generator';
import { registrarAuditoria } from '@/lib/auditoria';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { searchParams } = new URL(req.url);

  const clienteId = searchParams.get('clienteId');
  const tipo = searchParams.get('tipo');
  const status = searchParams.get('status');
  const ano = searchParams.get('ano');
  const mes = searchParams.get('mes');

  const where: any = {
    escritorioId,
  };

  if (clienteId) where.clienteId = clienteId;
  if (tipo) where.tipo = tipo;
  if (status) where.status = status;
  if (ano) where.ano = parseInt(ano);
  if (mes) where.mes = parseInt(mes);

  const eventos = await prisma.eventoEsocial.findMany({
    where,
    include: {
      cliente: { select: { id: true, nomeRazao: true, documento: true } },
      Trabalhador: { select: { id: true, cpf: true, nome: true } },
    },
    orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(eventos);
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
    const { tipo, clienteId, TrabalhadorId, ano, mes, dados } = body;

    // Verify client belongs to escritorio
    const cliente = await prisma.clienteFinal.findFirst({
      where: { id: clienteId, escritorioId },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Validate based on event type
    let parsedData;
    switch (tipo) {
      case 'S_1200':
        parsedData = s1200Schema.safeParse(body);
        break;
      case 'S_1210':
        parsedData = s1210Schema.safeParse(body);
        break;
      case 'S_1250':
        parsedData = s1250Schema.safeParse(body);
        break;
      default:
        return NextResponse.json(
          { error: `Tipo de evento ${tipo} não suportado ainda` },
          { status: 400 }
        );
    }

    if (!parsedData.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsedData.error.flatten() },
        { status: 400 }
      );
    }

    // Get Trabalhador if provided
    let Trabalhador = null;
    if (TrabalhadorId) {
      Trabalhador = await prisma.trabalhador.findFirst({
        where: { id: TrabalhadorId, clienteId },
      });
      if (!Trabalhador) {
        return NextResponse.json(
          { error: 'Trabalhador não encontrado para este cliente' },
          { status: 404 }
        );
      }
    }

    // Generate XML
    const protocolo = generateProtocolo();

    const ctx = {
      cliente: {
        documento: cliente.documento,
        nomeRazao: cliente.nomeRazao,
      },
      ambiente: '2' as const,  // Default to homologação
      versaoProcesso: 'EasyContab v1.0',
    };

    let xmlOriginal: string;
    try {
      xmlOriginal = generateEventoXml(tipo, ctx, dados, protocolo);
    } catch (error: any) {
      return NextResponse.json(
        { error: `Erro ao gerar XML: ${error.message}` },
        { status: 400 }
      );
    }

    // Create event record
    const evento = await prisma.eventoEsocial.create({
      data: {
        clienteId,
        TrabalhadorId: TrabalhadorId || null,
        tipo,
        ano,
        mes,
        status: 'RASCUNHO',
        xmlOriginal,
        escritorioId,
        versao: 'S-1.2',
      },
    });

    // Audit log
    registrarAuditoria({
      usuarioId: userId,
      usuarioNome: (session.user as any).nome || (session.user as any).email,
      escritorioId,
      acao: 'CREATE',
      entidade: 'EventoEsocial',
      entidadeId: evento.id,
      dadosAntigos: null,
      dadosNovos: evento,
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    }).catch(console.error);

    return NextResponse.json(evento, { status: 201 });
  } catch (error: any) {
    console.error('Create EventoEsocial error:', error);
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
  }
}