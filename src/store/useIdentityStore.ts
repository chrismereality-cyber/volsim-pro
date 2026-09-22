import { create } from "zustand";

export type UserRole =
  | "user"
  | "trader"
  | "admin"
  | "superadmin";

export interface FrontendIdentity {
  userId: string | null;
  username: string | null;
  roles: UserRole[];
  permissions: string[];
  isActive: boolean;
  authenticated: boolean;
}

interface IdentityState extends FrontendIdentity {
  setIdentity: (identity: Partial<FrontendIdentity>) => void;
  clearIdentity: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const DEFAULT_IDENTITY: FrontendIdentity = {
  userId: null,
  username: null,
  roles: [],
  permissions: [],
  isActive: false,
  authenticated: false,
};

export const useIdentityStore = create<IdentityState>((set, get) => ({
  ...DEFAULT_IDENTITY,

  setIdentity: (identity) =>
    set((state) => ({
      ...state,
      ...identity,
      authenticated:
        identity.authenticated ??
        Boolean(identity.userId),
    })),

  clearIdentity: () =>
    set({
      ...DEFAULT_IDENTITY,
    }),

  hasPermission: (permission) => {
    const state = get();

    if (!state.authenticated || !state.isActive) {
      return false;
    }

    return (
      state.permissions.includes("*") ||
      state.permissions.includes(permission)
    );
  },

  hasAnyPermission: (permissions) => {
    const state = get();

    if (!state.authenticated || !state.isActive) {
      return false;
    }

    return (
      state.permissions.includes("*") ||
      permissions.some((permission) =>
        state.permissions.includes(permission)
      )
    );
  },

  hasAllPermissions: (permissions) => {
    const state = get();

    if (!state.authenticated || !state.isActive) {
      return false;
    }

    if (state.permissions.includes("*")) {
      return true;
    }

    return permissions.every((permission) =>
      state.permissions.includes(permission)
    );
  },
}));
