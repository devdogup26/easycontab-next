'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  Home,
  Users,
  FileText,
  Shield,
  CreditCard,
  Mail,
  FileCheck,
  Key,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  TableProperties,
} from 'lucide-react';
import styles from './Sidebar.module.css';

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
};

// Navigation for SUPER_ADMIN (Plataforma)
const superAdminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Escritórios', href: '/admin/escritorios', icon: Building2 },
  { label: 'Config. Auxiliares', href: '/admin/config-auxiliares', icon: TableProperties },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

// Navigation for ADMIN (Escritório)
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users },
  {
    label: 'Obrigações',
    icon: FileText,
    children: [
      { label: 'Tipos de Obrigações', href: '/dashboard/obrigacoes/tipos' },
      { label: 'Prazos de Entrega', href: '/dashboard/obrigacoes/prazos' },
      { label: 'DCTFWeb em Andamento', href: '/dashboard/obrigacoes/dctfweb' },
      { label: 'Todas as Obrigações', href: '/dashboard/obrigacoes' },
    ],
  },
  // TODO: reabilitar quando implementado
  // { label: 'Situação Fiscal Federal', href: '/dashboard/situacao-fiscal', icon: Shield },
  // { label: 'Parcelamentos Federais', href: '/dashboard/parcelamentos', icon: CreditCard },
  { label: 'Caixa Postal', href: '/dashboard/caixa-postal', icon: Mail },
  {
    label: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const globalRole = (session?.user as any)?.globalRole;
  const navItems = globalRole === 'SUPER_ADMIN' ? superAdminNavItems : adminNavItems;
  const isSuperAdmin = globalRole === 'SUPER_ADMIN';

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeMobile = () => setMobileOpen(false);

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) => {
    if (!item.children) return isActive(item.href || '');
    return item.children.some(child => isActive(child.href));
  };

  return (
    <>
      <button className={styles.mobileToggle} onClick={toggleMobile} aria-label="Menu">
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileOpen && <div className={styles.overlay} onClick={closeMobile} />}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📊</span>
          <span className={styles.logoText}>EasyContab</span>
          <NotificationBell />
          <button className={styles.mobileClose} onClick={closeMobile} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus[item.label];
            const parentIsActive = isParentActive(item);

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      className={`${styles.navItem} ${styles.navItemExpandable} ${parentIsActive ? styles.active : ''}`}
                      onClick={() => toggleSubmenu(item.label)}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                      <ChevronRight
                        size={16}
                        className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className={styles.submenu}>
                        {item.children?.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`${styles.submenuItem} ${isActive(child.href) ? styles.submenuItemActive : ''}`}
                            onClick={closeMobile}
                          >
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className={`${styles.navItem} ${isActive(item.href || '') ? styles.active : ''}`}
                    onClick={closeMobile}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.footer}>
          {session?.user && (
            <div className={styles.user}>
              <span className={styles.userName}>{(session.user as any).nome}</span>
              <span className={styles.userEmail}>
                {(session.user as any).escritorioNome || 'Admin'}
              </span>
              {isSuperAdmin && <span className={styles.userBadge}>Super Admin</span>}
            </div>
          )}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className={styles.logoutBtn}
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

        <ConfirmDialog
          isOpen={showLogoutDialog}
          title="Sair do Sistema"
          message="Deseja realmente sair?"
          confirmLabel="Sair"
          cancelLabel="Cancelar"
          variant="default"
          onConfirm={() => signOut({ callbackUrl: '/login' })}
          onCancel={() => setShowLogoutDialog(false)}
        />
      </>
    );
  }
