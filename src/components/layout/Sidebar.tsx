'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { usePermissionsStore } from '@/stores/permissions';
import {
  Home,
  Users,
  FileText,
  Shield,
  CreditCard,
  Mail,
  FileCheck,
  Key,
  History,
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
  code?: string | null;
  children?: { label: string; href: string }[];
};

// Navigation for ADMIN users (isAdmin=true in their perfil)
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Escritórios', href: '/admin/escritorios', icon: Building2 },
  { label: 'Config. Auxiliares', href: '/admin/config-auxiliares', icon: TableProperties },
  { label: 'Auditoria', href: '/admin/auditoria', icon: History },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

// Navigation for regular USUARIO (belongs to escritorio, isAdmin=false)
const usuarioNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, code: null },
  {
    label: 'Clientes',
    href: '/dashboard/clientes',
    icon: Users,
    code: 'clientes:read',
  },
  {
    label: 'Obrigações',
    icon: FileText,
    code: 'obrigacoes:read',
    children: [
      { label: 'Tipos de Obrigações', href: '/dashboard/obrigacoes' },
      { label: 'Prazos de Entrega', href: '/dashboard/obrigacoes/prazos' },
      { label: 'DCTFWeb em Andamento', href: '/dashboard/obrigacoes/dctfweb' },
      { label: 'Todas as Obrigações', href: '/dashboard/obrigacoes' },
    ],
  },
  {
    label: 'Situação Fiscal Federal',
    href: '/dashboard/situacao-fiscal',
    icon: Shield,
    code: null,
  },
  {
    label: 'Parcelamentos Federais',
    href: '/dashboard/parcelamentos',
    icon: CreditCard,
    code: 'parcelamentos:read',
  },
  { label: 'Caixa Postal', href: '/dashboard/caixa-postal', icon: Mail, code: null },
  {
    label: 'Certidões',
    icon: FileCheck,
    code: 'certidoes:read',
    children: [
      { label: 'Federal', href: '/dashboard/certidoes' },
      { label: 'Estadual', href: '/dashboard/certidoes/estadual' },
    ],
  },
  { label: 'Certificados', href: '/dashboard/certificados', icon: Key, code: null },
  { label: 'Auditoria', href: '/dashboard/auditoria', icon: History, code: 'auditoria:read' },
  {
    label: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Settings,
    code: 'configuracoes',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isAdmin } = usePermissionsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Admin sees admin nav, otherwise regular usuario nav
  const navItems = isAdmin ? adminNavItems : usuarioNavItems;

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
              {isAdmin && <span className={styles.userBadge}>Admin</span>}
            </div>
          )}
          <button
            onClick={() => {
              if (confirm('Deseja realmente sair?')) {
                signOut({ callbackUrl: '/login' });
              }
            }}
            className={styles.logoutBtn}
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
