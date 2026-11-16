import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from './primitives'

export const fieldBase =
  'h-8 w-full rounded-lg border border-border bg-white px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-ring/30 aria-invalid:border-rose-500 aria-invalid:focus:border-rose-500 aria-invalid:focus:ring-rose-500/20 transition disabled:bg-neutral-100 disabled:text-muted-foreground'

export function FieldLabel({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  required?: boolean
  error?: string | null
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </label>
  )
}

export interface SelectOption {
  value: string | number
  label: string
}

export function FieldSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
  className = '',
  disabled,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
  value: string | number | undefined
  onChange: (value: string) => void
  options: Array<string | SelectOption>
  placeholder?: string
  error?: string | null
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value ?? ''}
        disabled={disabled}
        aria-invalid={Boolean(error) || rest['aria-invalid']}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldBase, 'appearance-none pr-7 cursor-pointer')}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return (
            <option key={String(v)} value={v}>
              {l}
            </option>
          )
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari data...',
  className = '',
  shortcut,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onChange: (value: string) => void
  shortcut?: string
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 w-full rounded-lg border border-border bg-card pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-ring/40 transition"
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Bersihkan pencarian"
          className="absolute right-1.5 inline-flex size-4 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
        >
          <X className="size-3" />
        </button>
      ) : shortcut ? (
        <kbd className="pointer-events-none absolute right-1.5 inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  )
}

export interface FilterGroupItem {
  value: string
  label: ReactNode
  count?: number
  dot?: string
}

export function FilterGroup({
  items,
  value,
  onChange,
  className = '',
}: {
  items: FilterGroupItem[]
  value: string
  onChange: (next: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5 text-xs',
        className,
      )}
    >
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              'inline-flex h-6 items-center gap-1.5 rounded-md px-2 font-medium transition cursor-pointer',
              active
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {it.dot && <span className={cn('size-1.5 rounded-full', it.dot)} />}
            <span>{it.label}</span>
            {it.count !== undefined && (
              <span
                className={cn(
                  'rounded px-1 text-[10px] tabular-nums',
                  active ? 'bg-muted text-foreground' : 'text-muted-foreground',
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
  icon: Icon,
  align = 'left',
}: {
  value: string
  onChange: (next: string) => void
  options: Array<string | { value: string; label: string; dot?: string }>
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const current = normalized.find((o) => o.value === value) || normalized[0]

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent/50 cursor-pointer"
      >
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label && <span className="text-muted-foreground">{label}:</span>}
        <span>{current?.label}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div
          className={cn(
            'pop-in absolute z-40 mt-1 min-w-[170px] rounded-lg border border-border bg-popover p-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {normalized.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition cursor-pointer',
                  active
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <span className="flex items-center gap-1.5 truncate">
                  {opt.dot && <span className={cn('size-1.5 rounded-full', opt.dot)} />}
                  {opt.label}
                </span>
                {active && <Check className="size-3.5 text-foreground shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
