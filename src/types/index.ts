import type { DefaultRes, Pagination, PaginationReq, PaginationRes } from './axios'

export type { DefaultRes, Pagination, PaginationReq, PaginationRes }

export interface RoleAccess {
  subject: string
  actions: string[]
}

export interface RoleSummary {
  id: string
  name: string
  description?: string | null
  subject?: string | null
  access?: RoleAccess[]
  permissions?: PermissionItem[]
}

export interface PermissionItem {
  id: string
  name: string
  label: string
  group: string
}

export interface PermissionGroup {
  group: string
  permissions: PermissionItem[]
}

export interface AuthUser {
  id: string
  name: string
  username: string
  employeeCode: string | null
  email: string
  photoUrl: string | null
  lastLogin?: string | null
  emailVerifiedAt?: string | null
  notificationDevice?: string | null
  token?: string
  roles: RoleSummary[]
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface AuthSession {
  token: string | null
  user: AuthUser | null
}
