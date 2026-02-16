"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatDemo } from "@/components/chat-demo"

interface HeroProps {
  isLoggedIn?: boolean
}

export function Hero({ isLoggedIn = false }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left column */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 bg-foreground" />
              Now in public beta
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
              Live chat that lives in Discord
            </h1>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground lg:text-base">
              Your visitors ask a question on your site. You answer from
              Discord. No dashboards, no extra tools, no context switching.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {isLoggedIn ? (
                <Button size="lg" className="gap-2 text-xs" asChild>
                  <Link href="/dashboard">
                    Go to Projects
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <>
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
                    <Link href="#how-it-works">See How It Works</Link>
                  </Button>
                </>
              )}
            </div>

            {!isLoggedIn && (
              <p className="mt-4 text-[10px] text-muted-foreground">
                Free forever for 1 site. No credit card required.
              </p>
            )}
          </div>

          {/* Right column - Chat Demo */}
          <div className="flex justify-center lg:justify-end">
            <ChatDemo />
          </div>
        </div>
      </div>
    </section>
  )
}
