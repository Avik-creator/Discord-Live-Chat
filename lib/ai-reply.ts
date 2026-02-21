import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { db } from "@/lib/db"
import {
  messages,
  conversations,
  widgetConfigs,
} from "@/lib/db/schema"
import { eq, asc, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { sseBus } from "@/lib/sse"
import { sendThreadMessage } from "@/lib/discord"
import { getRelevantSiteContext } from "@/lib/chunks"

/**
 * Generates an AI auto-reply for a visitor message in a conversation.
 * Also posts the reply to Discord so human agents can see it.
 * Returns the AI message ID, or null if AI is not enabled.
 */
export async function generateAIReply(
  conversationId: string,
  projectId: string
): Promise<string | null> {
  // 1. Check if AI is enabled for this project
  const [widget] = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.projectId, projectId))

  if (!widget?.aiEnabled) return null

  const systemPrompt =
    widget.aiSystemPrompt ||
    "You are a friendly and helpful customer support assistant. Answer the visitor's question concisely. If you don't know the answer, let them know a human agent will follow up."
  const rawModelId = widget.aiModel || "llama-3.3-70b-versatile"
  const modelId = rawModelId.startsWith("groq/") ? rawModelId.slice(5) : rawModelId

  // 2. Fetch conversation + history
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.projectId, projectId)
      )
    )

  if (!conversation) return null

  const history = await db
    .select({
      sender: messages.sender,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  if (history.length === 0) return null

  // 3. Build message array for the model
  const modelMessages = history.map((msg) => ({
    role: msg.sender === "visitor" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }))

  // 4. Fetch only chunks relevant to the last visitor message(s)
  const query = modelMessages
    .filter((m) => m.role === "user")
    .slice(-2)
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join(" ")
    .trim() || "general support"
  let fullSystemPrompt = systemPrompt
  try {
    const siteContext = await getRelevantSiteContext(projectId, query)
    if (siteContext) {
      fullSystemPrompt = `${systemPrompt}\n\n--- WEBSITE KNOWLEDGE BASE ---\nBelow is real-time content crawled from the website. Use this to answer visitor questions accurately. Only reference information found here or in the conversation history.\n\n${siteContext}\n--- END KNOWLEDGE BASE ---`
    }
  } catch (err) {
    console.error("[bridgecord] Failed to fetch site context:", err)
  }

  // 5. Generate AI response
  let aiText: string
  try {
    const result = await generateText({
      model: groq(modelId),
      system: fullSystemPrompt,
      messages: modelMessages,
    })
    aiText = result.text
  } catch (err) {
    console.error("[bridgecord] AI generation failed:", err)
    return null
  }

  if (!aiText || aiText.trim().length === 0) return null

  // Strip <think>…</think> reasoning blocks the model may emit
  const trimmed = aiText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim()

  if (trimmed.length === 0) return null

  const msgId = nanoid(12)
  let discordMessageId: string | null = null

  // 6. Post AI reply to Discord thread so agents can see it
  if (conversation.discordThreadId) {
    try {
      const discordPrefix = "🤖 **AI Auto-Reply:**\n"
      const maxLen = 2000 - discordPrefix.length
      const discordBody =
        trimmed.length > maxLen
          ? trimmed.slice(0, maxLen - 1) + "…"
          : trimmed
      const result = await sendThreadMessage(
        conversation.discordThreadId,
        `${discordPrefix}${discordBody}`,
        "AI Assistant"
      )
      discordMessageId = result.messageId
    } catch (err) {
      console.error("[bridgecord] AI Discord post failed:", err)
    }
  }

  // 7. Save AI message to DB
  await db.insert(messages).values({
    id: msgId,
    conversationId,
    sender: "agent",
    content: trimmed,
    discordMessageId,
    createdAt: new Date(),
  })

  // 8. Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))

  // 9. Push to SSE/Redis so the widget gets it instantly
  sseBus.emit(conversationId, {
    type: "new_message",
    message: {
      id: msgId,
      conversationId,
      sender: "agent",
      content: trimmed,
      discordMessageId,
      createdAt: new Date().toISOString(),
    },
  })

  return msgId
}
