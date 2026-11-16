import { CaseTransform } from './format-case'

export function objectToFormData(
  payload: Record<string, unknown>,
  convertKeysToSnake = true,
): FormData {
  const formData = new FormData()

  for (const [rawKey, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue
    const key = convertKeysToSnake ? CaseTransform.camelToSnake(rawKey) : rawKey

    if (typeof File !== 'undefined' && value instanceof File) {
      formData.append(key, value)
    } else if (typeof Blob !== 'undefined' && value instanceof Blob) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== undefined && item !== null) {
          formData.append(`${key}[${index}]`, String(item))
        }
      })
    } else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
    } else {
      formData.append(key, String(value))
    }
  }

  return formData
}
