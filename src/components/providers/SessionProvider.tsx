'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { usePermissionsStore } from '@/stores/permissions'

function PermissionsSync() {
  const { data: session } = useSession()
  const setPermissions = usePermissionsStore(s => s.setPermissions)

  useEffect(() => {
    if (session?.user) {
      // Admin access if: perfil.isAdmin=true OR legacy globalRole=SUPER_ADMIN (backwards compat)
      const user = session.user as any
      const isAdmin = user.perfil?.isAdmin || user.globalRole === 'SUPER_ADMIN'
      setPermissions({
        isAdmin,
        isSuperAdmin: user.globalRole === 'SUPER_ADMIN', // kept for badge display
        permissoes: user.permissoes || [],
        perfilNome: user.perfil?.nome
      })
    }
  }, [session, setPermissions])

  return null
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <PermissionsSync />
      {children}
    </NextAuthSessionProvider>
  )
}