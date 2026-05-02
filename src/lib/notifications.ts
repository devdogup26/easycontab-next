import { prisma } from '@/lib/server/prisma';

interface NotificationData {
  usuarioId: string;
  escritorioId: string;
  titulo: string;
  mensagem: string;
  tipo: 'warning' | 'error' | 'info' | 'success';
  link?: string;
  urgente?: boolean;
}

/**
 * Generate deadline alerts for an escritorio.
 * Creates Notificacao records for:
 * - Obrigacoes with dataVencimento in the next 5 days
 * - Certificados with validade in the next 30 days
 * - Parcelamentos with parcelasEmAtraso > 0
 */
export async function generateDeadlineAlerts(escritorioId: string): Promise<number> {
  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const notifications: NotificationData[] = [];

  // Get all usuarios for this escritorio
  const usuarios = await prisma.usuario.findMany({
    where: { escritorioId },
    select: { id: true },
  });

  if (usuarios.length === 0) return 0;

  // Check Obrigacoes with deadline in next 5 days
  const obrigacoesNearDeadline = await prisma.obrigacao.findMany({
    where: {
      cliente: { escritorioId },
      dataVencimento: {
        gte: now,
        lte: fiveDaysFromNow,
      },
      status: { in: ['NAO_ENTREGUE', 'INCONSISTENCIA'] },
    },
    include: {
      cliente: { select: { nomeRazao: true } },
    },
  });

  for (const obr of obrigacoesNearDeadline) {
    const daysUntil = Math.ceil(
      (obr.dataVencimento!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    for (const usuario of usuarios) {
      notifications.push({
        usuarioId: usuario.id,
        escritorioId,
        titulo: `Obrigação vencendo em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`,
        mensagem: `${obr.tipo} - ${obr.cliente.nomeRazao} (Vencimento: ${obr.dataVencimento!.toLocaleDateString('pt-BR')})`,
        tipo: daysUntil <= 2 ? 'error' : 'warning',
        urgente: daysUntil <= 2,
        link: `/dashboard/obrigacoes/${obr.id}`,
      });
    }
  }

  // Check Certificados expiring in next 30 days
  const certificadosNearExpiry = await prisma.certificado.findMany({
    where: {
      cliente: { escritorioId },
      validade: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
      status: 'VALIDO',
    },
    include: {
      cliente: { select: { nomeRazao: true } },
    },
  });

  for (const cert of certificadosNearExpiry) {
    const daysUntil = Math.ceil(
      (cert.validade.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    for (const usuario of usuarios) {
      notifications.push({
        usuarioId: usuario.id,
        escritorioId,
        titulo: `Certificado digital expira em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`,
        mensagem: `${cert.tipo} - ${cert.cliente.nomeRazao} (Validade: ${cert.validade.toLocaleDateString('pt-BR')})`,
        tipo: daysUntil <= 7 ? 'error' : 'warning',
        urgente: daysUntil <= 7,
        link: `/dashboard/certificados/${cert.id}`,
      });
    }
  }

  // Check Parcelamentos with overdue installments
  const parcelamentosWithArrears = await prisma.parcelamento.findMany({
    where: {
      cliente: { escritorioId },
      parcelasEmAtraso: { gt: 0 },
    },
    include: {
      cliente: { select: { nomeRazao: true } },
    },
  });

  for (const parc of parcelamentosWithArrears) {
    for (const usuario of usuarios) {
      notifications.push({
        usuarioId: usuario.id,
        escritorioId,
        titulo: `Parcelamento com ${parc.parcelasEmAtraso} parcela${parc.parcelasEmAtraso !== 1 ? 's' : ''} em atraso`,
        mensagem: `${parc.tipo} - ${parc.cliente.nomeRazao}`,
        tipo: 'error',
        urgente: true,
        link: `/dashboard/parcelamentos/${parc.id}`,
      });
    }
  }

  // Batch insert notifications, avoiding duplicates
  if (notifications.length === 0) return 0;

  // Check for existing notifications to avoid duplicates
  const existingNotifications = await prisma.notificacao.findMany({
    where: {
      escritorioId,
      createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Within last 24h
    },
    select: { titulo: true, mensagem: true, usuarioId: true },
  });

  const existingKeys = new Set(
    existingNotifications.map((n) => `${n.titulo}-${n.mensagem}-${n.usuarioId}`)
  );

  const newNotifications = notifications.filter(
    (n) => !existingKeys.has(`${n.titulo}-${n.mensagem}-${n.usuarioId}`)
  );

  if (newNotifications.length === 0) return 0;

  await prisma.notificacao.createMany({
    data: newNotifications,
  });

  return newNotifications.length;
}
