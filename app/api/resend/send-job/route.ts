import {createClient} from '@/lib/resend'
import {queueResendSend} from '@/lib/resend/rate-limit'
import {
  parseInvitationTemplateProps,
  renderInvitationTemplate,
} from '@/lib/resend/templates/render-with-props'
import {uuidv7} from 'uuidv7'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAILING_LIST_BLAST_FROM = 'hello@rapidfirenow.com'

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

type _RecipientInput = string | {email: string; name?: string}

function parseBody(raw: unknown): {
  to: string[]
  recipients?: {email: string; name: string}[]
  subject: string
  html?: string
  body?: string
  from?: string
  cc?: string[]
  bcc?: string[]
  template?: string
  templateProps?: string
} | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const toRaw = o.to
  const toArr = Array.isArray(toRaw)
    ? (toRaw as unknown[]).filter(
        (x): x is string => typeof x === 'string' && x.trim().length > 0,
      )
    : typeof toRaw === 'string' && toRaw.trim()
      ? [toRaw.trim()]
      : []
  const recipientsRaw = o.recipients
  const recipients =
    Array.isArray(recipientsRaw) &&
    recipientsRaw.every(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof (r as {email?: unknown}).email === 'string',
    )
      ? (recipientsRaw as {email: string; name?: string}[]).map((r) => ({
          email: r.email.trim(),
          name: typeof r.name === 'string' ? r.name.trim() : '',
        }))
      : undefined
  const hasRecipients = toArr.length > 0 || (recipients?.length ?? 0) > 0
  if (!hasRecipients) return null
  const subject = typeof o.subject === 'string' ? o.subject.trim() : ''
  if (!subject) return null
  return {
    to: toArr,
    recipients,
    subject,
    html: typeof o.html === 'string' ? o.html : undefined,
    body: typeof o.body === 'string' ? o.body : undefined,
    from: typeof o.from === 'string' ? o.from.trim() : undefined,
    cc: Array.isArray(o.cc)
      ? (o.cc as unknown[]).filter(
          (x): x is string => typeof x === 'string' && x.trim().length > 0,
        )
      : undefined,
    bcc: Array.isArray(o.bcc)
      ? (o.bcc as unknown[]).filter(
          (x): x is string => typeof x === 'string' && x.trim().length > 0,
        )
      : undefined,
    template: typeof o.template === 'string' ? o.template.trim() : undefined,
    templateProps:
      typeof o.templateProps === 'string' ? o.templateProps : undefined,
  }
}

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => null)
  const parsed = parseBody(raw)
  if (!parsed) {
    return Response.json(
      {ok: false, error: 'Invalid payload: need non-empty to and subject'},
      {status: 400},
    )
  }

  const {
    to,
    recipients,
    subject,
    html,
    body,
    cc,
    bcc,
    template,
    templateProps,
  } = parsed
  const from = MAILING_LIST_BLAST_FROM
  let resend: ReturnType<typeof createClient>
  try {
    resend = createClient()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Resend is not configured'
    console.error('[resend/send-job] createClient', err)
    return Response.json({ok: false, error: message}, {status: 502})
  }

  const useInvitationComponent =
    template === 'invitation' && recipients && recipients.length > 0
  const invitationProps = useInvitationComponent
    ? parseInvitationTemplateProps(templateProps)
    : null
  const fallbackHtml = html ?? (body ? `<p>${body}</p>` : '<p></p>')

  const recipientList: {email: string; name: string}[] =
    (recipients?.length ?? 0) > 0
      ? recipients!
      : to.map((e) => ({email: e, name: ''}))

  const ids: string[] = []

  for (const recipient of recipientList) {
    const headers: Record<string, string> = {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'high',
      'X-Entity-Ref-ID': uuidv7(),
    }

    let htmlToSend: string
    if (useInvitationComponent && invitationProps) {
      try {
        htmlToSend = await renderInvitationTemplate({
          ...invitationProps,
          recipientName:
            recipient.name || recipient.email.split('@')[0] || 'there',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Render failed'
        console.error('[resend/send-job] renderInvitationTemplate', err)
        return Response.json(
          {ok: false, error: `Template render failed: ${message}`},
          {status: 500},
        )
      }
    } else {
      htmlToSend = fallbackHtml
    }

    const payload: {
      from: string
      to: string
      subject: string
      html: string
      headers: Record<string, string>
      cc?: string[]
      bcc?: string[]
    } = {
      from: `Rapid Fire <${from}>`,
      to: recipient.email,
      subject,
      html: htmlToSend,
      headers,
    }
    if (cc && cc.length > 0) payload.cc = cc
    if (bcc && bcc.length > 0) payload.bcc = bcc

    let result: unknown
    try {
      result = await queueResendSend(() => resend.emails.send(payload))
    } catch (err) {
      const message = toErrorMessage(err)
      console.error('[resend/send-job] send threw', err)
      return Response.json(
        {
          ok: false,
          error: `Resend failed for ${recipient.email} - ${message}`,
        },
        {status: 502},
      )
    }

    if (
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      (result as {error?: unknown}).error
    ) {
      const resendErr = (result as {error?: unknown}).error
      const details = extractResendErrorDetails(resendErr)
      console.error('[resend/send-job] send returned error', resendErr)
      return Response.json(
        {
          ok: false,
          error: `Resend failed for ${recipient.email} - ${details}`,
        },
        {status: 502},
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
    if (id) ids.push(id)
  }

  return Response.json({ok: true, id: ids[0] ?? null, ids}, {status: 200})
}
