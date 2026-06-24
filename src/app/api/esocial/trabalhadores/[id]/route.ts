// eSocial Workers [id] API Route
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { trabalhistaSchema } from '@/lib/validations/esocial';
import { registrarAuditoria } from '@/lib/auditoria';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  const Trabalhador = await prisma.trabalhador.findFirst({
    where: { id, cliente: { escritorioId } },
    include: {
      cliente: { select: { id: true, nomeRazao: true, documento: true } },
      eventos: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!Trabalhador) {
    return NextResponse.json({ error: 'Trabalhador não encontrado' }, { status: 404 });
  }

  return NextResponse.json(Trabalhador);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    // Verify worker exists and belongs to escritorio
    const existing = await prisma.trabalhador.findFirst({
      where: { id, cliente: { escritorioId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Trabalhador não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = trabalhistaSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (parsed.data.nome) updateData.nome = parsed.data.nome.toUpperCase();
    if (parsed.data.dataNascimento) updateData.dataNascimento = new Date(parsed.data.dataNascimento);
    if (parsed.data.tipoRegime) updateData.tipoRegime = parsed.data.tipoRegime;
    if (parsed.data.ctps) updateData.ctps = parsed.data.ctps;
    if (parsed.data.serieCtps) updateData.serieCtps = parsed.data.serieCtps;
    if (parsed.data.ufCtps) updateData.ufCtps = parsed.data.ufCtps;
    if (parsed.data.pis !== undefined) updateData.pis = parsed.data.pis || null;
    if (parsed.data.cnh) updateData.cnh = parsed.data.cnh;
    if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase();
    if (parsed.data.telefone) updateData.telefone = parsed.data.telefone;
    if (parsed.data.rua) updateData.rua = parsed.data.rua.toUpperCase();
    if (parsed.data.numero) updateData.numero = parsed.data.numero;
    if (parsed.data.complemento) updateData.complemento = parsed.data.complemento.toUpperCase();
    if (parsed.data.bairro) updateData.bairro = parsed.data.bairro.toUpperCase();
    if (parsed.data.cidade) updateData.cidade = parsed.data.cidade.toUpperCase();
    if (parsed.data.uf) updateData.uf = parsed.data.uf;
    if (parsed.data.cep) updateData.cep = parsed.data.cep.replace(/\D/g, '');

    const Trabalhador = await prisma.trabalhador.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    registrarAuditoria({
      usuarioId: userId,
      usuarioNome: (session.user as any).nome || (session.user as any).email,
      escritorioId,
      acao: 'UPDATE',
      entidade: 'Trabalhador',
      entidadeId: id,
      dadosAntigos: existing,
      dadosNovos: Trabalhador,
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    }).catch(console.error);

    return NextResponse.json(Trabalhador);
  } catch (error: any) {
    console.error('Update Trabalhador error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar trabalhador' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const existing = await prisma.trabalhador.findFirst({
      where: { id, cliente: { escritorioId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Trabalhador não encontrado' }, { status: 404 });
    }

    // Check if worker has associated events
    const eventCount = await prisma.eventoEsocial.count({
      where: { trabalhadorId: id },
    });

    if (eventCount > 0) {
      return NextResponse.json(
        { error: `Trabalhador possui ${eventCount} evento(s) vinculado(s). Remova os eventos primeiro.` },
        { status: 400 }
      );
    }

    await prisma.trabalhador.delete({ where: { id } });

    // Audit log
    registrarAuditoria({
      usuarioId: userId,
      usuarioNome: (session.user as any).nome || (session.user as any).email,
      escritorioId,
      acao: 'DELETE',
      entidade: 'Trabalhador',
      entidadeId: id,
      dadosAntigos: existing,
      dadosNovos: null,
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Trabalhador error:', error);
    return NextResponse.json({ error: 'Erro ao excluir trabalhador' }, { status: 500 });
  }
}