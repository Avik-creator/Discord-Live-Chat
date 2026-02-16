import { MessageSquare } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center bg-foreground">
              <MessageSquare className="h-2.5 w-2.5 text-background" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
              Bridgecord
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] text-muted-foreground">
            <a
              href="#"
              className="transition-colors hover:text-foreground"
            >
              Documentation
            </a>
            <a
              href="#"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="#"
              className="transition-colors hover:text-foreground"
            >
              Discord
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
          </div>

          <p className="text-[10px] text-muted-foreground">
            {"© 2026 Bridgecord. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}
