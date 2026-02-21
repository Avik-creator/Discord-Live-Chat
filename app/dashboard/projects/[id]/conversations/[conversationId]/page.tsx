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
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
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
