export default function SettingsLoading() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-28 animate-pulse-soft bg-muted" />
        <div className="h-2 w-52 animate-pulse-soft bg-muted/60" style={{ animationDelay: "100ms" }} />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border-b border-border pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 animate-pulse-soft bg-muted/40"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>

      {/* Card skeleton */}
      <div className="flex flex-col gap-5 border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse-soft bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-32 animate-pulse-soft bg-muted" />
            <div className="h-2 w-48 animate-pulse-soft bg-muted/50" />
          </div>
        </div>
        <div className="h-px bg-border" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div
              className="h-2 w-16 animate-pulse-soft bg-muted/60"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <div
              className="h-9 w-full animate-pulse-soft bg-muted/30"
              style={{ animationDelay: `${i * 80 + 40}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
