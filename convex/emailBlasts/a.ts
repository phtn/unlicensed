import {createClient} from '../../lib/resend'
import {queueResendSend} from '../../lib/resend/rate-limit'
import {sendInvitationEmail} from '../../lib/resend/send-invitation-email'
import {v} from 'convex/values'
import {uuidv7} from 'uuidv7'
import {internal} from '../_generated/api'
import type {Doc, Id} from '../_generated/dataModel'
import {internalAction, type ActionCtx} from '../_generated/server'

const MAILING_LIST_BLAST_FROM = 'hello@rapidfirenow.com'

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

  const resend = createClient()
  const fallbackHtml =
    blast.html ?? (blast.body ? `<p>${blast.body}</p>` : '<p></p>')

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
