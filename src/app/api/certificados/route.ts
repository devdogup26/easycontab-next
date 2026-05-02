import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { createCertificadoSchema } from '@/lib/validations/certificado';
import { registrarAuditoria } from '@/lib/auditoria';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const escritorioId = (session.user as any).escritorioId;
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get('clienteId');

  const where: any = {
    cliente: { escritorioId },
  };

  if (clienteId) {
    where.clienteId = clienteId;
  }

  const certificados = await prisma.certificado.findMany({
    where,
    include: {
      cliente: { select: { id: true, nomeRazao: true, documento: true } },
    },
    orderBy: { validade: 'asc' },
  });

  return NextResponse.json(certificados);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const escritorioId = (session.user as any).escritorioId;

  try {
    const body = await req.json();
    const parsed = createCertificadoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { clienteId, tipo, cnpj, validade, responsavel } = parsed.data;

    // Verify cliente belongs to escritorio
    const cliente = await prisma.clienteFinal.findFirst({
      where: { id: clienteId, escritorioId },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const certificado = await prisma.certificado.create({
      data: {
        clienteId,
        tipo,
        cnpj: cnpj || null,
        validade,
        responsavel: responsavel || null,
        status: 'VALIDO',
      },
    });

    const user = session.user as any;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    registrarAuditoria({
      usuarioId: user.id,
      usuarioNome: user.nome || user.email,
      escritorioId: user.escritorioId,
      acao: 'CREATE',
      entidade: 'Certificado',
      entidadeId: certificado.id,
      dadosAntigos: null,
      dadosNovos: certificado,
      ipAddress,
      userAgent: req.headers.get('user-agent'),
    }).catch((err) => console.error('[AUDITORIA]', err));

    return NextResponse.json(certificado, { status: 201 });
  } catch (error: any) {
    console.error('Create certificado error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Certificado já cadastrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro ao criar certificado' }, { status: 500 });
  }
}
