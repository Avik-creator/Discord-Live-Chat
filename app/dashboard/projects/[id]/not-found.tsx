import Link from "next/link"

export default function ProjectNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex max-w-xs flex-col items-center gap-6 text-center animate-fade-in-up">
        <div className="flex h-12 w-12 items-center justify-center border border-border bg-card">
          <span className="text-xs font-bold tracking-tighter text-muted-foreground">
            {"?"}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Project not found
          </h1>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            This project does not exist, was deleted, or you do not have access
            to it.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="bg-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-background transition-opacity hover:opacity-80"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
