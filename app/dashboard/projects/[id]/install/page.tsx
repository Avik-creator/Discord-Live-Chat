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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Copy, ExternalLink } from "lucide-react"
import { useState, useCallback } from "react"

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="group relative">
      <pre className="overflow-x-auto border border-border bg-accent/50 p-4 text-xs font-mono text-foreground leading-relaxed">
        {lang && (
          <span className="absolute top-2 left-3 text-[9px] uppercase tracking-wider text-muted-foreground">
            {lang}
          </span>
        )}
        <code>{code}</code>
      </pre>
      <Button
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 gap-1.5 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
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
  )
}

export default function InstallPage() {
  const { id } = useParams<{ id: string }>()

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://bridgecord.avikmukherjee.me"

  // ---- Code snippets for each framework ---- //

  const htmlSnippet = `<!-- Add before closing </body> tag -->
<script
  src="${appUrl}/embed.js"
  data-project-id="${id}"
  defer
><\/script>`

  const nextJsSnippet = `// app/layout.tsx (App Router)
import Script from "next/script"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${appUrl}/embed.js"
          data-project-id="${id}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}`

  const nextJsPagesSnippet = `// pages/_app.tsx (Pages Router)
import Script from "next/script"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Script
        src="${appUrl}/embed.js"
        data-project-id="${id}"
        strategy="lazyOnload"
      />
    </>
  )
}`

  const reactSnippet = `// src/App.tsx
import { useEffect } from "react"

function App() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "${appUrl}/embed.js"
    script.setAttribute("data-project-id", "${id}")
    script.defer = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
      const widget = document.getElementById("bridgecord-widget")
      if (widget) widget.remove()
    }
  }, [])

  return <div>{/* Your app */}</div>
}`

  const vueSnippet = `<!-- App.vue -->
<template>
  <div id="app">
    <!-- Your app -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue"

let scriptEl = null

onMounted(() => {
  scriptEl = document.createElement("script")
  scriptEl.src = "${appUrl}/embed.js"
  scriptEl.setAttribute("data-project-id", "${id}")
  scriptEl.defer = true
  document.body.appendChild(scriptEl)
})

onUnmounted(() => {
  if (scriptEl) document.body.removeChild(scriptEl)
  const widget = document.getElementById("bridgecord-widget")
  if (widget) widget.remove()
})
<\/script>`

  const svelteSnippet = `<!-- +layout.svelte (SvelteKit) -->
<script>
  import { onMount, onDestroy } from "svelte"

  let scriptEl

  onMount(() => {
    scriptEl = document.createElement("script")
    scriptEl.src = "${appUrl}/embed.js"
    scriptEl.setAttribute("data-project-id", "${id}")
    scriptEl.defer = true
    document.body.appendChild(scriptEl)
  })

  onDestroy(() => {
    if (scriptEl) document.body.removeChild(scriptEl)
    const widget = document.getElementById("bridgecord-widget")
    if (widget) widget.remove()
  })
<\/script>

<slot />`

  const astroSnippet = `---
// src/layouts/Layout.astro
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <slot />
    <script
      src="${appUrl}/embed.js"
      data-project-id="${id}"
      defer
    ></script>
  </body>
</html>`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main install card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            Install Widget
          </CardTitle>
          <CardDescription className="text-xs">
            Add Bridgecord to your website. Pick your framework below for
            a copy-paste integration.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="mb-3 flex w-full flex-wrap gap-1 bg-transparent p-0 h-auto">
              {[
                { value: "html", label: "HTML" },
                { value: "nextjs-app", label: "Next.js (App)" },
                { value: "nextjs-pages", label: "Next.js (Pages)" },
                { value: "react", label: "React" },
                { value: "vue", label: "Vue" },
                { value: "svelte", label: "SvelteKit" },
                { value: "astro", label: "Astro" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="border border-border bg-transparent px-2.5 py-1 text-[10px] font-medium data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="html">
              <CodeBlock code={htmlSnippet} lang="html" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Add this snippet just before the closing{" "}
                <code className="bg-accent px-1 py-0.5 text-[10px] font-mono text-foreground">
                  {"</body>"}
                </code>{" "}
                tag on any HTML page.
              </p>
            </TabsContent>

            <TabsContent value="nextjs-app">
              <CodeBlock code={nextJsSnippet} lang="tsx" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Uses{" "}
                <code className="bg-accent px-1 py-0.5 text-[10px] font-mono text-foreground">
                  next/script
                </code>{" "}
                with{" "}
                <code className="bg-accent px-1 py-0.5 text-[10px] font-mono text-foreground">
                  strategy=&quot;lazyOnload&quot;
                </code>{" "}
                for optimal performance.
              </p>
            </TabsContent>

            <TabsContent value="nextjs-pages">
              <CodeBlock code={nextJsPagesSnippet} lang="tsx" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                For the Next.js Pages Router, add the Script in{" "}
                <code className="bg-accent px-1 py-0.5 text-[10px] font-mono text-foreground">
                  _app.tsx
                </code>{" "}
                so it loads on every page.
              </p>
            </TabsContent>

            <TabsContent value="react">
              <CodeBlock code={reactSnippet} lang="tsx" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Dynamically injects the script in a{" "}
                <code className="bg-accent px-1 py-0.5 text-[10px] font-mono text-foreground">
                  useEffect
                </code>
                . Works with Create React App, Vite, or any React setup.
              </p>
            </TabsContent>

            <TabsContent value="vue">
              <CodeBlock code={vueSnippet} lang="vue" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Vue 3 Composition API. Add to your root App.vue or a layout component.
              </p>
            </TabsContent>

            <TabsContent value="svelte">
              <CodeBlock code={svelteSnippet} lang="svelte" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                SvelteKit layout component. Also works with vanilla Svelte using the same lifecycle hooks.
              </p>
            </TabsContent>

            <TabsContent value="astro">
              <CodeBlock code={astroSnippet} lang="astro" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Add to your Astro layout. The script loads natively without any framework overhead.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            How It Works
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-4">
          {[
            "The embed script loads your widget config (color, shape, position) from Bridgecord automatically.",
            "A chat bubble appears in the corner of your site. Visitors click it to open the chat window.",
            "Messages are sent to your Discord channel as threads. Reply from Discord and visitors see responses in real-time via SSE.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-foreground text-[10px] font-bold text-background">
                {i + 1}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data attributes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            Optional Overrides
          </CardTitle>
          <CardDescription className="text-xs">
            The widget reads its settings from your project config automatically.
            You can override these with data attributes on the script tag.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3 pt-4">
          {[
            {
              attr: "data-project-id",
              desc: "Required. Your project ID.",
              required: true,
            },
            {
              attr: "data-color",
              desc: "Override the brand color (hex, e.g. #5865F2). Otherwise uses your project setting.",
            },
            {
              attr: "data-position",
              desc: "\"bottom-right\" or \"bottom-left\". Otherwise uses your project setting.",
            },
          ].map((item) => (
            <div key={item.attr} className="flex items-start gap-3">
              <code className="shrink-0 bg-accent px-1.5 py-0.5 text-[10px] font-mono text-foreground">
                {item.attr}
              </code>
              <p className="text-xs text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Direct link — only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
              Direct Link
            </CardTitle>
            <CardDescription className="text-xs">
              Dev-only: link directly to the full-page widget for testing.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <code className="flex-1 truncate border border-border bg-accent/50 px-3 py-2 text-xs font-mono text-foreground">
                {appUrl}/widget/{id}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-[10px]"
                onClick={() =>
                  window.open(`${appUrl}/widget/${id}`, "_blank")
                }
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
