"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { MessageSquare, Settings, Code, ArrowLeft } from "lucide-react"

const tabs = [
  { label: "Conversations", href: "", icon: MessageSquare },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Install", href: "/install", icon: Code },
]

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const base = `/dashboard/projects/${id}`

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Projects
      </Link>

      <nav className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`
          const isActive = pathname === href
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
