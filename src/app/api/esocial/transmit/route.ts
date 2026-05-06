// eSocial Transmission API Route
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { sendToESocial } from '@/lib/esocial/ws-client';
import { signXml } from '@/lib/esocial/signer';
import { getValidCertificateForCliente } from '@/lib/esocial/certificate';
import { registrarAuditoria } from '@/lib/auditoria';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const escritorioId = (session.user as any).escritorioId;
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { eventoIds, ambiente = 'HOMOLOGACAO' } = body;

    if (!eventoIds || !Array.isArray(eventoIds) || eventoIds.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum evento selecionado para transmissão' },
        { status: 400 }
      );
    }

    // Fetch events to transmit
    const eventos = await prisma.eventoEsocial.findMany({
      where: {
        id: { in: eventoIds },
        escritorioId,
      },
      include: {
        cliente: true,
        Trabalhador: true,
      },
    });

    if (eventos.length === 0) {
      return NextResponse.json({ error: 'Nenhum evento válido encontrado' }, { status: 404 });
    }

    // Group events by client
    const eventsByClient = new Map<string, typeof eventos>();
    for (const evento of eventos) {
      const existing = eventsByClient.get(evento.clienteId) || [];
      existing.push(evento);
      eventsByClient.set(evento.clienteId, existing);
    }

    const results = [];

    // Process each client's events
    for (const [clienteId, clientEvents] of eventsByClient) {
      // Get certificate for this client
      let certificado;
      try {
        certificado = await getValidCertificateForCliente(clienteId);
      } catch (error: any) {
        results.push({
          clienteId,
          sucesso: false,
          mensagem: `Cliente ${clienteId}: ${error.message}`,
        });
        continue;
      }

      // Get latest certificate file
      const arquivoCert = certificado.arquivos[0];

      // Build batch XML
      let batchXml = '';
      for (const evento of clientEvents) {
        batchXml += evento.xmlOriginal;
      }

      // Sign XML (simulated - in production would use actual certificate)
      const signedXml = await signXml({
        xmlContent: batchXml,
        privateKeyPem: 'SIMULATED_KEY',  // Would come from secure storage
        x509CertPem: 'SIMULATED_CERT',   // Would be extracted from arquivo
      });

      // Send to eSocial
      const result = await sendToESocial(signedXml, {
        certBase64: 'SIMULATED_CERT',
        privateKeyPem: 'SIMULATED_KEY',
      }, ambiente as 'PRODUCAO' | 'HOMOLOGACAO');

      // Update events with result
      for (const evento of clientEvents) {
        await prisma.eventoEsocial.update({
          where: { id: evento.id },
          data: {
            status: result.sucesso ? 'PROCESSANDO' : 'ERRO',
            protocolo: result.protocolo || null,
            dataEnvio: new Date(),
            erroCodigo: result.erros?.[0]?.codigo || null,
            erroMensagem: result.erros?.[0]?.descricao || result.mensagem || null,
          },
        });
      }

      // Create or update lote record
      await prisma.loteEnvio.create({
        data: {
          clienteId,
          protocolo: result.protocolo || null,
          quantidadeEventos: clientEvents.length,
          status: result.sucesso ? 'PROCESSANDO' : 'ERRO',
          dataEnvio: new Date(),
          escritorioId,
          erros: result.erros ? JSON.stringify(result.erros) : null,
        },
      });

      // Audit log
      registrarAuditoria({
        usuarioId: userId,
        usuarioNome: (session.user as any).nome || (session.user as any).email,
        escritorioId,
        acao: 'CREATE',
        entidade: 'LoteEnvio',
        entidadeId: clienteId,
        dadosAntigos: null,
        dadosNovos: { eventoIds, resultado: result },
        ipAddress: req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
      }).catch(console.error);

      results.push({
        clienteId,
        sucesso: result.sucesso,
        protocolo: result.protocolo,
        mensagem: result.mensagem,
        erros: result.erros,
      });
    }

    return NextResponse.json({
      results,
      totalEventos: eventoIds.length,
      eventosSucesso: results.filter(r => r.sucesso).length,
      eventosErro: results.filter(r => !r.sucesso).length,
    });
  } catch (error: any) {
    console.error('Transmit error:', error);
    return NextResponse.json({ error: 'Erro ao transmitir eventos' }, { status: 500 });
  }
}