import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-8 text-center animate-fade-in-up">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center border border-border bg-card">
            <span className="text-lg font-bold tracking-tighter text-foreground">
              {"404"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Page not found
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="border border-border bg-card px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-accent"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="bg-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-background transition-opacity hover:opacity-80"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
