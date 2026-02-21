"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  createProjectSchema,
  normalizeProjectDomain,
} from "@/lib/validations/project"

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: { name: string; domain: string }) => void
  isPending: boolean
  trigger?: React.ReactNode
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
  isPending,
  trigger,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [errors, setErrors] = useState<{ name?: string; domain?: string }>({})

  const handleCreate = () => {
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
    onCreate({
      name: parsed.data.name,
      domain: parsed.data.domain.replace(/^https?:\/\//i, "").trim(),
    })
  }

  useEffect(() => {
    if (!open) {
      setName("")
      setDomain("")
      setErrors({})
    }
  }, [open])

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        )}
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
            <Label htmlFor="name" className="text-xs">
              Project Name
            </Label>
            <Input
              id="name"
              placeholder="My SaaS App"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-[10px] text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain" className="text-xs">
              Domain <span className="text-destructive">*</span>
            </Label>
            <Input
              id="domain"
              placeholder="myapp.com"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value)
                if (errors.domain) setErrors((prev) => ({ ...prev, domain: undefined }))
              }}
              className={errors.domain ? "border-destructive" : ""}
            />
            {errors.domain && (
              <p className="text-[10px] text-destructive">{errors.domain}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
