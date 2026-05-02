'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export interface DCTFWebSimulation {
  status: 'rascunho' | 'validando' | 'processando' | 'entregue' | 'erro';
  protocolo: string | null;
  dataEnvio: Date | null;
  reciboXml: string | null;
  erro?: string;
}

/**
 * Simulates the full DCTFWeb transmission flow:
 * RASCUNHO -> VALIDANDO -> PROCESSANDO -> ENTREGUE
 *
 * This is a realistic mock that shows progress through states
 * with appropriate delays to simulate real async processing.
 */
export async function simulateDCTFWebTransmission(obrigacaoId: string): Promise<DCTFWebSimulation> {
  // Step 1: RASCUNHO (initial state - already set before calling simulation)
  // Small delay before starting validation
  await new Promise(resolve => setTimeout(resolve, 800));

  // Step 2: VALIDANDO - Simulate provider validation (2-3 seconds)
  await prisma.obrigacao.update({
    where: { id: obrigacaoId },
    data: { status: 'VALIDANDO' },
  });
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Step 3: PROCESSANDO - Simulate Receita Federal processing (3-5 seconds)
  await prisma.obrigacao.update({
    where: { id: obrigacaoId },
    data: { status: 'PROCESSANDO' },
  });
  await new Promise(resolve => setTimeout(resolve, 3500));

  // Step 4: ENTREGUE - Generate protocol and receipt
  // Generate realistic protocolo number (format: YYYYMMDDHHMMSS + 6 random chars)
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

  // Generate mock receipt XML (simplified structure)
  const reciboXml = `<?xml version="1.0" encoding="UTF-8"?>
<ReciboDCTFWeb xmlns="http://www.receita.fazenda.gov.br/dctfweb">
  <protocolo>${protocolo}</protocolo>
  <dataRecebimento>${now.toISOString()}</dataRecebimento>
  <numeroRecibo>${protocolo}</numeroRecibo>
  <versao>1.0</versao>
</ReciboDCTFWeb>`;

  // Store receipt in database (as JSON string for simplicity)
  const reciboData = JSON.stringify({
    protocolo,
    dataRecebimento: now.toISOString(),
    numeroRecibo: protocolo,
    xml: reciboXml,
  });

  await prisma.obrigacao.update({
    where: { id: obrigacaoId },
    data: {
      status: 'ENTREGUE',
      reciboUrl: reciboData,
    },
  });

  return {
    status: 'entregue',
    protocolo,
    dataEnvio: now,
    reciboXml,
  };
}

/**
 * Starts the async transmission process.
 * This creates the obrigacao in RASCUNHO state and returns immediately,
 * allowing the UI to show progress while the background simulation runs.
 *
 * In a real implementation, this would enqueue a job to a queue system
 * (e.g., Bull, AWS SQS, or similar) for async processing.
 */
export async function startDCTFWebTransmission(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const escritorioId = (session.user as any).escritorioId;
  const userId = (session.user as any).id;
  const userName = (session.user as any).name || 'Usuario';

  const clienteId = formData.get('clienteId') as string;
  const ano = parseInt(formData.get('ano') as string);
  const mes = parseInt(formData.get('mes') as string);

  // Verify client belongs to contador
  const cliente = await prisma.clienteFinal.findFirst({
    where: { id: clienteId, escritorioId },
  });
  if (!cliente) throw new Error('Cliente não encontrado');

  // Create or update obrigacao with RASCUNHO status (initial state)
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
      ipAddress: null,
      userAgent: null,
    },
  });

  // In a real implementation, we would enqueue a background job here.
  // For the mock, we use setTimeout to simulate async processing.
  // The simulation runs in the background while this function returns.
  setTimeout(() => {
    // Fire and forget - we don't await the simulation
    simulateDCTFWebTransmission(obrigacao.id).catch(err => {
      console.error('DCTFWeb simulation failed:', err);
      // Update status to ERRO on failure
      prisma.obrigacao.update({
        where: { id: obrigacao.id },
        data: { status: 'ERRO' },
      }).catch(e => console.error('Failed to set ERRO status:', e));
    });
  }, 100); // Small delay to let the response return first

  revalidatePath('/dashboard/obrigacoes/dctfweb');
  revalidatePath('/dashboard/obrigacoes');

  return { success: true, obrigacaoId: obrigacao.id, status: 'RASCUNHO' };
}

// Legacy function kept for backwards compatibility
export async function transmitDCTFWeb(formData: FormData) {
  return startDCTFWebTransmission(formData);
}
