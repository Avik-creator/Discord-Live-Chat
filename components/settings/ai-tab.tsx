"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, Globe, Loader2, FileText } from "lucide-react"
import type { CrawlMeta } from "@/hooks/use-settings"

export function AITab({
  aiEnabled,
  setAiEnabled,
  aiModel,
  setAiModel,
  aiSystemPrompt,
  setAiSystemPrompt,
  domain,
  crawlMeta,
  onCrawlSite,
  crawling,
  onSave,
  saving,
}: {
  aiEnabled: boolean
  setAiEnabled: (v: boolean) => void
  aiModel: string
  setAiModel: (v: string) => void
  aiSystemPrompt: string
  setAiSystemPrompt: (v: string) => void
  domain: string
  crawlMeta: CrawlMeta | undefined
  onCrawlSite: () => void
  crawling: boolean
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-foreground">
              <Bot className="h-4 w-4 text-background" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
                AI Auto-Reply
              </CardTitle>
              <CardDescription className="text-xs">
                Automatically respond to visitors when no human agent is
                available.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="ai-toggle"
                className="text-xs text-muted-foreground"
              >
                {aiEnabled ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="ai-toggle"
                checked={aiEnabled}
                onCheckedChange={setAiEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent
          className={`space-y-5 pt-5 transition-opacity ${
            aiEnabled ? "opacity-100" : "pointer-events-none opacity-40"
          }`}
        >
          <div className="space-y-2">
            <Label
              htmlFor="ai-model"
              className="flex items-center gap-1.5 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              Model
            </Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger id="ai-model">
                <SelectValue placeholder="Select a model..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llama-3.3-70b-versatile">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Llama 3.3 70B</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      Recommended
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="llama-3.1-8b-instant">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Llama 3.1 8B</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      Fastest
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="mixtral-8x7b-32768">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Mixtral 8x7B</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      32K context
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="gemma2-9b-it">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Gemma 2 9B</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      Compact
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Powered by Groq.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-prompt" className="text-xs">
              System Prompt
            </Label>
            <Textarea
              id="ai-prompt"
              value={aiSystemPrompt}
              onChange={(e) => setAiSystemPrompt(e.target.value)}
              rows={6}
              className="text-xs leading-relaxed"
              placeholder="Tell the AI how to behave..."
            />
            <p className="text-[10px] text-muted-foreground">
              This instruction shapes how the AI replies. Include details about
              your product, tone of voice, and any rules (e.g. &quot;never
              discuss pricing&quot;).
            </p>
          </div>
          <div className="space-y-3 border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Website Knowledge Base
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Crawl your site so the AI can answer questions about your
                    content in real-time.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onCrawlSite}
                disabled={crawling || !domain}
                className="gap-1.5 text-[10px] h-7"
              >
                {crawling ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" />
                    {crawlMeta?.crawledAt ? "Re-crawl" : "Crawl Site"}
                  </>
                )}
              </Button>
            </div>
            {!domain && (
              <p className="text-[10px] text-amber-500">
                Add a domain in the General tab first to enable site crawling.
              </p>
            )}
            {crawlMeta?.crawledAt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    Last crawled:{" "}
                    {new Date(crawlMeta.crawledAt).toLocaleString()}
                  </span>
                  <span>
                    {crawlMeta.pages.length} page(s) /{" "}
                    {(crawlMeta.totalChars / 1000).toFixed(1)}k chars
                  </span>
                </div>
                <div className="max-h-32 space-y-0.5 overflow-y-auto">
                  {crawlMeta.pages.map((page) => (
                    <div
                      key={page.url}
                      className="flex items-center gap-2 py-1"
                    >
                      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-[10px] text-foreground">
                        {page.title || page.url}
                      </span>
                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        {(page.charCount / 1000).toFixed(1)}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Cached for 1 hour. The AI uses this content alongside the system
              prompt and conversation history when replying.
            </p>
          </div>
          <div className="border border-border bg-muted/30 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                When a visitor sends a message, the AI generates an instant
                reply using the conversation history.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                The AI crawls your website and uses the content as a knowledge
                base for accurate answers.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                The AI reply also appears in your Discord thread so agents can
                see what was said.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                Human agents can jump in at any time by replying in the Discord
                thread, overriding the AI.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button size="sm" onClick={onSave} disabled={saving} className="text-xs">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
