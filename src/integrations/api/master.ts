import { queryOptions } from '@tanstack/react-query'
import type { DefaultRes, PaginationReq, PaginationRes } from '~/types'
import { apiClient, buildQueryParams } from './client'

export type MasterResourceKey =
  | 'funding-source'
  | 'tax'
  | 'business-type'
  | 'work-unit'
  | 'unit'
  | 'qualification'
  | 'education-level'
  | 'major'
  | 'job-type'
  | 'job-field'
  | 'job-sub-field'
  | 'classification'
  | 'holiday'

export interface MasterItem {
  id: number
  name: string
  code?: string | null
  description?: string | null
  isSpt?: boolean
  isActive?: boolean
  jobTypeId?: number | null
  jobFieldId?: number | null
  holidayDate?: string | null
  jobType?: { id: number; name: string } | null
  jobField?: { id: number; name: string } | null
  createdAt?: string
  updatedAt?: string
}

export interface MasterPayload {
  name: string
  code?: string | null
  description?: string | null
  isSpt?: boolean
  isActive?: boolean
  jobTypeId?: number | null
  jobFieldId?: number | null
  holidayDate?: string | null
}

export interface ProcurementMethodStage {
  id: number
  procurementMethodId?: number
  sequence: number
  name: string
  durationDays: number
  dayType: 'calendar' | 'working_day'
  requiresFile: boolean
  isPublic: boolean
  pageKey: string
  processKey: string
  description?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProcurementMethod {
  id: number
  name: string
  description?: string | null
  isActive: boolean
  stages?: ProcurementMethodStage[]
  createdAt?: string
  updatedAt?: string
}

export interface ProcurementMethodPayload {
  name: string
  description?: string | null
  isActive?: boolean
}

export interface ProcurementMethodStagePayload {
  sequence: number
  name: string
  durationDays: number
  dayType: 'calendar' | 'working_day'
  requiresFile?: boolean
  isPublic?: boolean
  pageKey: string
  processKey: string
  description?: string | null
  isActive?: boolean
}

export interface PreviewScheduleStageItem {
  stageId?: number
  sequence: number
  name: string
  durationDays: number
  dayType: 'calendar' | 'working_day'
  requiresFile?: boolean
  isPublic?: boolean
  pageKey?: string
  processKey?: string
  startDate?: string
  endDate?: string
  nextStartDate?: string
  startAt?: string
  endAt?: string
}

export interface PreviewScheduleResult {
  startDate: string
  stages: PreviewScheduleStageItem[]
}

export const masterApi = {
  async getAll(resource: MasterResourceKey, params?: PaginationReq) {
    const { data } = await apiClient.get<PaginationRes<MasterItem>>(`/api/${resource}`, {
      params: buildQueryParams(params),
    })
    return data
  },

  async getById(resource: MasterResourceKey, id: number) {
    const { data } = await apiClient.get<DefaultRes<MasterItem>>(`/api/${resource}/${id}`)
    return data
  },

  async create(resource: MasterResourceKey, payload: MasterPayload) {
    const { data } = await apiClient.post<DefaultRes<MasterItem>>(`/api/${resource}`, payload)
    return data
  },

  async update(resource: MasterResourceKey, id: number, payload: MasterPayload) {
    const { data } = await apiClient.post<DefaultRes<MasterItem>>(`/api/${resource}/${id}`, payload)
    return data
  },

  async remove(resource: MasterResourceKey, id: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(`/api/${resource}/${id}`)
    return data
  },
}

export const procurementMethodApi = {
  async getAll(params?: PaginationReq) {
    const { data } = await apiClient.get<PaginationRes<ProcurementMethod>>(
      '/api/procurement-method',
      { params: buildQueryParams(params) },
    )
    return data
  },

  async getById(id: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementMethod>>(
      `/api/procurement-method/${id}`,
    )
    return data
  },

  async create(payload: ProcurementMethodPayload) {
    const { data } = await apiClient.post<DefaultRes<ProcurementMethod>>(
      '/api/procurement-method',
      payload,
    )
    return data
  },

  async update(id: number, payload: ProcurementMethodPayload) {
    const { data } = await apiClient.post<DefaultRes<ProcurementMethod>>(
      `/api/procurement-method/${id}`,
      payload,
    )
    return data
  },

  async remove(id: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(`/api/procurement-method/${id}`)
    return data
  },

  async getStages(methodId: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementMethodStage[]>>(
      `/api/procurement-method/${methodId}/stage`,
    )
    return data
  },

  async createStage(methodId: number, payload: ProcurementMethodStagePayload) {
    const { data } = await apiClient.post<DefaultRes<ProcurementMethodStage>>(
      `/api/procurement-method/${methodId}/stage`,
      payload,
    )
    return data
  },

  async updateStage(
    methodId: number,
    stageId: number,
    payload: Partial<ProcurementMethodStagePayload>,
  ) {
    const { data } = await apiClient.post<DefaultRes<ProcurementMethodStage>>(
      `/api/procurement-method/${methodId}/stage/${stageId}`,
      payload,
    )
    return data
  },

  async removeStage(methodId: number, stageId: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(
      `/api/procurement-method/${methodId}/stage/${stageId}`,
    )
    return data
  },

  async reorderStages(methodId: number, stageIds: number[]) {
    const { data } = await apiClient.post<DefaultRes<ProcurementMethodStage[]>>(
      `/api/procurement-method/${methodId}/stage/reorder`,
      { stageIds },
    )
    return data
  },

  async previewSchedule(methodId: number, startDate: string) {
    const { data } = await apiClient.post<DefaultRes<PreviewScheduleResult>>(
      `/api/procurement-method/${methodId}/preview-schedule`,
      { startDate },
    )
    return data
  },
}

export const masterQueries = {
  list: (resource: MasterResourceKey, params?: PaginationReq) =>
    queryOptions({
      queryKey: ['master', resource, 'list', params],
      queryFn: () => masterApi.getAll(resource, params),
    }),
  detail: (resource: MasterResourceKey, id: number) =>
    queryOptions({
      queryKey: ['master', resource, 'detail', id],
      queryFn: () => masterApi.getById(resource, id),
      enabled: Boolean(id),
    }),
}

export const procurementMethodQueries = {
  list: (params?: PaginationReq) =>
    queryOptions({
      queryKey: ['procurement-methods', 'list', params],
      queryFn: () => procurementMethodApi.getAll(params),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: ['procurement-methods', 'detail', id],
      queryFn: () => procurementMethodApi.getById(id),
      enabled: Boolean(id),
    }),
  stages: (methodId: number) =>
    queryOptions({
      queryKey: ['procurement-methods', methodId, 'stages'],
      queryFn: () => procurementMethodApi.getStages(methodId),
      enabled: Boolean(methodId),
    }),
}
