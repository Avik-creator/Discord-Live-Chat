"use client"

import { useParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

export default function InstallPage() {
  const { id } = useParams<{ id: string }>()
  const [copied, setCopied] = useState(false)

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : ""

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
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            Install Widget
          </CardTitle>
          <CardDescription className="text-xs">
            Add this snippet to your website to enable the Bridgecord chat
            widget. Paste it just before the closing{" "}
            <code className="bg-accent px-1 py-0.5 text-[10px] font-mono text-foreground">
              {"</body>"}
            </code>{" "}
            tag.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="relative">
            <pre className="overflow-x-auto border border-border bg-accent/50 p-4 text-xs font-mono text-foreground">
              {embedCode}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-2 gap-1.5 text-[10px]"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            How It Works
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-4">
          {[
            "Add the embed snippet above to your website HTML.",
            "A chat bubble appears in the bottom corner of your site. Visitors click it to open a chat window.",
            "Messages show up in your Discord channel as threads. Reply from Discord and the visitor sees your response in real-time.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-foreground text-[10px] font-bold text-background">
                {i + 1}
              </div>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            Customization
          </CardTitle>
          <CardDescription className="text-xs">
            You can customize the widget with data attributes on the script
            tag.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3 pt-4">
          {[
            {
              attr: "data-project-id",
              desc: "Required. Your project ID.",
            },
            {
              attr: "data-color",
              desc: "Optional. Override the widget brand color (hex code).",
            },
            {
              attr: "data-position",
              desc: 'Optional. "bottom-right" or "bottom-left".',
            },
          ].map((item) => (
            <div key={item.attr} className="flex items-start gap-3">
              <code className="shrink-0 bg-accent px-1.5 py-0.5 text-[10px] font-mono text-foreground">
                {item.attr}
              </code>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
