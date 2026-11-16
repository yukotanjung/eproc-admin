import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export type ButtonVariant = 'primary' | 'outline' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'icon' | 'iconSm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = 'outline',
  size = 'sm',
  className = '',
  children,
  type = 'button',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'group relative inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition duration-200 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
    outline: 'border border-border bg-card text-foreground shadow-xs hover:bg-accent/50',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
    destructive: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  }
  const sizes: Record<ButtonSize, string> = {
    xs: 'h-6 px-2 text-xs gap-1 rounded-md [&_svg]:size-3.5',
    sm: 'h-7 px-2.5 text-sm gap-1.5 [&_svg]:size-4',
    md: 'h-8 px-3 text-sm gap-1.5 [&_svg]:size-4',
    icon: 'size-7 p-0 [&_svg]:size-4',
    iconSm: 'size-6 p-0 rounded-md [&_svg]:size-3.5',
  }
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}

export type BadgeTone =
  | 'neutral'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'indigo'
  | 'dark'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: 'xs' | 'sm' | 'md'
}

export function Badge({
  tone = 'neutral',
  size = 'sm',
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'border-neutral-200 bg-neutral-100 text-neutral-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    dark: 'border-neutral-900 bg-neutral-900 text-white',
  }
  const sizes = {
    xs: 'h-4 px-1 text-[10px]',
    sm: 'h-[18px] px-1.5 text-[10px]',
    md: 'h-5 px-2 text-[11px]',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium leading-none tracking-tight whitespace-nowrap',
        tones[tone],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

export function DotBadge({
  tone = 'emerald',
  children,
  className = '',
}: {
  tone?: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'neutral'
  children: ReactNode
  className?: string
}) {
  const dots = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
    neutral: 'bg-neutral-400',
  }
  return (
    <Badge tone={tone} className={className}>
      <span className={cn('size-1.5 rounded-full', dots[tone])} />
      {children}
    </Badge>
  )
}

export function StatusBadge({ status }: { status?: string | boolean | null }) {
  if (typeof status === 'boolean') {
    return status ? (
      <DotBadge tone="emerald">Aktif</DotBadge>
    ) : (
      <DotBadge tone="neutral">Nonaktif</DotBadge>
    )
  }

  const normalized = (status || 'draft').toLowerCase()
  const map: Record<string, { tone: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'neutral'; label: string }> = {
    active: { tone: 'emerald', label: 'Aktif' },
    published: { tone: 'emerald', label: 'Tayang' },
    completed: { tone: 'emerald', label: 'Selesai' },
    verified: { tone: 'emerald', label: 'Terverifikasi' },
    ongoing: { tone: 'sky', label: 'Berjalan' },
    in_progress: { tone: 'sky', label: 'Berjalan' },
    draft: { tone: 'amber', label: 'Draf' },
    pending: { tone: 'amber', label: 'Menunggu' },
    cancelled: { tone: 'rose', label: 'Dibatalkan' },
    canceled: { tone: 'rose', label: 'Dibatalkan' },
    failed: { tone: 'rose', label: 'Gagal' },
    inactive: { tone: 'neutral', label: 'Nonaktif' },
  }
  const meta = map[normalized] ?? { tone: 'neutral', label: status || 'Draf' }
  return <DotBadge tone={meta.tone}>{meta.label}</DotBadge>
}

export function IconTile({
  tone = 'neutral',
  size = 'md',
  children,
  className = '',
}: {
  tone?: 'neutral' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'indigo' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}) {
  const tones = {
    neutral: 'border-border bg-muted/50 text-muted-foreground',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-600',
    rose: 'border-rose-200 bg-rose-50 text-rose-600',
    sky: 'border-sky-200 bg-sky-50 text-sky-600',
    violet: 'border-violet-200 bg-violet-50 text-violet-600',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-600',
    dark: 'border-neutral-900 bg-neutral-900 text-white',
  }
  const sizes = {
    sm: 'size-6 rounded-md [&_svg]:size-3.5',
    md: 'size-7 rounded-md [&_svg]:size-3.5',
    lg: 'size-8 rounded-lg [&_svg]:size-4',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center border',
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Frame({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('frame flex flex-col', className)} {...rest}>
      {children}
    </div>
  )
}

export function Panel({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...rest}>
      {children}
    </div>
  )
}

export function FrameHeader({
  icon: Icon,
  title,
  count,
  subtitle,
  right,
  className = '',
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: ReactNode
  count?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('frame-head flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="size-3.5 text-muted-foreground shrink-0" />}
        <h3 className="text-xs font-medium text-foreground truncate">{title}</h3>
        {count !== undefined && (
          <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            · {subtitle}
          </span>
        )}
      </div>
      {right && <div className="flex items-center gap-1.5 flex-wrap">{right}</div>}
    </div>
  )
}

export function Dot() {
  return (
    <span aria-hidden="true" className="text-neutral-300 select-none">
      ·
    </span>
  )
}

export function Separator({ className = 'h-3.5' }: { className?: string }) {
  return <div className={cn('w-px bg-border shrink-0', className)} />
}

export function LiveDot({ tone = 'emerald' }: { tone?: 'emerald' | 'amber' | 'rose' }) {
  const map = {
    emerald: ['bg-emerald-400', 'bg-emerald-500'],
    amber: ['bg-amber-400', 'bg-amber-500'],
    rose: ['bg-rose-400', 'bg-rose-500'],
  }[tone]
  return (
    <span className="relative flex size-2">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          map[0],
        )}
      />
      <span className={cn('relative inline-flex size-2 rounded-full', map[1])} />
    </span>
  )
}

export function Avatar({
  name = '',
  src,
  size = 'sm',
  tone = 'neutral',
}: {
  name?: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  tone?: 'neutral' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'dark'
}) {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  const sizes = {
    xs: 'size-4 text-[9px]',
    sm: 'size-5 text-[10px]',
    md: 'size-6 text-[11px]',
    lg: 'size-8 text-xs',
  }
  const tones = {
    neutral: 'bg-neutral-200 text-neutral-700',
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-800',
    sky: 'bg-sky-100 text-sky-800',
    violet: 'bg-violet-100 text-violet-800',
    dark: 'bg-neutral-900 text-white',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('inline-block shrink-0 rounded-full object-cover border border-border', sizes[size])}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none select-none',
        sizes[size],
        tones[tone],
      )}
    >
      {initials || '?'}
    </span>
  )
}

export function OrgMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'size-4 rounded [&_svg]:size-2.5',
    md: 'size-5 rounded-md [&_svg]:size-3',
    lg: 'size-8 rounded-lg [&_svg]:size-4',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-neutral-900 text-white',
        sizes[size],
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </span>
  )
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel = 'Pilih baris',
}: {
  checked?: boolean
  indeterminate?: boolean
  onChange?: (next: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-label={ariaLabel}
      aria-checked={indeterminate ? 'mixed' : !!checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange?.(!checked)
      }}
      className={cn(
        'inline-flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        checked || indeterminate
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-300 bg-white hover:border-neutral-400',
      )}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2 rounded-full bg-white" />
      ) : checked ? (
        <Check className="size-2.5 stroke-[3]" />
      ) : null}
    </button>
  )
}

export function Switch({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked?: boolean
  onChange?: (next: boolean) => void
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        checked ? 'bg-neutral-900' : 'bg-neutral-200 hover:bg-neutral-300',
      )}
    >
      <span
        className={cn(
          'inline-block size-3 rounded-full bg-white shadow-xs transition-transform',
          checked ? 'translate-x-3.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function Bar({
  value = 0,
  tone = 'dark',
  className = '',
}: {
  value?: number
  tone?: 'dark' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'
  className?: string
}) {
  const tones = {
    dark: 'bg-neutral-900',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
  }
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-neutral-100', className)}>
      <div
        className={cn('h-full rounded-full transition-all', tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Ring({
  value = 0,
  size = 16,
  stroke = 2.25,
  tone = 'emerald',
}: {
  value?: number
  size?: number
  stroke?: number
  tone?: 'emerald' | 'amber' | 'rose' | 'sky' | 'dark'
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c
  const tones = {
    emerald: 'stroke-emerald-500',
    amber: 'stroke-amber-500',
    rose: 'stroke-rose-500',
    sky: 'stroke-sky-500',
    dark: 'stroke-neutral-900',
  }
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-neutral-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={tones[tone]}
      />
    </svg>
  )
}

export function TimeBadge({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
      {children}
    </span>
  )
}

export function StatTile({
  icon: Icon,
  tone = 'neutral',
  label,
  value,
  sub,
}: {
  icon?: React.ComponentType<{ className?: string }>
  tone?: 'neutral' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'indigo' | 'dark'
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <Panel className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
        {Icon && (
          <IconTile tone={tone} size="sm">
            <Icon />
          </IconTile>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="text-xl font-semibold tracking-tight text-foreground tabular-nums truncate">
          {value}
        </div>
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground truncate">{sub}</div>}
    </Panel>
  )
}
