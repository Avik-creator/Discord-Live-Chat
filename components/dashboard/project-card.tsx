"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, ArrowRight, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Project } from "@/hooks/use-projects"

type ProjectCardProps = {
  project: Project
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter()

  return (
    <Card
      className="group relative cursor-pointer border-border transition-all duration-300 hover:bg-accent/50 hover:-translate-y-0.5"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-sm text-foreground">
                {project.name}
              </CardTitle>
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px] font-normal"
              >
                Active
              </Badge>
            </div>
            {project.domain ? (
              <CardDescription className="mt-1.5 flex items-center gap-1 text-xs">
                <Globe className="h-3 w-3" />
                {project.domain}
              </CardDescription>
            ) : (
              <CardDescription className="mt-1.5 text-xs">
                No domain set
              </CardDescription>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
              Created{" "}
              {formatDistanceToNow(new Date(project.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(project)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete project</span>
            </Button>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
