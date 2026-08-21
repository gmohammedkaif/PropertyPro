import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AUTH_STORAGE_KEY, INACTIVITY_STORAGE_KEY, type Role, type UserStatus } from '@/shared'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'

export interface AuthUser {
  id: string
  email: string
  name: string
  phone: string
  roles: Role[]
  status: UserStatus
  avatarUrl?: string
  /** If this user is a tenant, links to their tenancy record id */
  tenancyId?: string
}

export type { UserStatus }

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  status: AuthStatus
  signIn: (user: AuthUser, token?: string) => void
  signOut: () => void
  refreshMe: () => Promise<void>
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
      signIn: (user, token) => {
        try {
          localStorage.setItem(INACTIVITY_STORAGE_KEY, Date.now().toString())
        } catch {
          /* ignore storage errors */
        }
        set({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone || '',
            roles: user.roles,
            status: user.status || 'active',
            avatarUrl: user.avatarUrl || '',
            tenancyId: user.tenancyId,
          },
          accessToken: token ?? null,
          status: 'authenticated',
        })
      },
      signOut: () => {
        try {
          localStorage.removeItem(INACTIVITY_STORAGE_KEY)
        } catch {
          /* ignore storage errors */
        }
        set({ user: null, accessToken: null, status: 'unauthenticated' })
      },
      refreshMe: async () => {
        try {
          const { data } = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me')
          const record = data.data
          if (record) {
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    name: record.name,
                    phone: record.phone || '',
                    roles: record.roles,
                    status: record.status || state.user.status,
                    avatarUrl: record.avatarUrl || state.user.avatarUrl || '',
                  }
                : null,
            }))
          }
        } catch (err) {
          console.error('Failed to refresh user profile:', err)
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        // After localStorage is read, set status to loading if user exists (awaiting accessToken refresh),
        // or unauthenticated if no user was found.
        if (state) {
          state.status = state.user ? 'loading' : 'unauthenticated'
        }
      },
    },
  ),
)
