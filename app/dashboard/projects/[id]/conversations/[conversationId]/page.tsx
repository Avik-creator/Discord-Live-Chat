"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
  useConversation,
  useSendMessage,
  useConversationStream,
  type MessageData,
} from "@/hooks/use-conversations"
import { ConversationHeader } from "@/components/conversations/conversation-header"
import { MessageList } from "@/components/conversations/message-list"
import { ReplyInput } from "@/components/conversations/reply-input"

export default function ConversationPage() {
  const { id, conversationId } = useParams<{
    id: string
    conversationId: string
  }>()
  const { data, isLoading } = useConversation(id, conversationId)
  const sendMessage = useSendMessage(id, conversationId)
  const { sseMessages, animateIds, clearAnimateId } = useConversationStream(
    id,
    conversationId
  )
  const [reply, setReply] = useState("")

  const baseMessages: MessageData[] = data?.messages ?? []
  const mergedMessages = [...baseMessages]
  for (const sseMsg of sseMessages) {
    if (!mergedMessages.some((m) => m.id === sseMsg.id)) {
      mergedMessages.push(sseMsg)
    }
  }
  mergedMessages.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const handleSend = () => {
    if (!reply.trim() || sendMessage.isPending) return
    sendMessage.mutate(reply.trim(), {
      onSuccess: () => setReply(""),
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        {/* Back button skeleton */}
        <Skeleton className="h-5 w-32" />
        
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Messages skeleton */}
        <div className="space-y-4 border border-border bg-card p-4">
          {/* Visitor message */}
          <div className="flex flex-row-reverse gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-10 w-48 rounded-lg" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          {/* Agent message */}
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-14 w-64 rounded-lg" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          {/* Visitor message */}
          <div className="flex flex-row-reverse gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>

        {/* Reply input skeleton */}
        <div className="flex items-start gap-2 pt-2">
          <Skeleton className="h-20 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    )
  }

  const conversation = data?.conversation

  return (
    <div className="flex flex-col">
      <Link
        href={`/dashboard/projects/${id}`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to conversations
      </Link>

      <ConversationHeader
        visitorName={conversation?.visitorName ?? null}
        visitorId={conversation?.visitorId ?? ""}
        visitorEmail={conversation?.visitorEmail ?? null}
        status={conversation?.status ?? "open"}
      />

      <MessageList
        messages={mergedMessages}
        animateIds={animateIds}
        clearAnimateId={clearAnimateId}
      />

      <ReplyInput
        value={reply}
        onChange={setReply}
        onSend={handleSend}
        disabled={sendMessage.isPending}
      />
    </div>
  )
}
