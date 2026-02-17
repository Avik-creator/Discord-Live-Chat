"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface GeneralTabProps {
  projectId: string
  initialName: string
  initialDomain: string
}

export function GeneralTab({
  projectId,
  initialName,
  initialDomain,
}: GeneralTabProps) {
  const [name, setName] = useState(initialName)
  const [domain, setDomain] = useState(initialDomain)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      })
      if (!res.ok) throw new Error("Failed to save")
    },
    onSuccess: () => toast.success("Settings saved"),
    onError: () => toast.error("Failed to save settings"),
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            Project
          </CardTitle>
          <CardDescription className="text-xs">
            General project configuration.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-xs">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-domain" className="text-xs">
              Domain
            </Label>
            <Input
              id="project-domain"
              placeholder="myapp.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              The domain where your chat widget will be installed.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="text-xs"
        >
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
