export default function ProjectLoading() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 animate-pulse-soft bg-muted/60" />
        <span className="text-[10px] text-muted-foreground/40">/</span>
        <div className="h-2 w-24 animate-pulse-soft bg-muted" />
      </div>

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-40 animate-pulse-soft bg-muted" />
          <div className="h-2 w-56 animate-pulse-soft bg-muted/60" style={{ animationDelay: "100ms" }} />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse-soft bg-muted" />
          <div className="h-8 w-20 animate-pulse-soft bg-muted" />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 border border-border bg-card p-4">
            <div
              className="h-2 w-20 animate-pulse-soft bg-muted/60"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <div
              className="h-4 w-12 animate-pulse-soft bg-muted"
              style={{ animationDelay: `${i * 80 + 40}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Conversation list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border border-border bg-card p-4"
          >
            <div
              className="h-8 w-8 animate-pulse-soft bg-muted"
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <div className="flex-1 space-y-1.5">
              <div
                className="h-2.5 w-32 animate-pulse-soft bg-muted"
                style={{ animationDelay: `${i * 60 + 30}ms` }}
              />
              <div
                className="h-2 w-48 animate-pulse-soft bg-muted/50"
                style={{ animationDelay: `${i * 60 + 60}ms` }}
              />
            </div>
            <div className="h-2 w-16 animate-pulse-soft bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}
