import { queryOptions } from '@tanstack/react-query'
import { objectToFormData } from '~/lib/utils/append-form-data'
import type {
  AuthUser,
  DefaultRes,
  PaginationReq,
  PaginationRes,
  PermissionGroup,
  PermissionItem,
  RoleSummary,
} from '~/types'
import { apiClient, buildQueryParams } from './client'

export interface RoleDetail extends RoleSummary {
  permissions?: PermissionItem[]
  totalPermissions?: number
  totalUsers?: number
  createdAt?: string
  updatedAt?: string
}

interface RawPermissionItem {
  id: string
  name: string
  subject?: string
  action?: string
  permission?: string
  label?: string
  group?: string
}

interface RawPermissionGroup {
  group?: string
  permissions?: RawPermissionItem[]
  subject?: string
  name?: string
  actions?: Array<{ id: string; action: string }>
}

function normalizePermissionItem(item: RawPermissionItem): PermissionItem {
  const code =
    item.permission ||
    (item.subject && item.action ? `${item.subject}_${item.action}` : item.name)
  const group = item.group || item.name || item.subject || 'Lainnya'
  const label = item.label || (item.action ? `${group} (${item.action})` : item.name)
  return {
    id: item.id,
    name: code,
    label,
    group,
  }
}

export interface RolePayload {
  name: string
  description?: string | null
  permissionIds: string[]
}

export interface UserPayload {
  name: string
  username: string
  employeeCode?: string | null
  email: string
  roleId: string
  callbackUrl: string
  photo?: File | null
}

export const permissionApi = {
  async getAll(params?: PaginationReq) {
    const { data } = await apiClient.get<PaginationRes<RawPermissionItem>>('/api/permission', {
      params: buildQueryParams(params),
    })
    return {
      ...data,
      result: (data.result ?? []).map(normalizePermissionItem),
    } satisfies PaginationRes<PermissionItem>
  },

  async getGrouped() {
    const { data } = await apiClient.get<DefaultRes<RawPermissionGroup[]>>('/api/permission/group')
    const normalized: PermissionGroup[] = (data.result ?? []).map((item) => {
      if (Array.isArray(item.permissions)) {
        return {
          group: item.group || item.name || item.subject || 'Lainnya',
          permissions: item.permissions.map(normalizePermissionItem),
        }
      }
      const groupName = item.name || item.subject || 'Lainnya'
      const subject = item.subject || ''
      return {
        group: groupName,
        permissions: (item.actions ?? []).map((act) => ({
          id: act.id,
          name: subject ? `${subject}_${act.action}` : act.action,
          label: `${groupName} (${act.action})`,
          group: groupName,
        })),
      }
    })
    return {
      ...data,
      result: normalized,
    } satisfies DefaultRes<PermissionGroup[]>
  },

  async getById(id: string) {
    const { data } = await apiClient.get<DefaultRes<RawPermissionItem>>(`/api/permission/${id}`)
    return {
      ...data,
      result: data.result ? normalizePermissionItem(data.result) : data.result,
    } satisfies DefaultRes<PermissionItem>
  },
}

export const roleApi = {
  async getAll(params?: PaginationReq) {
    const { data } = await apiClient.get<PaginationRes<RoleDetail>>('/api/role', {
      params: buildQueryParams(params),
    })
    return data
  },

  async getById(id: string) {
    const { data } = await apiClient.get<DefaultRes<RoleDetail>>(`/api/role/${id}`)
    return data
  },

  async create(payload: RolePayload) {
    const { data } = await apiClient.post<DefaultRes<RoleDetail>>('/api/role', payload)
    return data
  },

  async update(id: string, payload: RolePayload) {
    const { data } = await apiClient.post<DefaultRes<RoleDetail>>(`/api/role/${id}`, payload)
    return data
  },

  async remove(id: string) {
    const { data } = await apiClient.delete<DefaultRes<null>>(`/api/role/${id}`)
    return data
  },
}

export const userApi = {
  async getAll(params?: PaginationReq) {
    const { data } = await apiClient.get<PaginationRes<AuthUser>>('/api/user', {
      params: buildQueryParams(params),
    })
    return data
  },

  async getById(id: string) {
    const { data } = await apiClient.get<DefaultRes<AuthUser>>(`/api/user/${id}`)
    return data
  },

  async create(payload: UserPayload) {
    const formData = objectToFormData({
      name: payload.name,
      username: payload.username,
      employeeCode: payload.employeeCode || undefined,
      email: payload.email,
      roleId: payload.roleId,
      callbackUrl: payload.callbackUrl,
      photo: payload.photo ?? undefined,
    })
    const { data } = await apiClient.post<DefaultRes<AuthUser>>('/api/user', formData)
    return data
  },

  async update(id: string, payload: Partial<UserPayload>) {
    const formData = objectToFormData({
      name: payload.name,
      username: payload.username,
      employeeCode: payload.employeeCode || undefined,
      email: payload.email,
      roleId: payload.roleId,
      callbackUrl: payload.callbackUrl,
      photo: payload.photo ?? undefined,
    })
    const { data } = await apiClient.post<DefaultRes<AuthUser>>(`/api/user/${id}`, formData)
    return data
  },

  async remove(id: string) {
    const { data } = await apiClient.delete<DefaultRes<null>>(`/api/user/${id}`)
    return data
  },

  async resendActivation(id: string, callbackUrl: string) {
    const { data } = await apiClient.get<DefaultRes<AuthUser>>(
      `/api/user/${id}/resend-activation`,
      { params: { callbackUrl } },
    )
    return data
  },
}

export const permissionQueries = {
  list: (params?: PaginationReq) =>
    queryOptions({
      queryKey: ['permissions', 'list', params],
      queryFn: () => permissionApi.getAll(params),
    }),
  grouped: () =>
    queryOptions({
      queryKey: ['permissions', 'grouped'],
      queryFn: () => permissionApi.getGrouped(),
    }),
}

export const roleQueries = {
  list: (params?: PaginationReq) =>
    queryOptions({
      queryKey: ['roles', 'list', params],
      queryFn: () => roleApi.getAll(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ['roles', 'detail', id],
      queryFn: () => roleApi.getById(id),
      enabled: Boolean(id),
    }),
}

export const userQueries = {
  list: (params?: PaginationReq) =>
    queryOptions({
      queryKey: ['users', 'list', params],
      queryFn: () => userApi.getAll(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ['users', 'detail', id],
      queryFn: () => userApi.getById(id),
      enabled: Boolean(id),
    }),
}
