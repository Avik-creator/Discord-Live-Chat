import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="border border-border bg-card px-8 py-16 text-center sm:px-16">
          <h2 className="mx-auto max-w-lg text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            Ready to talk to customers from Discord?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Set up Bridgecord in under 5 minutes. Your first site is free,
            forever.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 text-xs" asChild>
              <Link href="/login">
                Get Started Free
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-xs"
              asChild
            >
              <Link href="/login">Talk to Us on Discord</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
