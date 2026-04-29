'use client'

import { usePermissionsStore } from '@/stores/permissions'

interface Props {
  code?: string
  requires?: string[]
  children: React.ReactNode
}

export function PermissionGate({ code, requires, children }: Props) {
  const { hasPermission, isAdmin } = usePermissionsStore()

  if (isAdmin) return <>{children}</>

  if (requires) {
    return requires.every(r => hasPermission(r)) ? <>{children}</> : null
  }

  if (code) {
    return hasPermission(code) ? <>{children}</> : null
  }

  return <>{children}</>
}