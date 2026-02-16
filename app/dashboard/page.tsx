"use client"

import useSWR from "swr"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data: projects, isLoading, mutate } = useSWR("/api/projects", fetcher)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create project")
      const project = await res.json()
      await mutate()
      setOpen(false)
      setName("")
      setDomain("")
      toast.success("Project created")
      router.push(`/dashboard/projects/${project.id}`)
    } catch {
      toast.error("Failed to create project")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      await mutate()
      toast.success("Project deleted")
    } catch {
      toast.error("Failed to delete project")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      {/* Page header */}
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
                Give your project a name and optionally set the domain where
                the widget will be installed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs">
                  Project Name
                </Label>
                <Input
                  id="name"
                  placeholder="My SaaS App"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-xs">
                  Domain (optional)
                </Label>
                <Input
                  id="domain"
                  placeholder="myapp.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
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
                onClick={handleCreate}
                disabled={creating || !name.trim()}
              >
                {creating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
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
            {projects?.map(
              (project: {
                id: string
                name: string
                domain: string | null
                createdAt: string
              }) => (
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
              )
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
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
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
