'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { usePermissionsStore } from '@/stores/permissions'
import { PermissionGate } from '@/components/auth/PermissionGate'
import {
  Home, Users, FileText, Shield, CreditCard, Mail,
  FileCheck, Key, History, BarChart3, Settings, LogOut
} from 'lucide-react'
import styles from './Sidebar.module.css'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, code: null },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users, code: 'clientes:read' },
  { label: 'Obrigações', href: '/dashboard/obrigacoes', icon: FileText, code: 'obrigacoes:read' },
  { label: 'Situação Fiscal', href: '/dashboard/situacao-fiscal', icon: Shield, code: null },
  { label: 'Parcelamentos', href: '/dashboard/parcelamentos', icon: CreditCard, code: 'parcelamentos:read' },
  { label: 'Caixa Postal', href: '/dashboard/caixa-postal', icon: Mail, code: null },
  { label: 'Certidões', href: '/dashboard/certidoes', icon: FileCheck, code: 'certidoes:read' },
  { label: 'Certificados', href: '/dashboard/certificados', icon: Key, code: null },
  { label: 'Auditoria', href: '/dashboard/auditoria', icon: History, code: 'auditoria:read' },
  { label: 'Admin', href: '/dashboard/admin', icon: BarChart3, adminOnly: true },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings, code: 'configuracoes' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isAdmin } = usePermissionsStore()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>📊</span>
        <span className={styles.logoText}>EasyContab</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map(item => {
          if (item.adminOnly && !isAdmin) return null

          return (
            <PermissionGate key={item.href} code={item.code || undefined}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </PermissionGate>
          )
        })}
      </nav>

      <div className={styles.footer}>
        {session?.user && (
          <div className={styles.user}>
            <span className={styles.userName}>{(session.user as any).nome}</span>
            <span className={styles.userEmail}>{(session.user as any).contadorNome}</span>
          </div>
        )}
        <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}