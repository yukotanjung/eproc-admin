import { Store, useStore } from '@tanstack/react-store'
import type { AuthSession, AuthUser } from '~/types'

const STORAGE_KEY = 'eproc_admin_auth_v1'

function loadPersistedSession(): AuthSession {
  if (typeof window === 'undefined') {
    return { token: null, user: null }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }
    const parsed = JSON.parse(raw) as AuthSession
    return {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
    }
  } catch {
    return { token: null, user: null }
  }
}

function savePersistedSession(session: AuthSession) {
  if (typeof window === 'undefined') return
  try {
    if (!session.token && !session.user) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  } catch {
    // Ignore storage quota failures
  }
}

export const authStore = new Store<AuthSession>(loadPersistedSession())

export const authActions = {
  setSession(token: string, user: AuthUser) {
    const next: AuthSession = { token, user }
    authStore.setState(() => next)
    savePersistedSession(next)
  },
  updateUser(user: AuthUser) {
    authStore.setState((prev) => {
      const next: AuthSession = {
        token: prev.token ?? user.token ?? null,
        user,
      }
      savePersistedSession(next)
      return next
    })
  },
  clearSession() {
    const empty: AuthSession = { token: null, user: null }
    authStore.setState(() => empty)
    savePersistedSession(empty)
  },
  getToken(): string | null {
    return authStore.state.token
  },
  hasPermission(permission?: string): boolean {
    if (!permission) return true
    const user = authStore.state.user
    if (!user) return false
    if (Array.isArray(user.permissions)) {
      return user.permissions.includes(permission)
    }
    const rolePermissions = user.roles?.flatMap((r) => r.permissions ?? []) ?? []
    if (rolePermissions.length > 0) {
      return rolePermissions.some((p) => p.name === permission)
    }
    const accessList =
      user.roles?.flatMap((r) =>
        (r.access ?? []).flatMap((a) => a.actions.map((action) => `${a.subject}_${action}`)),
      ) ?? []
    return accessList.includes(permission)
  },
  hasAnyPermission(permissions: string[]): boolean {
    if (permissions.length === 0) return true
    return permissions.some((permission) => authActions.hasPermission(permission))
  },
}

export function useAuth() {
  const session = useStore(authStore)
  return {
    token: session.token,
    user: session.user,
    isAuthenticated: Boolean(session.token),
    ...authActions,
  }
}
