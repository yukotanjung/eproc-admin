import type { FormEvent, ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { Button, cn } from './primitives'

export function usePresence(open: boolean, duration = 200) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
    } else if (mounted) {
      setClosing(true)
      const t = setTimeout(() => {
        setMounted(false)
        setClosing(false)
      }, duration)
      return () => clearTimeout(t)
    }
  }, [open, duration, mounted])

  return { mounted, state: closing ? 'closed' : 'open' }
}

export function Floating({
  open,
  onClose,
  children,
  align = 'right',
  className = '',
}: {
  open: boolean
  onClose?: () => void
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { mounted, state } = usePresence(open, 140)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose?.()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!mounted) return null
  return (
    <div
      ref={ref}
      data-state={state}
      className={cn(
        'pop-in absolute z-40 mt-1.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose?: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const { mounted, state } = usePresence(open, 190)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div
      data-state={state}
      className="backdrop-fade fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-4 pt-[10vh] backdrop-blur-[1.5px] overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-state={state}
        className={cn(
          'dialog-pop w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl my-auto',
          sizes[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
              {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <div className="p-4 text-xs max-h-[72vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-4 py-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose?: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  width?: string
}) {
  const { mounted, state } = usePresence(open, 240)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null
  return (
    <div
      data-state={state}
      className="backdrop-fade fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1.5px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-state={state}
        className={cn(
          'sheet-slide flex h-full w-full flex-col border-l border-border bg-card shadow-2xl',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {subtitle && (
              <div className="font-mono text-[11px] text-muted-foreground">{subtitle}</div>
            )}
            {title && <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-xs">{children}</div>
        {footer && (
          <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function FormDialog({
  open,
  onClose,
  title,
  description,
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  tone = 'primary',
  onSubmit,
  size = 'md',
  loading = false,
  children,
}: {
  open: boolean
  onClose?: () => void
  title?: ReactNode
  description?: ReactNode
  submitLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'destructive'
  onSubmit?: () => void | Promise<void>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  children?: ReactNode
}) {
  const handle = (e: FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'primary'}
            size="sm"
            type="submit"
            form="dialog-form"
            loading={loading}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="dialog-form" onSubmit={handle} noValidate className="space-y-3">
        {children}
      </form>
    </Dialog>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  tone = 'destructive',
  onConfirm,
  loading = false,
}: {
  open: boolean
  onClose?: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  tone?: 'primary' | 'destructive'
  onConfirm?: () => void | Promise<void>
  loading?: boolean
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'primary'}
            size="sm"
            loading={loading}
            onClick={() => {
              onConfirm?.()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-xs text-muted-foreground">
        Pastikan tindakan ini sudah benar sebelum melanjutkan.
      </p>
    </Dialog>
  )
}

export interface MenuItem {
  type?: 'item' | 'sep'
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  tone?: 'default' | 'destructive'
  onSelect?: () => void
}

export function Menu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { mounted, state } = usePresence(open, 140)

  const updatePosition = useCallback(() => {
    const triggerEl = ref.current
    const menuEl = menuRef.current
    if (!triggerEl || !menuEl) return

    const rect = triggerEl.getBoundingClientRect()
    const menuWidth = menuEl.offsetWidth || 175
    const menuHeight = menuEl.offsetHeight || 0
    const gap = 4
    const padding = 8

    const rawLeft = align === 'right' ? rect.right - menuWidth : rect.left
    const left = Math.max(padding, Math.min(rawLeft, window.innerWidth - menuWidth - padding))

    let top = rect.bottom + gap
    if (top + menuHeight > window.innerHeight - padding && rect.top - menuHeight - gap >= padding) {
      top = rect.top - menuHeight - gap
    }

    setCoords({ top, left })
  }, [align])

  useLayoutEffect(() => {
    if (!mounted) {
      setCoords(null)
      return
    }
    updatePosition()
  }, [mounted, updatePosition])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  return (
    <div ref={ref} className="relative inline-block">
      <div
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {trigger}
      </div>
      {mounted &&
        createPortal(
          <div
            ref={menuRef}
            data-state={state}
            style={
              coords
                ? { top: coords.top, left: coords.left }
                : { top: 0, left: 0, visibility: 'hidden' }
            }
            className="pop-in fixed z-50 min-w-[175px] rounded-lg border border-border bg-popover p-1 shadow-lg"
          >
            {items.map((it, i) =>
              it.type === 'sep' ? (
                <div key={i} className="my-1 h-px bg-border" />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpen(false)
                    it.onSelect?.()
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition cursor-pointer',
                    it.tone === 'destructive'
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-foreground hover:bg-accent',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {it.icon && <it.icon className="size-3.5 text-muted-foreground" />}
                    {it.label}
                  </span>
                  {it.shortcut && (
                    <kbd className="font-mono text-[10px] text-muted-foreground">{it.shortcut}</kbd>
                  )}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

export interface ToastItem {
  id: number
  title: string
  description?: string
  tone?: 'success' | 'warn' | 'error' | 'info'
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, 'id'> | string) => void
  dismiss: (id: number) => void
}

const ToastCtx = createContext<ToastContextValue>({
  push: () => {},
  dismiss: () => {},
})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((toast: Omit<ToastItem, 'id'> | string) => {
    const id = Date.now() + Math.random()
    const entry: ToastItem =
      typeof toast === 'string'
        ? { id, title: toast, tone: 'success' }
        : { id, tone: 'success', ...toast }
    setToasts((prev) => [...prev, entry])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 3600)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={{ push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-3 right-3 z-[60] flex w-80 flex-col gap-1.5">
        {toasts.map((t) => {
          const tones = {
            success: { icon: Check, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
            warn: { icon: TriangleAlert, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
            error: { icon: TriangleAlert, cls: 'border-rose-200 bg-rose-50 text-rose-700' },
            info: { icon: Info, cls: 'border-sky-200 bg-sky-50 text-sky-700' },
          }[t.tone || 'success']
          const Icon = tones.icon
          return (
            <div
              key={t.id}
              className="pop-in pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 shadow-lg"
            >
              <span
                className={cn(
                  'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-md border',
                  tones.cls,
                )}
              >
                <Icon className="size-3" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground">{t.title}</div>
                {t.description && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{t.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
