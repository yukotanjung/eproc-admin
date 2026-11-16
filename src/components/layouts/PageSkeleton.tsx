export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-5 w-44 rounded-md" />
          <div className="skeleton h-3.5 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="skeleton h-7 w-24 rounded-lg" />
          <div className="skeleton h-7 w-28 rounded-lg" />
        </div>
      </div>

      <div className="frame p-1">
        <div className="frame-head flex items-center justify-between">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-6 w-48 rounded-lg" />
        </div>
        <div className="panel divide-y divide-border p-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 pt-3 first:pt-0">
              <div className="flex items-center gap-2.5 flex-1">
                <div className="skeleton size-7 rounded-md shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="skeleton h-3.5 w-3/4 rounded" />
                  <div className="skeleton h-2.5 w-1/2 rounded" />
                </div>
              </div>
              <div className="skeleton h-5 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
