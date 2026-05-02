import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { authOptions } from '@/lib/auth';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
