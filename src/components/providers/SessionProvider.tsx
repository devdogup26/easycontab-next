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
      setPermissions({
        isAdmin: (session.user as any).perfil?.isAdmin || false,
        permissoes: (session.user as any).permissoes || [],
        perfilNome: (session.user as any).perfil?.nome
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