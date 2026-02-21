export default function InstallLoading() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-36 animate-pulse-soft bg-muted" />
        <div className="h-2 w-64 animate-pulse-soft bg-muted/60" style={{ animationDelay: "100ms" }} />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border-b border-border pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-16 animate-pulse-soft bg-muted/40"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* Code block skeleton */}
      <div className="border border-border bg-card p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-2 animate-pulse-soft bg-muted/30"
            style={{
              width: `${40 + Math.random() * 50}%`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
