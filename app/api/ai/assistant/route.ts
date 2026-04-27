import {
  Content,
  createClient,
  type ChatMessage,
  type Tool,
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

// ─── Thumbnail index ─────────────────────────────────────────────────────────

type ThumbnailEntry = {slug: string; name: string; imageUrl: string}
type ThumbnailIndex = Map<string, ThumbnailEntry>

function buildThumbnailIndex(entries: ThumbnailEntry[]): ThumbnailIndex {
  const index: ThumbnailIndex = new Map()
  for (const entry of entries) {
    index.set(entry.slug.toLowerCase(), entry)
    index.set(entry.name.toLowerCase(), entry)
  }
  return index
}

function lookupThumbnail(
  query: string,
  index: ThumbnailIndex,
): {found: boolean; imageUrl: string | null; productName: string | null; slug: string | null; href: string | null} {
  const q = query.trim().toLowerCase()

  const hit = (entry: ThumbnailEntry) => ({
    found: true,
    imageUrl: entry.imageUrl,
    productName: entry.name,
    slug: entry.slug,
    href: `/lobby/products/${entry.slug}`,
  })

  const exact = index.get(q)
  if (exact) return hit(exact)

  for (const [key, entry] of index) {
    if (key.includes(q) || q.includes(key)) return hit(entry)
  }

  return {found: false, imageUrl: null, productName: null, slug: null, href: null}
}

// ─── Cohere tool definition ───────────────────────────────────────────────────

const ASSISTANT_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_product_thumbnail',
      description:
        'Retrieve the thumbnail image URL for a product by its slug or name keyword. Use this when you want to show a product image in your response. Embed the result as a clickable image using markdown image-link syntax (no quotes around URLs): [![Product Name](imageUrl)](href)',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The product slug (e.g. "blue-dream-1g") or product name / keyword to search for.',
          },
        },
        required: ['query'],
      },
    },
  },
]

// ─── Convex client ────────────────────────────────────────────────────────────

let convexClient: ConvexHttpClient | null = null

function getConvexClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL
  if (!url) return null
  if (!convexClient) convexClient = new ConvexHttpClient(url)
  return convexClient
}

// ─── Message helpers ──────────────────────────────────────────────────────────

function getChatMessageText(message: ChatMessage): string {
  const content = message.content

  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((item) => {
      if (item.type === 'text') return item.text
      if (item.type === 'thinking') return item.thinking
      return ''
    })
    .join(' ')
    .trim()
}

// ─── Context builder ──────────────────────────────────────────────────────────

interface AssistantContext {
  systemInstructions: string
  thumbnailIndex: ThumbnailIndex
}

async function buildAssistantContext(
  prompt: string,
  history: ChatMessage[],
): Promise<AssistantContext> {
  let systemInstructions = DEFAULT_ASSISTANT_CONFIG.instructions
  const thumbnailIndex: ThumbnailIndex = new Map()

  const convex = getConvexClient()
  if (!convex) return {systemInstructions, thumbnailIndex}

  try {
    const settings = await convex.query(api.admin.q.getAdminByIdentifier, {
      identifier: 'ai_assistant_config',
    })
    const config = parseAssistantConfig(settings?.value)
    systemInstructions = config.instructions

    const [catalog, thumbnailEntries] = await Promise.all([
      config.catalogSupportEnabled
        ? (convex.query(api.assistant.q.getAssistantCatalog, {}) as Promise<AssistantCatalog>)
        : Promise.resolve(null),
      convex.query(api.assistant.q.getProductThumbnails, {}),
    ])

    if (catalog) {
      const searchText = [...history.map(getChatMessageText), prompt]
        .filter((v) => v.length > 0)
        .join('\n')
      const catalogPrompt = buildAssistantCatalogPrompt(catalog, searchText)
      if (catalogPrompt) {
        systemInstructions = `${systemInstructions}\n\n${catalogPrompt}`
      }
    }

    const index = buildThumbnailIndex(
      (thumbnailEntries as ThumbnailEntry[]).filter(Boolean),
    )
    for (const [k, v] of index) thumbnailIndex.set(k, v)
  } catch (error) {
    console.error('Failed to build assistant context:', error)
  }

  return {systemInstructions, thumbnailIndex}
}

// ─── Agentic stream loop ──────────────────────────────────────────────────────

type PendingToolCall = {id: string; name: string; argsJson: string}

async function runAgenticStream(
  messages: ChatMessage[],
  systemInstructions: string,
  thumbnailIndex: ThumbnailIndex,
  controller: ReadableStreamDefaultController<Uint8Array>,
  signal: AbortSignal,
): Promise<void> {
  const client = createClient()
  const encoder = new TextEncoder()

  function send(text: string) {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({content: text})}\n\n`),
    )
  }

  function sendError(message: string) {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({error: message})}\n\n`),
    )
  }

  let currentMessages = messages
  const MAX_ITERATIONS = 3

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    if (signal.aborted) break

    const stream = await client.chatStream({
      model: 'command-a-03-2025',
      messages: [{role: 'system', content: systemInstructions}, ...currentMessages],
      tools: ASSISTANT_TOOLS,
    })

    const pendingToolCalls: PendingToolCall[] = []
    let finishReason = 'COMPLETE'

    for await (const event of stream) {
      if (signal.aborted) return

      const e = event as unknown as Record<string, unknown>

      if (e.type === 'content-delta') {
        const text = (e as {delta?: {message?: {content?: {text?: string}}}})
          .delta?.message?.content?.text
        if (typeof text === 'string' && text.length > 0) {
          send(text)
        }
        continue
      }

      if (e.type === 'tool-call-start') {
        // toolCalls is a single ToolCallV2 object, not an array
        const tc = (
          e as {delta?: {message?: {toolCalls?: {id?: string; function?: {name?: string; arguments?: string}}}}}
        ).delta?.message?.toolCalls
        pendingToolCalls.push({
          id: tc?.id ?? `tool-${Date.now()}-${pendingToolCalls.length}`,
          name: tc?.function?.name ?? '',
          argsJson: tc?.function?.arguments ?? '',
        })
        continue
      }

      if (e.type === 'tool-call-delta') {
        const idx = (e as {index?: number}).index ?? 0
        // toolCalls is a single object with function.arguments
        const args = (
          e as {delta?: {message?: {toolCalls?: {function?: {arguments?: string}}}}}
        ).delta?.message?.toolCalls?.function?.arguments
        if (pendingToolCalls[idx] && typeof args === 'string') {
          pendingToolCalls[idx].argsJson += args
        }
        continue
      }

      if (e.type === 'message-end') {
        const reason = (e as {delta?: {finishReason?: string}}).delta?.finishReason
        if (typeof reason === 'string') finishReason = reason
        continue
      }
    }

    if (finishReason !== 'TOOL_CALL' || pendingToolCalls.length === 0) break

    // Build the assistant turn that carried the tool calls
    const assistantTurn: ChatMessage = {
      role: 'assistant',
      toolCalls: pendingToolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {name: tc.name, arguments: tc.argsJson},
      })),
    }

    // Execute each tool and build result messages
    const toolMessages: ChatMessage[] = pendingToolCalls.map((tc) => {
      let result: object = {found: false, imageUrl: null, productName: null, slug: null}

      if (tc.name === 'get_product_thumbnail') {
        try {
          const args = JSON.parse(tc.argsJson || '{}') as {query?: string}
          const query = typeof args.query === 'string' ? args.query : ''
          result = lookupThumbnail(query, thumbnailIndex)
        } catch {
          result = {error: 'Failed to parse tool arguments'}
        }
      }

      return {
        role: 'tool' as const,
        toolCallId: tc.id,
        content: JSON.stringify(result),
      }
    })

    currentMessages = [...currentMessages, assistantTurn, ...toolMessages]

    // Safety: if this was the last iteration, surface an error
    if (iteration === MAX_ITERATIONS - 1) {
      sendError('Tool call loop limit reached')
    }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const POST = async (req: Request) => {
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

    const history: ChatMessage[] = Array.isArray(messages)
      ? messages.filter(isChatMessage)
      : []

    const current: ChatMessage[] = [...history, {role: 'user', content: prompt}]
    const {systemInstructions, thumbnailIndex} = await buildAssistantContext(
      prompt,
      history,
    )

    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          await runAgenticStream(
            current,
            systemInstructions,
            thumbnailIndex,
            controller,
            req.signal,
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({error: message})}\n\n`),
          )
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
      cancel() {},
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
    const errorMessage = e instanceof Error ? e.message : 'Internal server error'
    return new Response(JSON.stringify({error: errorMessage}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    })
  }
}

// ─── Message validators ───────────────────────────────────────────────────────

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
  if (typeof v.toolCallId !== 'string' || v.toolCallId.length === 0) return false

  const content = v.content
  if (typeof content === 'string') return true
  if (!Array.isArray(content)) return false

  return content.every((item) => {
    if (!item || typeof item !== 'object') return false
    const i = item as Record<string, unknown>
    if (i.type === 'text') return typeof i.text === 'string'
    if (i.type === 'document') return typeof i.document === 'object' && i.document !== null
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
