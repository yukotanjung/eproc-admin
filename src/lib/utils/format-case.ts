export class CaseTransform {
  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())
  }

  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  if (value instanceof Date || value instanceof RegExp) return false
  if (typeof File !== 'undefined' && value instanceof File) return false
  if (typeof Blob !== 'undefined' && value instanceof Blob) return false
  if (typeof FormData !== 'undefined' && value instanceof FormData) return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

export class ObjectTransform {
  static snakeToCamel<T>(obj: T): T {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.snakeToCamel(item)) as unknown as T
    }
    if (isPlainObject(obj)) {
      const transformed: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = CaseTransform.snakeToCamel(key)
        transformed[camelKey] = this.snakeToCamel(value)
      }
      return transformed as T
    }
    return obj
  }

  static camelToSnake<T>(obj: T): T {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.camelToSnake(item)) as unknown as T
    }
    if (isPlainObject(obj)) {
      const transformed: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        const snakeKey = CaseTransform.camelToSnake(key)
        transformed[snakeKey] = this.camelToSnake(value)
      }
      return transformed as T
    }
    return obj
  }
}
