import { useCallback, useState } from 'react'
import type { ZodType } from 'zod'

export type FormErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>

/**
 * Reusable Zod-based form validation hook for all existing and future forms.
 * Maps the first Zod issue per field into `errors` for FieldLabel and aria-invalid inputs.
 */
export function useFormValidation<T extends Record<string, unknown>>(schema: ZodType<T>) {
  const [errors, setErrors] = useState<FormErrors<T>>({})

  const validate = useCallback(
    (values: unknown): { success: true; data: T } | { success: false; errors: FormErrors<T> } => {
      const parsed = schema.safeParse(values)
      if (parsed.success) {
        setErrors({})
        return { success: true, data: parsed.data }
      }

      const nextErrors: FormErrors<T> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof T | undefined
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      }
      setErrors(nextErrors)
      return { success: false, errors: nextErrors }
    },
    [schema],
  )

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    setErrors,
    validate,
    clearError,
    clearErrors,
  }
}
