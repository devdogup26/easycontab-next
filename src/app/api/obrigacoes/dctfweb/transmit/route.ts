import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';

// simulates async transmission flow: RASCUNHO -> VALIDANDO -> PROCESSANDO -> ENTREGUE
async function simulateTransmissionFlow(obrigacaoId: string) {
  // Step 1: VALIDANDO (after small delay)
  await new Promise(resolve => setTimeout(resolve, 800));
  await prisma.obrigacao.update({
    where: { id: obrigacaoId },
    data: { status: 'VALIDANDO' },
  });

  // Step 2: PROCESSANDO
  await new Promise(resolve => setTimeout(resolve, 2500));
  await prisma.obrigacao.update({
    where: { id: obrigacaoId },
    data: { status: 'PROCESSANDO' },
  });

  // Step 3: ENTREGUE with protocolo
  await new Promise(resolve => setTimeout(resolve, 3500));
  const now = new Date();
  const protocolo = [
    now.getFullYear().toString(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
    Math.random().toString(36).substring(2, 8).toUpperCase(),
  ].join('');

  const reciboData = JSON.stringify({
    protocolo,
    dataRecebimento: now.toISOString(),
    numeroRecibo: protocolo,
  });

  await prisma.obrigacao.update({
    where: { id: obrigacaoId },
    data: { status: 'ENTREGUE', reciboUrl: reciboData },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const userId = (session.user as any).id;
  const userName = (session.user as any).nome || 'Usuario';

  try {
    const formData = await request.formData();
    const clienteId = formData.get('clienteId') as string;
    const ano = parseInt(formData.get('ano') as string);
    const mes = parseInt(formData.get('mes') as string);

    // Verify client belongs to escritorio
    const cliente = await prisma.clienteFinal.findFirst({
      where: { id: clienteId, escritorioId },
    });
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Create or update obrigacao with RASCUNHO status (initial state before transmission)
    const existingObrigacao = await prisma.obrigacao.findFirst({
      where: { clienteId, tipo: 'DCTFWEB', ano, mes },
    });

    let obrigacao;
    if (existingObrigacao) {
      obrigacao = await prisma.obrigacao.update({
        where: { id: existingObrigacao.id },
        data: { status: 'RASCUNHO' },
      });
    } else {
      obrigacao = await prisma.obrigacao.create({
        data: {
          clienteId,
          tipo: 'DCTFWEB',
          ano,
          mes,
          status: 'RASCUNHO',
        },
      });
    }

    // Record audit trail
    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        usuarioNome: userName,
        escritorioId,
        acao: 'CREATE',
        entidade: 'Obrigacao',
        entidadeId: obrigacao.id,
        dadosNovos: { ...obrigacao, action: 'DCTFWEB_TRANSMISSION_STARTED' },
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Trigger async simulation (fire and forget)
    setTimeout(() => {
      simulateTransmissionFlow(obrigacao.id).catch(err => {
        console.error('DCTFWeb simulation failed:', err);
        prisma.obrigacao.update({
          where: { id: obrigacao.id },
          data: { status: 'ERRO' },
        }).catch(e => console.error('Failed to set ERRO status:', e));
      });
    }, 100);

    return NextResponse.json({ success: true, obrigacaoId: obrigacao.id, status: 'RASCUNHO' });
  } catch (error) {
    console.error('DCTFWeb transmission error:', error);
    return NextResponse.json({ error: 'Erro ao transmitir DCTFWeb' }, { status: 500 });
  }
}
