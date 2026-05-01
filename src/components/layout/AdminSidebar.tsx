'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { BarChart3, Building2, Settings, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import styles from './AdminSidebar.module.css';

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
};

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Escritórios', href: '/admin/escritorios', icon: Building2 },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

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
          <span className={styles.logoIcon}>⚙️</span>
          <span className={styles.logoText}>Admin</span>
          <button className={styles.mobileClose} onClick={closeMobile} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {adminNavItems.map(item => {
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
              <span className={styles.userEmail}>Super Admin</span>
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
