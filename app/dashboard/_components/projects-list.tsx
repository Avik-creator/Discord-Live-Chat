"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, Globe, MessageSquare, ArrowRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import {
  createProjectSchema,
  normalizeProjectDomain,
} from "@/lib/validations/project"

type Project = {
  id: string
  name: string
  domain: string | null
  createdAt: string
}

interface ProjectsListProps {
  initialProjects: Project[]
}

export function ProjectsList({ initialProjects }: ProjectsListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [errors, setErrors] = useState<{ name?: string; domain?: string }>({})
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
    initialData: initialProjects,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; domain: string }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? "Failed to create project")
      }
      return res.json()
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setOpen(false)
      setName("")
      setDomain("")
      setErrors({})
      toast.success("Project created")
      router.push(`/dashboard/projects/${project.id}`)
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to create project"),
  })

  const handleCreateProject = () => {
    setErrors({})
    const parsed = createProjectSchema.safeParse({
      name: name.trim(),
      domain: normalizeProjectDomain(domain),
    })
    if (!parsed.success) {
      const fieldErrors: { name?: string; domain?: string } = {}
      for (const e of parsed.error.errors) {
        const path = e.path[0] as "name" | "domain"
        if (path && !fieldErrors[path]) fieldErrors[path] = e.message
      }
      setErrors(fieldErrors)
      const first = parsed.error.errors[0]
      if (first?.message) toast.error(first.message)
      return
    }
    createMutation.mutate({
      name: parsed.data.name,
      domain: parsed.data.domain.replace(/^https?:\/\//i, "").trim(),
    })
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Failed to delete project"),
  })

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Each project connects to one Discord server and one website.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new project</DialogTitle>
              <DialogDescription>
                Give your project a name and set the domain where the widget will
                be installed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="list-name" className="text-xs">
                  Project Name
                </Label>
                <Input
                  id="list-name"
                  placeholder="My SaaS App"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                  }}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-[10px] text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="list-domain" className="text-xs">
                  Domain <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="list-domain"
                  placeholder="myapp.com"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value)
                    if (errors.domain) setErrors((p) => ({ ...p, domain: undefined }))
                  }}
                  className={errors.domain ? "border-destructive" : ""}
                />
                {errors.domain && (
                  <p className="text-[10px] text-destructive">{errors.domain}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateProject}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-dashed py-20">
            <div className="flex h-12 w-12 items-center justify-center bg-accent">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-sm text-foreground">
              No projects yet
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Create your first project to start chatting with visitors.
            </CardDescription>
            <p className="mt-4 text-[10px] text-muted-foreground">
              {"Click \"New Project\" above to get started."}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 stagger-children">
            {projects?.map((project) => (
              <Card
                key={project.id}
                className="group relative cursor-pointer border-border transition-all duration-300 hover:bg-accent/50 hover:-translate-y-0.5"
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}`)
                }
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
                          setDeleteTarget({
                            id: project.id,
                            name: project.name,
                          })
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
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This will permanently remove all conversations, settings, and
              Discord connections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
