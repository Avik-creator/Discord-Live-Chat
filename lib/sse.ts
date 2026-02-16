/**
 * In-memory SSE event bus for real-time message delivery.
 * Each conversation ID maps to a set of writable stream controllers.
 * When a new message arrives (from the widget POST or Discord webhook),
 * we push the event to all connected clients for that conversation.
 */

type SSEClient = {
  controller: ReadableStreamDefaultController
  conversationId: string
}

class SSEBus {
  private clients = new Map<string, Set<SSEClient>>()

  subscribe(conversationId: string, controller: ReadableStreamDefaultController): SSEClient {
    const client: SSEClient = { controller, conversationId }
    if (!this.clients.has(conversationId)) {
      this.clients.set(conversationId, new Set())
    }
    this.clients.get(conversationId)!.add(client)
    return client
  }

  unsubscribe(client: SSEClient) {
    const set = this.clients.get(client.conversationId)
    if (set) {
      set.delete(client)
      if (set.size === 0) {
        this.clients.delete(client.conversationId)
      }
    }
  }

  emit(conversationId: string, data: Record<string, unknown>) {
    const set = this.clients.get(conversationId)
    if (!set) return
    const payload = `data: ${JSON.stringify(data)}\n\n`
    const encoder = new TextEncoder()
    for (const client of set) {
      try {
        client.controller.enqueue(encoder.encode(payload))
      } catch {
        // Client disconnected, clean up
        this.unsubscribe(client)
      }
    }
  }

  getConnectionCount(conversationId: string): number {
    return this.clients.get(conversationId)?.size ?? 0
  }
}

// Singleton
export const sseBus = new SSEBus()
