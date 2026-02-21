"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"

export interface MessageData {
  id: string
  sender: string
  content: string
  createdAt: string
}

export interface ConversationData {
  conversation: {
    id: string
    visitorId: string
    visitorName: string | null
    visitorEmail: string | null
    status: string
    [key: string]: unknown
  }
  messages: MessageData[]
}

export function useConversation(projectId: string | undefined, conversationId: string | undefined) {
  return useQuery({
    queryKey: ["conversation", projectId, conversationId],
    queryFn: async (): Promise<ConversationData> => {
      const res = await fetch(
        `/api/projects/${projectId}/conversations/${conversationId}`
      )
      if (!res.ok) throw new Error("Failed to fetch conversation")
      return res.json()
    },
    enabled: !!projectId && !!conversationId,
  })
}

export function useSendMessage(projectId: string | undefined, conversationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/conversations/${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        }
      )
      if (!res.ok) throw new Error("Failed to send")
      return res.json() as Promise<{ id: string }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", projectId, conversationId],
      })
    },
    onError: () => {
      toast.error("Failed to send reply")
    },
  })
}

export function useConversationStream(projectId: string | undefined, conversationId: string | undefined) {
  const queryClient = useQueryClient()
  const [sseMessages, setSseMessages] = useState<MessageData[]>([])
  const [animateIds, setAnimateIds] = useState<Set<string>>(new Set())
  const sseRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!conversationId || !projectId) return

    const eventSource = new EventSource(
      `/api/projects/${projectId}/conversations/${conversationId}/stream`
    )
    sseRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data)
        if (eventData.type === "new_message" && eventData.message) {
          setSseMessages((prev) => {
            if (prev.some((m) => m.id === eventData.message.id)) return prev
            return [...prev, eventData.message]
          })
          setAnimateIds((prev) => new Set(prev).add(eventData.message.id))
        }
      } catch {
        // silent
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      sseRef.current = null
    }

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", projectId, conversationId],
      })
    }, 3000)

    return () => {
      eventSource.close()
      sseRef.current = null
      clearInterval(pollInterval)
    }
  }, [conversationId, projectId, queryClient])

  const clearAnimateId = (id: string) => {
    setAnimateIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return { sseMessages, animateIds, clearAnimateId }
}
