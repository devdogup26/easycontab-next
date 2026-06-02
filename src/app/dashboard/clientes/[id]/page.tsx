import { prisma } from '@/lib/server/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClienteEditForm from './ClienteEditForm';
import styles from '../novo/page.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { id } = await params;
  const escritorioId = (session.user as any).escritorioId;

  const cliente = await prisma.clienteFinal.findFirst({
    where: { id, escritorioId },
  });

  if (!cliente) {
    redirect('/dashboard/clientes');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Editar Cliente</h1>
          <p className={styles.subtitle}>Atualize os dados do cliente</p>
        </div>
      </div>

      <ClienteEditForm cliente={cliente} />
    </div>
  );
}