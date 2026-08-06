import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AUTH_STORAGE_KEY, type Role } from '@propertypro/shared'

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: Role[]
  status: UserStatus
  /** If this user is a tenant, links to their tenancy record id */
  tenancyId?: string
}

export type UserStatus = 'pending_verification' | 'active' | 'suspended'

export interface DemoUser {
  id: string
  name: string
  email: string
  roles: Role[]
  tenancyId?: string
}

export const demoUser: DemoUser = {
  id: 'usr_demo',
  name: 'Alex Morgan',
  email: 'alex@propertypro.app',
  roles: ['owner', 'agent'],
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  status: AuthStatus
  signIn: (user: AuthUser | DemoUser, token?: string) => void
  signOut: () => void
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

/** Returns true if the user has admin-level access (owner, agent, admin) */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false
  return user.roles.some((r) => ['owner', 'agent', 'admin'].includes(r))
}

/** Returns true if the user is a tenant (and NOT also an admin) */
export function isTenantOnly(user: AuthUser | null): boolean {
  if (!user) return false
  const hasTenant = user.roles.includes('tenant' as Role)
  const hasAdmin = isAdmin(user)
  return hasTenant && !hasAdmin
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      status: 'loading',
      signIn: (user, token) =>
        set({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            status: 'active',
            tenancyId: (user as DemoUser).tenancyId,
          },
          accessToken: token ?? null,
          status: 'authenticated',
        }),
      signOut: () =>
        set({ user: null, accessToken: null, status: 'unauthenticated' }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
