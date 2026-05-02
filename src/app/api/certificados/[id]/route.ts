import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { updateCertificadoSchema } from '@/lib/validations/certificado';
import { registrarAuditoria } from '@/lib/auditoria';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  const certificado = await prisma.certificado.findFirst({
    where: { id, cliente: { escritorioId } },
    include: { cliente: { select: { id: true, nomeRazao: true, documento: true } } },
  });

  if (!certificado) {
    return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });
  }

  return NextResponse.json(certificado);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateCertificadoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify certificado belongs to escritorio
    const existing = await prisma.certificado.findFirst({
      where: { id, cliente: { escritorioId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });
    }

    const updated = await prisma.certificado.update({
      where: { id },
      data: {
        ...(parsed.data.tipo !== undefined && { tipo: parsed.data.tipo }),
        ...(parsed.data.cnpj !== undefined && { cnpj: parsed.data.cnpj }),
        ...(parsed.data.validade !== undefined && { validade: parsed.data.validade }),
        ...(parsed.data.responsavel !== undefined && { responsavel: parsed.data.responsavel }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      },
    });

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId: user.escritorioId,
      acao: 'UPDATE',
      entidade: 'Certificado',
      entidadeId: id,
      dadosAntigos: existing,
      dadosNovos: updated,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar certificado' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const escritorioId = (session.user as any).escritorioId;
  const { id } = await params;

  try {
    // Verify certificado belongs to escritorio
    const existing = await prisma.certificado.findFirst({
      where: { id, cliente: { escritorioId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });
    }

    await prisma.certificado.delete({ where: { id } });

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId: user.escritorioId,
      acao: 'DELETE',
      entidade: 'Certificado',
      entidadeId: id,
      dadosAntigos: existing,
      dadosNovos: null,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao excluir certificado' }, { status: 500 });
  }
}
