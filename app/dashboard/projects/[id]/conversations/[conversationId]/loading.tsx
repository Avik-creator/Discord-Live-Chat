export default function ConversationLoading() {
  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-8 w-8 animate-pulse-soft bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-28 animate-pulse-soft bg-muted" />
          <div className="h-2 w-20 animate-pulse-soft bg-muted/50" style={{ animationDelay: "80ms" }} />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 py-6">
        {Array.from({ length: 5 }).map((_, i) => {
          const isVisitor = i % 2 === 0
          return (
            <div
              key={i}
              className={`flex ${isVisitor ? "justify-start" : "justify-end"}`}
            >
              <div
                className="space-y-1.5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`animate-pulse-soft ${
                    isVisitor ? "bg-muted/40" : "bg-muted/60"
                  } p-3`}
                  style={{
                    width: `${120 + Math.random() * 120}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  <div className="h-2 w-full bg-muted/30" />
                  {i !== 2 && <div className="mt-1.5 h-2 w-3/4 bg-muted/20" />}
                </div>
                <div
                  className="h-1.5 w-10 animate-pulse-soft bg-muted/20"
                  style={{ animationDelay: `${i * 100 + 50}ms` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Input skeleton */}
      <div className="flex gap-2 border-t border-border pt-4">
        <div className="h-9 flex-1 animate-pulse-soft bg-muted/30" />
        <div className="h-9 w-9 animate-pulse-soft bg-muted" />
      </div>
    </div>
  )
}
