import { queryOptions } from '@tanstack/react-query'
import { objectToFormData } from '~/lib/utils/append-form-data'
import type { DefaultRes, PaginationReq, PaginationRes } from '~/types'
import { apiClient, buildQueryParams, downloadApiFile } from './client'
import type { MasterItem, ProcurementMethod } from './master'

export interface ProcurementItem {
  id: number
  jobNumber: string
  name: string
  budgetCeiling: number | string
  estimatedPrice: number | string
  plannedDate: string
  jobTypeId: number
  procurementMethodId: number
  qualificationId: number
  fundingSourceId: number
  budgetYear: number
  projectLocation: string
  latitude?: number | null
  longitude?: number | null
  announcementLocation: string
  isActive?: boolean
  budgetValue?: number | string
  hpsValue?: number | string | null
  showHps?: boolean
  executionTime?: string
  workDescription?: string | null
  status?: string
  cancelReason?: string | null
  cancellationReason?: string | null
  cancelledAt?: string | null
  jobType?: MasterItem | null
  procurementMethod?: ProcurementMethod | null
  qualification?: MasterItem | null
  fundingSource?: MasterItem | null
  jobSubFields?: MasterItem[]
  schedules?: ProcurementScheduleItem[]
  createdAt?: string
  updatedAt?: string
}

export interface ProcurementPayload {
  jobNumber: string
  name: string
  budgetCeiling: number
  estimatedPrice: number
  plannedDate: string
  jobTypeId: number
  qualificationId: number
  fundingSourceId: number
  budgetYear: number
  projectLocation: string
  latitude?: number | null
  longitude?: number | null
  procurementMethodId: number
  announcementLocation: string
  isActive?: boolean
}

export interface ProcurementScheduleItem {
  id: number
  procurementId?: number
  procurementMethodStageId?: number | null
  sequence: number
  name: string
  durationDays?: number
  actualDurationDays?: number | null
  dayType?: 'calendar' | 'working_day'
  requiresFile: boolean
  isPublic: boolean
  pageKey?: string | null
  processKey?: string | null
  description?: string | null
  startAt?: string | null
  endAt?: string | null
  status?: string
}

export interface SaveScheduleEntry {
  id?: number
  sequence?: number
  startAt?: string | null
  endAt?: string | null
  isPublic?: boolean
}

export interface GenerateSchedulePayload {
  startDate?: string
  fromSequence?: number
  startTime?: string
  endTime?: string
  save?: boolean
}

export interface GenerateScheduleResult {
  procurementId: number
  startDate: string | null
  fromSequence: number
  saved: boolean
  schedules: ProcurementScheduleItem[]
}

export interface ProcurementDocumentItem {
  id: number
  procurementId: number
  name: string
  fileName?: string
  filePath?: string
  fileUrl?: string
  mimeType?: string
  fileSize?: number
  isPublic: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProcurementDocumentPayload {
  name: string
  file?: File | null
  isPublic?: boolean
}

export interface ProcurementChecklistFileItem {
  id: number
  procurementId: number
  procurementScheduleId: number
  name: string
  maxSize: number
  fileTypes: string[]
  isRequired: boolean
  description?: string | null
  procurementSchedule?: ProcurementScheduleItem | null
  createdAt?: string
  updatedAt?: string
}

export interface ProcurementChecklistFilePayload {
  procurementScheduleId: number
  name: string
  maxSize: number
  fileTypes: string[]
  isRequired?: boolean
  description?: string | null
}

export interface ProcurementHpsItem {
  id: number
  procurementId: number
  name: string
  unitId: number
  unit?: MasterItem | null
  quantity: number
  unitPrice: number
  useTax: boolean
  subtotalBeforeTax?: number
  taxAmount?: number
  totalPrice?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProcurementHpsSummary {
  totalItems: number
  totalBeforeTax: number
  totalTax: number
  grandTotal: number
}

export interface ProcurementHpsListResult {
  items: ProcurementHpsItem[]
  summary: ProcurementHpsSummary
}

export interface ProcurementHpsPayload {
  name: string
  unitId: number
  quantity: number
  unitPrice: number
  useTax?: boolean
}

export const procurementApi = {
  async getAll(params?: PaginationReq) {
    const { data } = await apiClient.get<PaginationRes<ProcurementItem>>('/api/procurement', {
      params: buildQueryParams(params),
    })
    return data
  },

  async getById(id: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementItem>>(`/api/procurement/${id}`)
    return data
  },

  async create(payload: ProcurementPayload) {
    const { data } = await apiClient.post<DefaultRes<ProcurementItem>>('/api/procurement', payload)
    return data
  },

  async update(id: number, payload: Partial<ProcurementPayload>) {
    const { data } = await apiClient.post<DefaultRes<ProcurementItem>>(
      `/api/procurement/${id}`,
      payload,
    )
    return data
  },

  async remove(id: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(`/api/procurement/${id}`)
    return data
  },

  async cancel(id: number, reason?: string) {
    const { data } = await apiClient.post<DefaultRes<ProcurementItem>>(
      `/api/procurement/${id}/cancel`,
      { reason },
    )
    return data
  },

  async getJobSubFields(procurementId: number) {
    const { data } = await apiClient.get<DefaultRes<MasterItem[]>>(
      `/api/procurement/${procurementId}/job-sub-field`,
    )
    return data
  },

  async syncJobSubFields(procurementId: number, jobSubFieldIds: number[]) {
    const { data } = await apiClient.post<DefaultRes<MasterItem[]>>(
      `/api/procurement/${procurementId}/job-sub-field`,
      { jobSubFieldIds },
    )
    return data
  },

  async detachJobSubField(procurementId: number, jobSubFieldId: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(
      `/api/procurement/${procurementId}/job-sub-field/${jobSubFieldId}`,
    )
    return data
  },

  async getSchedules(procurementId: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementScheduleItem[]>>(
      `/api/procurement/${procurementId}/schedule`,
    )
    return data
  },

  async getPublicSchedules(procurementId: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementScheduleItem[]>>(
      `/api/public/procurement/${procurementId}/schedule`,
    )
    return data
  },

  async saveSchedules(procurementId: number, schedules: SaveScheduleEntry[]) {
    const { data } = await apiClient.post<DefaultRes<ProcurementScheduleItem[]>>(
      `/api/procurement/${procurementId}/schedule`,
      { schedules },
    )
    return data
  },

  async generateSchedule(procurementId: number, payload: GenerateSchedulePayload) {
    const { data } = await apiClient.post<DefaultRes<GenerateScheduleResult>>(
      `/api/procurement/${procurementId}/schedule/generate`,
      payload,
    )
    return data
  },

  async getDocuments(procurementId: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementDocumentItem[]>>(
      `/api/procurement/${procurementId}/document`,
    )
    return data
  },

  async createDocument(procurementId: number, payload: ProcurementDocumentPayload) {
    const formData = objectToFormData({
      name: payload.name,
      file: payload.file ?? undefined,
      isPublic: payload.isPublic ?? true,
    })
    const { data } = await apiClient.post<DefaultRes<ProcurementDocumentItem>>(
      `/api/procurement/${procurementId}/document`,
      formData,
    )
    return data
  },

  async updateDocument(
    procurementId: number,
    documentId: number,
    payload: ProcurementDocumentPayload,
  ) {
    const formData = objectToFormData({
      name: payload.name,
      file: payload.file ?? undefined,
      isPublic: payload.isPublic,
    })
    const { data } = await apiClient.post<DefaultRes<ProcurementDocumentItem>>(
      `/api/procurement/${procurementId}/document/${documentId}`,
      formData,
    )
    return data
  },

  async removeDocument(procurementId: number, documentId: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(
      `/api/procurement/${procurementId}/document/${documentId}`,
    )
    return data
  },

  async downloadDocument(procurementId: number, documentId: number, filename: string) {
    await downloadApiFile(
      `/api/procurement/${procurementId}/document/${documentId}/download`,
      filename,
    )
  },

  async downloadAllDocuments(procurementId: number, jobNumber?: string) {
    await downloadApiFile(
      `/api/procurement/${procurementId}/document/download-all`,
      `dokumen-${jobNumber || procurementId}.zip`,
    )
  },

  async getChecklistFiles(procurementId: number, procurementScheduleId?: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementChecklistFileItem[]>>(
      `/api/procurement/${procurementId}/checklist-file`,
      {
        params: procurementScheduleId ? { procurementScheduleId } : undefined,
      },
    )
    return data
  },

  async createChecklistFile(
    procurementId: number,
    payload: ProcurementChecklistFilePayload,
  ) {
    const { data } = await apiClient.post<DefaultRes<ProcurementChecklistFileItem>>(
      `/api/procurement/${procurementId}/checklist-file`,
      payload,
    )
    return data
  },

  async updateChecklistFile(
    procurementId: number,
    checklistFileId: number,
    payload: Partial<ProcurementChecklistFilePayload>,
  ) {
    const { data } = await apiClient.post<DefaultRes<ProcurementChecklistFileItem>>(
      `/api/procurement/${procurementId}/checklist-file/${checklistFileId}`,
      payload,
    )
    return data
  },

  async removeChecklistFile(procurementId: number, checklistFileId: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(
      `/api/procurement/${procurementId}/checklist-file/${checklistFileId}`,
    )
    return data
  },

  async getHps(procurementId: number) {
    const { data } = await apiClient.get<DefaultRes<ProcurementHpsListResult>>(
      `/api/procurement/${procurementId}/hps`,
    )
    return data
  },

  async createHps(procurementId: number, payload: ProcurementHpsPayload) {
    const { data } = await apiClient.post<DefaultRes<ProcurementHpsItem>>(
      `/api/procurement/${procurementId}/hps`,
      payload,
    )
    return data
  },

  async updateHps(
    procurementId: number,
    hpsId: number,
    payload: Partial<ProcurementHpsPayload>,
  ) {
    const { data } = await apiClient.post<DefaultRes<ProcurementHpsItem>>(
      `/api/procurement/${procurementId}/hps/${hpsId}`,
      payload,
    )
    return data
  },

  async removeHps(procurementId: number, hpsId: number) {
    const { data } = await apiClient.delete<DefaultRes<null>>(
      `/api/procurement/${procurementId}/hps/${hpsId}`,
    )
    return data
  },
}

export const procurementQueries = {
  list: (params?: PaginationReq) =>
    queryOptions({
      queryKey: ['procurements', 'list', params],
      queryFn: () => procurementApi.getAll(params),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: ['procurements', 'detail', id],
      queryFn: () => procurementApi.getById(id),
      enabled: Boolean(id),
    }),
  jobSubFields: (id: number) =>
    queryOptions({
      queryKey: ['procurements', id, 'job-sub-fields'],
      queryFn: () => procurementApi.getJobSubFields(id),
      enabled: Boolean(id),
    }),
  schedules: (id: number) =>
    queryOptions({
      queryKey: ['procurements', id, 'schedules'],
      queryFn: () => procurementApi.getSchedules(id),
      enabled: Boolean(id),
    }),
  documents: (id: number) =>
    queryOptions({
      queryKey: ['procurements', id, 'documents'],
      queryFn: () => procurementApi.getDocuments(id),
      enabled: Boolean(id),
    }),
  checklistFiles: (id: number, scheduleId?: number) =>
    queryOptions({
      queryKey: ['procurements', id, 'checklist-files', scheduleId],
      queryFn: () => procurementApi.getChecklistFiles(id, scheduleId),
      enabled: Boolean(id),
    }),
  hps: (id: number) =>
    queryOptions({
      queryKey: ['procurements', id, 'hps'],
      queryFn: () => procurementApi.getHps(id),
      enabled: Boolean(id),
    }),
}
