import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { cn } from './primitives'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

interface ParsedDateValue {
  datePart: string // YYYY-MM-DD
  year: number
  month: number // 0-11
  day: number
  hours: number
  minutes: number
}

function parseValue(raw: string | null | undefined): ParsedDateValue | null {
  if (!raw) return null
  const normalized = raw.trim().replace(' ', 'T')
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2]) - 1
    const day = Number(match[3])
    const hours = match[4] !== undefined ? Number(match[4]) : 0
    const minutes = match[5] !== undefined ? Number(match[5]) : 0
    const d = new Date(year, month, day)
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return {
        datePart: toIsoDate(year, month, day),
        year,
        month,
        day,
        hours: Math.min(23, Math.max(0, hours)),
        minutes: Math.min(59, Math.max(0, minutes)),
      }
    }
  }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return {
    datePart: toIsoDate(d.getFullYear(), d.getMonth(), d.getDate()),
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  }
}

function formatDisplay(parsed: ParsedDateValue, mode: 'date' | 'datetime'): string {
  const dateLabel = `${pad2(parsed.day)} ${SHORT_MONTHS[parsed.month]} ${parsed.year}`
  if (mode === 'datetime') {
    return `${dateLabel}, ${pad2(parsed.hours)}:${pad2(parsed.minutes)}`
  }
  return dateLabel
}

interface CalendarCell {
  year: number
  month: number
  day: number
  iso: string
  inMonth: boolean
}

function buildCalendarGrid(viewYear: number, viewMonth: number): CalendarCell[] {
  const firstDay = new Date(viewYear, viewMonth, 1)
  // Monday = 0 ... Sunday = 6
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()

  const cells: CalendarCell[] = []

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const prev = new Date(viewYear, viewMonth - 1, d)
    cells.push({
      year: prev.getFullYear(),
      month: prev.getMonth(),
      day: d,
      iso: toIsoDate(prev.getFullYear(), prev.getMonth(), d),
      inMonth: false,
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      year: viewYear,
      month: viewMonth,
      day: d,
      iso: toIsoDate(viewYear, viewMonth, d),
      inMonth: true,
    })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const next = new Date(viewYear, viewMonth + 1, d)
    cells.push({
      year: next.getFullYear(),
      month: next.getMonth(),
      day: d,
      iso: toIsoDate(next.getFullYear(), next.getMonth(), d),
      inMonth: false,
    })
  }

  return cells
}

export interface DatePickerProps {
  value: string | null | undefined
  onChange: (value: string) => void
  mode?: 'date' | 'datetime'
  placeholder?: string
  error?: string | null
  'aria-invalid'?: boolean
  'aria-label'?: string
  disabled?: boolean
  clearable?: boolean
  size?: 'sm' | 'md'
  minDate?: string
  maxDate?: string
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  mode = 'date',
  placeholder,
  error,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  disabled = false,
  clearable = false,
  size = 'md',
  minDate,
  maxDate,
  className = '',
  id,
}: DatePickerProps) {
  const parsed = useMemo(() => parseValue(value), [value])
  const today = useMemo(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      iso: toIsoDate(now.getFullYear(), now.getMonth(), now.getDate()),
      hours: now.getHours(),
      minutes: now.getMinutes(),
    }
  }, [])

  const [open, setOpen] = useState(false)
  const [pickerView, setPickerView] = useState<'days' | 'months'>('days')
  const [viewYear, setViewYear] = useState(() => parsed?.year ?? today.year)
  const [viewMonth, setViewMonth] = useState(() => parsed?.month ?? today.month)
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'bottom' | 'top' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const syncViewToValue = useCallback(() => {
    const p = parseValue(value)
    setViewYear(p?.year ?? today.year)
    setViewMonth(p?.month ?? today.month)
    setPickerView('days')
  }, [value, today.month, today.year])

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const popoverWidth = 276
    const popoverHeight = mode === 'datetime' ? 356 : 308
    const margin = 6

    const spaceBelow = window.innerHeight - rect.bottom
    const placement = spaceBelow < popoverHeight + margin && rect.top > popoverHeight + margin ? 'top' : 'bottom'
    const top =
      placement === 'bottom'
        ? Math.min(window.innerHeight - popoverHeight - 8, rect.bottom + margin)
        : Math.max(8, rect.top - popoverHeight - margin)
    const left = Math.max(8, Math.min(window.innerWidth - popoverWidth - 8, rect.left))

    setPos({ top, left, placement })
  }, [mode])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const cells = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const emitDate = (isoDate: string, hours?: number, minutes?: number) => {
    if (mode === 'datetime') {
      const h = hours ?? parsed?.hours ?? 0
      const m = minutes ?? parsed?.minutes ?? 0
      onChange(`${isoDate}T${pad2(h)}:${pad2(m)}`)
    } else {
      onChange(isoDate)
    }
  }

  const handleSelectDay = (cell: CalendarCell) => {
    emitDate(cell.iso)
    if (mode === 'date') {
      setOpen(false)
    } else {
      setViewYear(cell.year)
      setViewMonth(cell.month)
    }
  }

  const handleTimeChange = (nextHours: number, nextMinutes: number) => {
    const baseIso = parsed?.datePart ?? today.iso
    emitDate(
      baseIso,
      Math.min(23, Math.max(0, Number.isNaN(nextHours) ? 0 : nextHours)),
      Math.min(59, Math.max(0, Number.isNaN(nextMinutes) ? 0 : nextMinutes)),
    )
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleToday = () => {
    setViewYear(today.year)
    setViewMonth(today.month)
    setPickerView('days')
    if (mode === 'datetime') {
      emitDate(today.iso, parsed?.hours ?? today.hours, parsed?.minutes ?? today.minutes)
    } else {
      emitDate(today.iso)
      setOpen(false)
    }
  }

  const isInvalid = Boolean(error) || Boolean(ariaInvalid)
  const resolvedPlaceholder = placeholder ?? (mode === 'datetime' ? 'Pilih tanggal & waktu' : 'Pilih tanggal')

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={isInvalid}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return
          if (!open) syncViewToValue()
          setOpen((v) => !v)
        }}
        className={cn(
          'flex w-full items-center justify-between gap-2 border border-border bg-white text-left text-foreground transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:bg-neutral-100 disabled:text-muted-foreground',
          size === 'sm' ? 'h-7 rounded-md px-2 text-[11px]' : 'h-8 rounded-lg px-2.5 text-xs',
          isInvalid && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
          open && !isInvalid && 'border-neutral-400 ring-2 ring-ring/30',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              'truncate font-mono tabular-nums',
              !parsed && 'font-sans text-muted-foreground',
            )}
          >
            {parsed ? formatDisplay(parsed, mode) : resolvedPlaceholder}
          </span>
        </span>
        {clearable && parsed && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Hapus tanggal"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-3" />
          </span>
        ) : (
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Pilih tanggal"
            // Prevent React synthetic click events inside the portal from bubbling to wrapping <label> in FieldLabel.
            onClick={(e) => e.stopPropagation()}
            style={{ top: pos.top, left: pos.left, width: 276 }}
            data-placement={pos.placement}
            className="pop-in fixed z-[60] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
          >
            <div className="mb-2.5 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() =>
                  pickerView === 'months' ? setViewYear((y) => y - 1) : handlePrevMonth()
                }
                aria-label={pickerView === 'months' ? 'Tahun sebelumnya' : 'Bulan sebelumnya'}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPickerView((v) => (v === 'days' ? 'months' : 'days'))}
                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-foreground hover:bg-accent transition"
              >
                <span>{pickerView === 'days' ? `${MONTHS[viewMonth]} ${viewYear}` : viewYear}</span>
                <ChevronDown
                  className={cn(
                    'size-3 text-muted-foreground transition-transform',
                    pickerView === 'months' && 'rotate-180',
                  )}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  pickerView === 'months' ? setViewYear((y) => y + 1) : handleNextMonth()
                }
                aria-label={pickerView === 'months' ? 'Tahun berikutnya' : 'Bulan berikutnya'}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {pickerView === 'months' ? (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {SHORT_MONTHS.map((label, idx) => {
                  const active = idx === viewMonth
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx)
                        setPickerView('days')
                      }}
                      className={cn(
                        'h-8 rounded-md text-xs font-medium transition',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                <div className="mb-1 grid grid-cols-7 text-center">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-0.5">
                  {cells.map((cell) => {
                    const isSelected = parsed?.datePart === cell.iso
                    const isToday = today.iso === cell.iso
                    const isOutOfRange =
                      (Boolean(minDate) && cell.iso < minDate!) ||
                      (Boolean(maxDate) && cell.iso > maxDate!)

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        disabled={isOutOfRange}
                        onClick={() => handleSelectDay(cell)}
                        aria-label={cell.iso}
                        aria-pressed={isSelected}
                        className={cn(
                          'mx-auto inline-flex size-8 items-center justify-center rounded-md text-xs tabular-nums transition',
                          !cell.inMonth && !isSelected && 'text-muted-foreground/45',
                          cell.inMonth && !isSelected && 'text-foreground hover:bg-accent',
                          isToday && !isSelected && 'ring-1 ring-neutral-300 font-semibold',
                          isSelected && 'bg-primary text-primary-foreground font-medium',
                          isOutOfRange && 'opacity-35 pointer-events-none',
                        )}
                      >
                        {cell.day}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {mode === 'datetime' && (
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Clock className="size-3.5" />
                  Waktu
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    aria-label="Jam"
                    value={pad2(parsed?.hours ?? 0)}
                    onChange={(e) =>
                      handleTimeChange(Number(e.target.value), parsed?.minutes ?? 0)
                    }
                    className="h-7 w-11 rounded-md border border-border bg-white text-center font-mono text-xs tabular-nums text-foreground focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <span className="text-xs font-medium text-muted-foreground">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    aria-label="Menit"
                    value={pad2(parsed?.minutes ?? 0)}
                    onChange={(e) =>
                      handleTimeChange(parsed?.hours ?? 0, Number(e.target.value))
                    }
                    className="h-7 w-11 rounded-md border border-border bg-white text-center font-mono text-xs tabular-nums text-foreground focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2">
              <button
                type="button"
                onClick={handleToday}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-foreground hover:bg-accent transition"
              >
                Hari ini
              </button>
              <div className="flex items-center gap-1">
                {clearable && parsed && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('')
                      setOpen(false)
                    }}
                    className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition"
                  >
                    Hapus
                  </button>
                )}
                {mode === 'datetime' && (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition"
                  >
                    Selesai
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
