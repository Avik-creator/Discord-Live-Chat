export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 animate-pulse-soft bg-muted" />
          <div className="h-2 w-48 animate-pulse-soft bg-muted/60" style={{ animationDelay: "100ms" }} />
        </div>
        <div className="h-8 w-28 animate-pulse-soft bg-muted" />
      </div>

      <div className="h-px bg-border" />

      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 animate-pulse-soft bg-muted"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div className="flex-1 space-y-1.5">
                <div
                  className="h-2.5 w-24 animate-pulse-soft bg-muted"
                  style={{ animationDelay: `${i * 100 + 50}ms` }}
                />
                <div
                  className="h-2 w-36 animate-pulse-soft bg-muted/60"
                  style={{ animationDelay: `${i * 100 + 100}ms` }}
                />
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <div className="h-2 w-20 animate-pulse-soft bg-muted/50" />
              <div className="h-2 w-14 animate-pulse-soft bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
