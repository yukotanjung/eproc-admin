import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan saat memproses permintaan.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string
          errors?: Record<string, string[] | string>
        }
      | undefined

    if (data?.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0]
      if (firstKey) {
        const entry = data.errors[firstKey]
        if (Array.isArray(entry) && entry[0]) return entry[0]
        if (typeof entry === 'string') return entry
      }
    }

    if (data?.message && typeof data.message === 'string') {
      return data.message
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Tidak dapat terhubung ke server API. Pastikan layanan eproc-api aktif.'
    }

    if (error.message) return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
