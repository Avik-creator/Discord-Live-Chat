"use client"

import { useState } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  type Project,
} from "@/hooks/use-projects"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { ProjectCard } from "@/components/dashboard/project-card"

export default function DashboardPage() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  const handleCreate = (payload: { name: string; domain: string }) => {
    createProject.mutate(payload, {
      onSuccess: () => setOpen(false),
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteProject.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    })
  }

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
        <CreateProjectDialog
          open={open}
          onOpenChange={setOpen}
          onCreate={handleCreate}
          isPending={createProject.isPending}
        />
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
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={(p) => setDeleteTarget(p)}
              />
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
            <AlertDialogCancel disabled={deleteProject.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
