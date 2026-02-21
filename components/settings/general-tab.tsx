"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function GeneralTab({
  projectName,
  setProjectName,
  domain,
  setDomain,
  onSave,
  saving,
}: {
  projectName: string
  setProjectName: (v: string) => void
  domain: string
  setDomain: (v: string) => void
  onSave: () => void
  saving: boolean
}) {
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
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-domain" className="text-xs">
              Domain <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-domain"
              placeholder="myapp.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
            {!domain.trim() && (
              <p className="text-[10px] text-destructive">
                Domain is required for the widget and AI crawling to work.
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              The domain where your chat widget will be installed.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="text-xs"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
