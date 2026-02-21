"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

const bubbleComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-1.5 list-disc pl-4 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 list-decimal pl-4 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-inherit">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-black/15 px-1 py-0.5 text-[0.9em] font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-1.5 overflow-x-auto rounded bg-black/15 p-2 text-[11px] font-mono">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:opacity-80"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => <p className="font-semibold text-[1em] mb-1">{children}</p>,
  h2: ({ children }) => <p className="font-semibold text-[0.95em] mb-1">{children}</p>,
  h3: ({ children }) => <p className="font-semibold text-[0.9em] mb-0.5">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-current/40 pl-2 my-1 opacity-90">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-1.5 overflow-x-auto">
      <table className="min-w-full text-[0.9em]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-current/20">{children}</tr>,
  th: ({ children }) => <th className="text-left py-0.5 pr-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="py-0.5 pr-2">{children}</td>,
}

export function MarkdownContent({
  content,
  className,
  inline = false,
}: {
  content: string
  className?: string
  inline?: boolean
}) {
  const text = content?.trim() || ""
  if (!text) return null

  if (inline && !/[\n*_`\[\]#]/.test(text)) {
    return <span className={className}>{text}</span>
  }

  return (
    <div className={cn("text-[13px] leading-relaxed [&>*:last-child]:mb-0", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={bubbleComponents}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
