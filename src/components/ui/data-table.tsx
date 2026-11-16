import type { ReactNode } from 'react'
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Inbox, Loader2, RefreshCw } from 'lucide-react'
import { Button, cn } from './primitives'

export function SortHead({
  label,
  field,
  sort,
  onSort,
  align = 'left',
  className = '',
}: {
  label: ReactNode
  field?: string
  sort?: { field: string; dir: 'asc' | 'desc' }
  onSort?: (next: { field: string; dir: 'asc' | 'desc' }) => void
  align?: 'left' | 'right'
  className?: string
}) {
  const active = sort?.field === field
  const dir = active ? sort?.dir : null
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown

  if (!field || !onSort) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground',
          align === 'right' && 'ml-auto',
          className,
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() =>
        onSort({
          field,
          dir: active && dir === 'asc' ? 'desc' : 'asc',
        })
      }
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none',
        align === 'right' && 'ml-auto',
        active && 'text-foreground',
        className,
      )}
    >
      <span>{label}</span>
      <Icon className={cn('size-3', active ? 'text-foreground' : 'opacity-50')} />
    </button>
  )
}

export function Pager({
  page,
  perPage,
  total,
  onPage,
  onPerPage,
}: {
  page: number
  perPage: number
  total: number
  onPage: (next: number) => void
  onPerPage?: (next: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  const start = total === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(total, page * perPage)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="tabular-nums">
          Menampilkan <strong className="font-medium text-foreground">{start}</strong>–
          <strong className="font-medium text-foreground">{end}</strong> dari{' '}
          <strong className="font-medium text-foreground">{total}</strong> data
        </span>
        {onPerPage && (
          <select
            value={perPage}
            onChange={(e) => onPerPage(Number(e.target.value))}
            aria-label="Jumlah baris per halaman"
            className="h-6 rounded-md border border-border bg-card px-1.5 text-[11px] text-foreground focus:outline-none"
          >
            {[10, 15, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} / hal
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="xs"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Sebelumnya
        </Button>
        <span className="px-2 font-mono text-[11px] tabular-nums">
          {page} / {pages}
        </span>
        <Button
          size="xs"
          variant="outline"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}

export function RefreshButton({
  loading,
  onClick,
  label = 'Segarkan',
  size = 'sm',
  className,
}: {
  loading?: boolean
  onClick?: () => void
  label?: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  return (
    <Button
      variant="outline"
      size={size}
      disabled={loading}
      onClick={onClick}
      className={className}
    >
      <RefreshCw className={cn(size === 'xs' ? 'size-3' : 'size-3.5', loading && 'animate-spin')} />
      {label}
    </Button>
  )
}

export function DataState({
  loading,
  fetching,
  error,
  empty,
  emptyTitle = 'Belum ada data tercatat',
  emptyDescription = 'Data akan tampil di sini setelah ditambahkan atau filter disesuaikan.',
  emptyAction,
  onRetry,
  rows = 5,
  children,
}: {
  loading?: boolean
  fetching?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  onRetry?: () => void
  rows?: number
  children: ReactNode
}) {
  if (loading || (fetching && empty)) {
    return (
      <div className="divide-y divide-border p-3 space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 pt-2.5 first:pt-0">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="skeleton size-6 rounded-md shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-md">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
            <div className="skeleton h-5 w-20 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
          <AlertCircle className="size-4" />
        </span>
        <div className="max-w-md space-y-0.5">
          <h4 className="text-xs font-semibold text-foreground">Gagal memuat data dari server</h4>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            <RefreshCw className="size-3.5" />
            Muat Ulang
          </Button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground">
          <Inbox className="size-4" />
        </span>
        <div className="max-w-md space-y-0.5">
          <h4 className="text-xs font-semibold text-foreground">{emptyTitle}</h4>
          <p className="text-xs text-muted-foreground">{emptyDescription}</p>
        </div>
        {emptyAction && <div className="mt-1">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="relative">
      {fetching && (
        <>
          <div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-muted">
            <div className="fetch-bar h-full w-1/3 bg-foreground" />
          </div>
          <div
            aria-live="polite"
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/65 backdrop-blur-[1px]"
          >
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-xs">
              <Loader2 className="size-3.5 animate-spin text-foreground" />
              <span>Memuat data terbaru...</span>
            </div>
          </div>
        </>
      )}
      {children}
    </div>
  )
}
