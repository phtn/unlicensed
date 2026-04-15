import {createClient} from '../../lib/resend'
import {queueResendSend} from '../../lib/resend/rate-limit'
import {sendInvitationEmail} from '../../lib/resend/send-invitation-email'
import {v} from 'convex/values'
import {uuidv7} from 'uuidv7'
import {internal} from '../_generated/api'
import type {Doc, Id} from '../_generated/dataModel'
import {internalAction, type ActionCtx} from '../_generated/server'

const MAILING_LIST_BLAST_FROM = 'hello@rapidfirenow.com'
const DEFAULT_APP_BASE_URL = 'https://rapidfirenow.com'
const FALLBACK_RETRY_DELAYS_MS = [500, 1500] as const

type EmailBlastDoc = Doc<'emailBlasts'>

const toErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err

  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

const extractResendErrorDetails = (err: unknown): string => {
  if (!err || typeof err !== 'object') return toErrorMessage(err)

  const e = err as Record<string, unknown>
  const message = typeof e.message === 'string' ? e.message : undefined
  const code =
    typeof e.code === 'string' || typeof e.code === 'number'
      ? String(e.code)
      : undefined
  const parts = [code].filter(Boolean).join(' ')

  return `${message ?? 'Resend error'}${parts ? ` (${parts})` : ''}`
}

const getAppBaseUrl = (): string =>
  process.env.EMAIL_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  DEFAULT_APP_BASE_URL

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function sendRawBlastViaAppApi(args: {
  to: string
  subject: string
  html: string
  cc?: string[]
  bcc?: string[]
  headers?: Record<string, string>
}): Promise<{id: string | null}> {
  const response = await fetch(`${getAppBaseUrl()}/api/resend`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      intent: 'marketing',
      type: 'products',
      group: 'auto',
      from: MAILING_LIST_BLAST_FROM,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      cc: args.cc,
      bcc: args.bcc,
      headers: args.headers,
    }),
  })

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean
    id?: string | null
    error?: string
  } | null

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? 'Failed to send via /api/resend')
  }

  return {
    id: payload.id ?? null,
  }
}

async function sendRawBlastViaAppApiWithRetry(args: {
  to: string
  subject: string
  html: string
  cc?: string[]
  bcc?: string[]
  headers?: Record<string, string>
}): Promise<{id: string | null}> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= FALLBACK_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await sendRawBlastViaAppApi(args)
    } catch (error) {
      lastError = error

      const retryDelay = FALLBACK_RETRY_DELAYS_MS[attempt]
      if (retryDelay === undefined) {
        break
      }

      await delay(retryDelay)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to send via /api/resend after retries')
}

async function sendBlastRecipient({
  blast,
  recipient,
}: {
  blast: EmailBlastDoc
  recipient: {
    name: string
    email: string
  }
}): Promise<{id: string | null}> {
  const headers: Record<string, string> = {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High',
    Importance: 'high',
    'X-Entity-Ref-ID': uuidv7(),
  }

  if (blast.template === 'invitation' && blast.templateProps) {
    const result = await sendInvitationEmail({
      to: recipient.email,
      subject: blast.subject,
      recipientName: recipient.name,
      templateProps: blast.templateProps,
      cc: blast.cc,
      bcc: blast.bcc,
      headers,
    })

    return {
      id: result?.id ?? null,
    }
  }

  const fallbackHtml =
    blast.html ?? (blast.body ? `<p>${blast.body}</p>` : '<p></p>')

  let resend: ReturnType<typeof createClient> | null = null
  try {
    resend = createClient()
  } catch (error) {
    const message = toErrorMessage(error)
    if (!message.includes('Resend API key is not configured')) {
      throw error
    }
  }

  if (!resend) {
    return await sendRawBlastViaAppApiWithRetry({
      to: recipient.email,
      subject: blast.subject,
      html: fallbackHtml,
      cc: blast.cc,
      bcc: blast.bcc,
      headers,
    })
  }

  const result = await queueResendSend(() =>
    resend.emails.send({
      from: `Rapid Fire <${MAILING_LIST_BLAST_FROM}>`,
      to: recipient.email,
      subject: blast.subject,
      html: fallbackHtml,
      headers,
      ...(blast.cc?.length ? {cc: blast.cc} : {}),
      ...(blast.bcc?.length ? {bcc: blast.bcc} : {}),
    }),
  )

  if (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    (result as {error?: unknown}).error
  ) {
    throw new Error(
      extractResendErrorDetails((result as {error?: unknown}).error),
    )
  }

  const id =
    typeof result === 'object' &&
    result !== null &&
    'data' in result &&
    typeof (result as {data?: unknown}).data === 'object' &&
    (result as {data?: {id?: unknown}}).data !== null &&
    typeof (result as {data?: {id?: unknown}}).data?.id === 'string'
      ? (result as {data: {id: string}}).data.id
      : null

  return {id}
}

async function processBlast(
  ctx: ActionCtx,
  blastId: Id<'emailBlasts'>,
): Promise<{ok: boolean; error?: string}> {
  const blast = await ctx.runQuery(internal.emailBlasts.q.getBlastForProcessing, {
    blastId,
  })

  if (!blast) {
    return {ok: false, error: 'Blast not found'}
  }

  if (blast.status === 'completed' || blast.status === 'failed') {
    return {ok: true}
  }

  const recipientIndex = blast.nextRecipientIndex
  const claim = await ctx.runMutation(internal.emailBlasts.m.claimNextRecipient, {
    blastId,
    expectedIndex: recipientIndex,
  })

  if (!claim) {
    return {ok: true}
  }

  try {
    const result = await sendBlastRecipient({
      blast,
      recipient: claim.recipient,
    })

    await ctx.runMutation(internal.emailBlasts.m.markRecipientSent, {
      blastId,
      recipientIndex: claim.recipientIndex,
      providerMessageId: result.id ?? undefined,
    })

    return {ok: true}
  } catch (error) {
    const message = toErrorMessage(error)

    await ctx.runMutation(internal.emailBlasts.m.markRecipientFailed, {
      blastId,
      recipientIndex: claim.recipientIndex,
      error: message,
    })

    console.error('[emailBlasts/processNext] send failed', {
      blastId,
      recipientIndex: claim.recipientIndex,
      recipientEmail: claim.recipient.email,
      error: message,
    })

    return {ok: false, error: message}
  }
}

export const processNext = internalAction({
  args: {
    blastId: v.id('emailBlasts'),
  },
  handler: async (ctx, args) => {
    return await processBlast(ctx, args.blastId)
  },
})
