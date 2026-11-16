import axios from 'axios'
import { authActions } from '~/lib/store/auth'
import { CaseTransform, ObjectTransform } from '~/lib/utils/format-case'
import type { PaginationReq } from '~/types'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = authActions.getToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.params && typeof config.params === 'object') {
    const transformedParams: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(config.params as Record<string, unknown>)) {
      if (value === undefined || value === null || value === '') continue
      if (key === 'filter' && typeof value === 'object' && value !== null) {
        for (const [fKey, fVal] of Object.entries(value as Record<string, unknown>)) {
          if (fVal !== undefined && fVal !== null && fVal !== '') {
            transformedParams[`filter[${CaseTransform.camelToSnake(fKey)}]`] = fVal
          }
        }
      } else {
        transformedParams[CaseTransform.camelToSnake(key)] = value
      }
    }
    config.params = transformedParams
  }

  if (
    config.data &&
    typeof config.data === 'object' &&
    !(typeof FormData !== 'undefined' && config.data instanceof FormData) &&
    !(typeof Blob !== 'undefined' && config.data instanceof Blob)
  ) {
    config.data = ObjectTransform.camelToSnake(config.data)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      !(typeof Blob !== 'undefined' && response.data instanceof Blob)
    ) {
      response.data = ObjectTransform.snakeToCamel(response.data)
    }
    return response
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      if (!requestUrl.includes('/api/auth/login')) {
        authActions.clearSession()
      }
    }
    return Promise.reject(error)
  },
)

export function buildQueryParams(params?: PaginationReq) {
  if (!params) return undefined
  return {
    page: params.page,
    pageSize: params.pageSize,
    all: params.all,
    search: params.search,
    filter: params.filter,
  }
}

export async function downloadApiFile(url: string, fallbackFilename: string) {
  const response = await apiClient.get<Blob>(url, {
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  let filename = fallbackFilename
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/i)
    if (match?.[1]) filename = match[1]
  }

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.setAttribute('download', filename)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(blobUrl)
}
