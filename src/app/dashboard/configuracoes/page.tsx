import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { ConfiguracoesClient } from './ConfiguracoesClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const escritorioId = (session.user as any).escritorioId;

  const [usuario, escritorio] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
    }),
    prisma.escritorio.findUnique({
      where: { id: escritorioId },
    }),
  ]);

  const usuarioData = usuario
    ? {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        cargo: usuario.cargo,
        globalRole: usuario.globalRole,
      }
    : null;

  const escritorioData = escritorio
    ? {
        id: escritorio.id,
        nome: escritorio.nome,
        logoUrl: escritorio.logoUrl,
        email: escritorio.email,
        telefone: escritorio.telefone,
        crc: escritorio.crc,
        cna: escritorio.cna,
      }
    : null;

  return <ConfiguracoesClient usuario={usuarioData} escritorio={escritorioData} />;
}
