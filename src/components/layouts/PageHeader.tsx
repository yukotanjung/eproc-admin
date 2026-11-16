import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-xs text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-1.5 flex-wrap">{actions}</div>}
    </div>
  )
}
