import { create } from 'zustand';

interface PermissionsStore {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissoes: Set<string>;
  perfilNome: string | null;
  setPermissions: (data: {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    permissoes: string[];
    perfilNome?: string;
  }) => void;
  clear: () => void;
  hasPermission: (code: string) => boolean;
}

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
  isAdmin: false,
  isSuperAdmin: false,
  permissoes: new Set(),
  perfilNome: null,
  setPermissions: ({ isAdmin, isSuperAdmin, permissoes, perfilNome }) =>
    set({
      isAdmin,
      isSuperAdmin,
      permissoes: new Set(permissoes),
      perfilNome: perfilNome || null,
    }),
  clear: () =>
    set({ isAdmin: false, isSuperAdmin: false, permissoes: new Set(), perfilNome: null }),
  hasPermission: code => {
    const { isAdmin, isSuperAdmin, permissoes } = get();
    return isSuperAdmin || isAdmin || permissoes.has(code);
  },
}));
