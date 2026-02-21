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

  const handleCreate = () => {
    if (!name.trim() || !domain.trim()) return
    onCreate({ name: name.trim(), domain: domain.trim() })
  }

  useEffect(() => {
    if (!open) {
      setName("")
      setDomain("")
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
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain" className="text-xs">
              Domain <span className="text-destructive">*</span>
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
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isPending || !name.trim() || !domain.trim()}
          >
            {isPending ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
