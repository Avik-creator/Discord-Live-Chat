export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 border border-border bg-card p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse-soft bg-muted" />
          <div className="h-3 w-24 animate-pulse-soft bg-muted" style={{ animationDelay: "80ms" }} />
          <div className="h-2 w-40 animate-pulse-soft bg-muted/50" style={{ animationDelay: "160ms" }} />
        </div>
        <div className="h-px bg-border" />
        <div className="space-y-3">
          <div className="h-9 w-full animate-pulse-soft bg-muted/30" />
          <div className="h-9 w-full animate-pulse-soft bg-muted/30" style={{ animationDelay: "60ms" }} />
        </div>
      </div>
    </div>
  )
}
