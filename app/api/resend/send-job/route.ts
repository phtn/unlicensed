import {createClient} from '@/lib/resend'
import {uuidv7} from 'uuidv7'

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

function parseBody(raw: unknown): {
  to: string[]
  subject: string
  html?: string
  body?: string
  from?: string
  cc?: string[]
  bcc?: string[]
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
  if (toArr.length === 0) return null
  const subject = typeof o.subject === 'string' ? o.subject.trim() : ''
  if (!subject) return null
  return {
    to: toArr,
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

  const {to, subject, html, body, cc, bcc} = parsed
  const from =
    parsed.from ?? process.env.RESEND_FROM ?? 'hello@rapidfirenow.com'
  const resend = createClient()

  const finalHtml = html ?? (body ? `<p>${body}</p>` : '<p></p>')

  const ids: string[] = []

  for (const recipient of to) {
    const headers: Record<string, string> = {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'high',
      'X-Entity-Ref-ID': uuidv7(),
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
      from,
      to: recipient,
      subject,
      html: finalHtml,
      headers,
    }
    if (cc && cc.length > 0) payload.cc = cc
    if (bcc && bcc.length > 0) payload.bcc = bcc

    let result: unknown
    try {
      result = await resend.emails.send(payload)
    } catch (err) {
      const message = toErrorMessage(err)
      console.error('[resend/send-job] send threw', err)
      return Response.json(
        {
          ok: false,
          error: `Resend failed for ${recipient} - ${message}`,
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
          error: `Resend failed for ${recipient} - ${details}`,
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
