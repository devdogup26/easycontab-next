import { create } from 'zustand'

interface PermissionsStore {
  isAdmin: boolean
  permissoes: Set<string>
  perfilNome: string | null
  setPermissions: (data: { isAdmin: boolean; permissoes: string[]; perfilNome?: string }) => void
  clear: () => void
  hasPermission: (code: string) => boolean
}

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
  isAdmin: false,
  permissoes: new Set(),
  perfilNome: null,
  setPermissions: ({ isAdmin, permissoes, perfilNome }) => set({
    isAdmin,
    permissoes: new Set(permissoes),
    perfilNome: perfilNome || null
  }),
  clear: () => set({ isAdmin: false, permissoes: new Set(), perfilNome: null }),
  hasPermission: (code) => {
    const { isAdmin, permissoes } = get()
    return isAdmin || permissoes.has(code)
  }
}))