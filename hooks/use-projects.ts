"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export type Project = {
  id: string
  name: string
  domain: string | null
  createdAt: string
  updatedAt?: string
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (payload: { name: string; domain: string }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name.trim(),
          domain: payload.domain.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed to create project")
      return res.json() as Promise<Project>
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project created")
      router.push(`/dashboard/projects/${project.id}`)
    },
    onError: () => {
      toast.error("Failed to create project")
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete project")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted")
    },
    onError: () => {
      toast.error("Failed to delete project")
    },
  })
}
