import {
  Content,
  createClient,
  type ChatMessage,
} from '@/lib/cohere'
import {buildAssistantCatalogPrompt, type AssistantCatalog} from '@/lib/assistant/catalog'
import {
  DEFAULT_ASSISTANT_CONFIG,
  parseAssistantConfig,
} from '@/lib/assistant/config'
import {api} from '@/convex/_generated/api'
import {ConvexHttpClient} from 'convex/browser'

interface AIRequestBody {
  prompt: string
  messages?: Array<ChatMessage>
}

let convexClient: ConvexHttpClient | null = null

function getConvexClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL
  if (!url) return null

  if (!convexClient) {
    convexClient = new ConvexHttpClient(url)
  }

  return convexClient
}

function getChatMessageText(message: ChatMessage): string {
  const content = message.content

  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .map((item) => {
      if (item.type === 'text') return item.text
      if (item.type === 'thinking') return item.thinking
      return ''
    })
    .join(' ')
    .trim()
}

async function buildSystemInstructions(
  prompt: string,
  history: ChatMessage[],
): Promise<string> {
  let fallbackInstructions = DEFAULT_ASSISTANT_CONFIG.instructions
  const convex = getConvexClient()
  if (!convex) {
    return fallbackInstructions
  }

  try {
    const settings = await convex.query(api.admin.q.getAdminByIdentifier, {
      identifier: 'ai_assistant_config',
    })
    const config = parseAssistantConfig(settings?.value)
    fallbackInstructions = config.instructions

    if (!config.catalogSupportEnabled) {
      return config.instructions
    }

    const catalog = (await convex.query(
      api.assistant.q.getAssistantCatalog,
      {},
    )) as AssistantCatalog
    const searchText = [...history.map(getChatMessageText), prompt]
      .filter((value) => value.length > 0)
      .join('\n')
    const catalogPrompt = buildAssistantCatalogPrompt(catalog, searchText)

    if (!catalogPrompt) {
      return config.instructions
    }

    return `${config.instructions}\n\n${catalogPrompt}`
  } catch (error) {
    console.error('Failed to build assistant system instructions:', error)
    return fallbackInstructions
  }
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
    const systemInstructions = await buildSystemInstructions(prompt, history)

    const stream = await client.chatStream({
      model: 'command-a-03-2025',
      messages: [{role: 'system', content: systemInstructions}, ...current],
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
