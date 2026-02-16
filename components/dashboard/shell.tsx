"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

interface DashboardShellProps {
  children: React.ReactNode
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-background">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Logo */}
          <div className="flex h-14 items-center gap-2.5 px-5">
            <div className="flex h-7 w-7 items-center justify-center bg-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-foreground">
              Bridgecord
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          <Separator />

          {/* Nav */}
          <nav className="flex-1 px-3 py-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Projects
              <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
            </Link>
          </nav>

          {/* User section */}
          <Separator />
          <div className="p-3">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback className="bg-accent text-foreground text-[10px] font-bold">
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="truncate text-xs font-medium text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="sr-only">Sign out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header */}
          <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center bg-foreground">
                <MessageSquare className="h-3 w-3 text-background" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                Bridgecord
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
