import { z } from 'zod'

export interface Pagination {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface DefaultRes<T = unknown> {
  message: string
  result: T
}

export interface PaginationRes<T = unknown> {
  message: string
  result: T[]
  paginate?: Pagination
}

export interface PaginationReq {
  page?: number
  pageSize?: number
  all?: boolean
  search?: string
  filter?: Record<string, string | number | boolean | undefined>
}

export const paginationReqSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  all: z.boolean().optional(),
  search: z.string().optional(),
})
