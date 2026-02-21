export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-10 w-10 items-center justify-center border border-border bg-card">
          <div className="h-2 w-2 animate-pulse-soft bg-foreground" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-2 w-24 animate-pulse-soft bg-muted" />
          <div className="h-1.5 w-16 animate-pulse-soft bg-muted/60" style={{ animationDelay: "150ms" }} />
        </div>
      </div>
    </div>
  )
}
