"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, MessageSquare, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  isLoggedIn?: boolean
}

export function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl animate-fade-in-down">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center bg-foreground">
            <MessageSquare className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-foreground">
            Bridgecord
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <Button size="sm" className="gap-2 text-xs" asChild>
              <Link href="/dashboard">
                Go to Projects
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" className="text-xs" asChild>
                <Link href="/login">Get Started Free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-muted-foreground md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 pb-6 md:hidden animate-fade-in-down">
          <div className="flex flex-col gap-4 pt-4">
            <a
              href="#how-it-works"
              className="text-xs text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-xs text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </a>
            <div className="flex flex-col gap-2 pt-2">
              {isLoggedIn ? (
                <Button size="sm" className="gap-2 text-xs" asChild>
                  <Link href="/dashboard">
                    Go to Projects
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs text-muted-foreground"
                    asChild
                  >
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button size="sm" className="text-xs" asChild>
                    <Link href="/login">Get Started Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
