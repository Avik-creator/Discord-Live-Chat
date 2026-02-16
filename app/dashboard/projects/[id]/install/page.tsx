"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

export default function InstallPage() {
  const { id } = useParams<{ id: string }>()
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== "undefined" ? window.location.origin : ""

  const embedCode = `<script
  src="${appUrl}/embed.js"
  data-project-id="${id}"
  defer
></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Install Widget</CardTitle>
          <CardDescription>
            Add this snippet to your website to enable the Bridgecord chat
            widget. Paste it just before the closing{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
              {"</body>"}
            </code>{" "}
            tag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-sm font-mono text-foreground">
              {embedCode}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-3 top-3 gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </div>
            <p className="text-sm text-muted-foreground">
              Add the embed snippet above to your website HTML.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </div>
            <p className="text-sm text-muted-foreground">
              A chat bubble appears in the bottom corner of your site. Visitors
              click it to open a chat window.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </div>
            <p className="text-sm text-muted-foreground">
              Messages show up in your Discord channel as threads. Reply from
              Discord and the visitor sees your response in real-time.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Customization</CardTitle>
          <CardDescription>
            You can customize the widget with data attributes on the script tag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                data-project-id
              </code>
              <p className="text-sm text-muted-foreground">
                Required. Your project ID.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                data-color
              </code>
              <p className="text-sm text-muted-foreground">
                Optional. Override the widget brand color (hex code).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                data-position
              </code>
              <p className="text-sm text-muted-foreground">
                Optional. {"\"bottom-right\""} or {"\"bottom-left\""}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
