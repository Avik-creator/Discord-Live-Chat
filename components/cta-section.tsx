import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center sm:px-16">
          {/* Glow effect */}
          <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-64 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

          <h2 className="mx-auto max-w-lg font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Ready to talk to customers from Discord?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            Set up Bridgecord in under 5 minutes. Your first site is free, forever.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8" asChild>
              <Link href="/login">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary" asChild>
              <Link href="/login">Talk to Us on Discord</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
