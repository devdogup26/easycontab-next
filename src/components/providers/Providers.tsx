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
      const user = session.user as any
      setPermissions({
        isAdmin: user.perfil?.isAdmin || false,
        isSuperAdmin: user.globalRole === 'SUPER_ADMIN',
        permissoes: user.permissoes || [],
        perfilNome: user.perfil?.nome
      })
    }
  }, [session, setPermissions])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <PermissionsSync />
      {children}
    </NextAuthSessionProvider>
  )
}