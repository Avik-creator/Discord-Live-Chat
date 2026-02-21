export default function WidgetLoading() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="h-8 w-8 animate-pulse-soft bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-24 animate-pulse-soft bg-muted" />
          <div className="h-1.5 w-16 animate-pulse-soft bg-muted/50" style={{ animationDelay: "80ms" }} />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-3 p-4">
        <div className="flex justify-start">
          <div className="w-3/4 space-y-1.5">
            <div className="animate-pulse-soft bg-muted/30 p-3">
              <div className="h-2 w-full bg-muted/20" />
              <div className="mt-1.5 h-2 w-2/3 bg-muted/15" />
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-border p-3">
        <div className="h-9 flex-1 animate-pulse-soft bg-muted/20" />
        <div className="h-9 w-9 animate-pulse-soft bg-muted/40" />
      </div>
    </div>
  )
}
