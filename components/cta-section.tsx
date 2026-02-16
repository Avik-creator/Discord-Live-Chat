"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect } from "react"

interface CtaSectionProps {
  isLoggedIn?: boolean
}

export function CtaSection({ isLoggedIn = false }: CtaSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="border-t border-border py-24 lg:py-32" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <div className={`border border-border bg-card px-8 py-16 text-center sm:px-16 transition-all duration-700 ${visible ? "animate-scale-in" : "opacity-0"}`}>
          <h2 className="mx-auto max-w-lg text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            Ready to talk to customers from Discord?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Set up Bridgecord in under 5 minutes. Your first site is free,
            forever.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Button size="lg" className="group gap-2 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]" asChild>
                <Link href="/dashboard">
                  Go to Projects
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="group gap-2 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]" asChild>
                  <Link href="/login">
                    Get Started Free
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  asChild
                >
                  <Link href="/login">Talk to Us on Discord</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
