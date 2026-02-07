import {
  Content,
  createClient,
  INSTRUCTIONS,
  type ChatMessage,
} from '@/lib/cohere'

interface AIRequestBody {
  prompt: string
  messages?: Array<ChatMessage>
}

export const POST = async (req: Request) => {
  const client = createClient()

  try {
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return new Response(JSON.stringify({error: 'Invalid JSON'}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      })
    }
    if (!rawBody || typeof rawBody !== 'object') {
      return new Response(JSON.stringify({error: 'Invalid request body'}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      })
    }

    const {prompt, messages} = rawBody as Partial<AIRequestBody>
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({error: '`prompt` is required'}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      })
    }

    const history: Array<ChatMessage> = Array.isArray(messages)
      ? messages.filter(isChatMessage)
      : []

    const current: Array<ChatMessage> = [
      ...history,
      {role: 'user', content: prompt},
    ]

    const stream = await client.chatStream({
      model: 'command-a-03-2025',
      messages: [{role: 'system', content: INSTRUCTIONS}, ...current],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chatEvent of stream) {
            if (req.signal.aborted) break
            if (chatEvent.type !== 'content-delta') continue

            const text = chatEvent.delta?.message?.content?.text
            if (typeof text === 'string' && text.length > 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({content: text})}\n\n`),
              )
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({error: message})}\n\n`),
          )
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
      cancel() {
        // Best-effort: request aborted; iteration will stop via req.signal.
      },
    })

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    console.error(e)
    const errorMessage =
      e instanceof Error ? e.message : 'Internal server error'
    return new Response(JSON.stringify({error: errorMessage}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    })
  }
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>

  switch (v.role) {
    case 'user':
      return isUserMessage(v)
    case 'assistant':
      return isAssistantMessage(v)
    case 'system':
      return isSystemMessage(v)
    case 'tool':
      return isToolMessage(v)
    default:
      return false
  }
}

function isUserMessage(v: Record<string, unknown>): boolean {
  const content = v.content
  return typeof content === 'string' || isContentArray(content)
}

function isSystemMessage(v: Record<string, unknown>): boolean {
  const content = v.content
  if (typeof content === 'string') return true
  if (!Array.isArray(content)) return false
  return content.every((item) => {
    if (!item || typeof item !== 'object') return false
    const i = item as Record<string, unknown>
    return i.type === 'text' && typeof i.text === 'string'
  })
}

function isAssistantMessage(v: Record<string, unknown>): boolean {
  if (typeof v.content === 'undefined') return true
  const content = v.content
  if (typeof content === 'string') return true
  if (!Array.isArray(content)) return false
  return content.every((item) => {
    if (!item || typeof item !== 'object') return false
    const i = item as Record<string, unknown>
    if (i.type === 'text') return typeof i.text === 'string'
    if (i.type === 'thinking') return typeof i.thinking === 'string'
    return false
  })
}

function isToolMessage(v: Record<string, unknown>): boolean {
  if (typeof v.toolCallId !== 'string' || v.toolCallId.length === 0) {
    return false
  }

  const content = v.content
  if (typeof content === 'string') return true
  if (!Array.isArray(content)) return false

  return content.every((item) => {
    if (!item || typeof item !== 'object') return false
    const i = item as Record<string, unknown>
    if (i.type === 'text') return typeof i.text === 'string'
    if (i.type === 'document') {
      return typeof i.document === 'object' && i.document !== null
    }
    return false
  })
}

function isContentArray(value: unknown): value is Array<Content> {
  if (!Array.isArray(value)) return false
  for (const part of value) {
    if (!part || typeof part !== 'object') return false
    const p = part as Record<string, unknown>
    if (p.type === 'text') {
      if (typeof p.text !== 'string') return false
      continue
    }
    if (p.type !== 'image_url') return false

    const imageUrl = p.imageUrl
    if (!imageUrl || typeof imageUrl !== 'object') return false
    const iu = imageUrl as Record<string, unknown>
    if (typeof iu.url !== 'string') return false
    if (
      typeof iu.detail !== 'undefined' &&
      iu.detail !== 'low' &&
      iu.detail !== 'auto' &&
      iu.detail !== 'high'
    ) {
      return false
    }
  }
  return true
}
