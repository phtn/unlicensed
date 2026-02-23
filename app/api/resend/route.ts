import {createClient} from '@/lib/resend'
import {resendRequestSchema} from './types'

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

  const name = typeof e.name === 'string' ? e.name : undefined
  const message = typeof e.message === 'string' ? e.message : undefined
  const code =
    typeof e.code === 'string' || typeof e.code === 'number'
      ? String(e.code)
      : undefined
  const statusCode =
    typeof e.statusCode === 'number' ? String(e.statusCode) : undefined

  const parts = [
    name,
    code && `code=${code}`,
    statusCode && `status=${statusCode}`,
  ]
    .filter(Boolean)
    .join(' ')

  return `${message ?? 'Resend error'}${parts ? ` (${parts})` : ''}`
}

export const POST = async (req: Request) => {
  const raw: unknown = await req.json()
  const parsed = resendRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json(
      {ok: false, error: 'Invalid request payload'},
      {status: 400},
    )
  }

  const {to, subject, group, html, body, cc, bcc, attachments} = parsed.data
  const from = process.env.RESEND_FROM ?? 'hello@rapidfirenow.com'
  const resend = createClient()

  const priorityHeaders: Record<string, string> = {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High',
    Importance: 'high',
  }

  // (currently only `pa`) kept for future routing
  const groupHeaders = group === 'pa' ? priorityHeaders : priorityHeaders

  const finalHtml = html ?? (body ? `<p>${body}</p>` : '<p></p>')

  // Ensure to is present and valid
  if (
    !to ||
    (Array.isArray(to) && to.length === 0) ||
    (typeof to === 'string' && to.trim().length === 0)
  ) {
    return Response.json(
      {ok: false, error: 'Missing or invalid recipient address'},
      {status: 400},
    )
  }

  // Normalize to field - convert to string for single recipient
  const normalizedTo: string[] = Array.isArray(to)
    ? to.filter(
        (email): email is string =>
          typeof email === 'string' && email.trim().length > 0,
      )
    : typeof to === 'string' && to.trim().length > 0
      ? [to.trim()]
      : []

  if (normalizedTo.length === 0) {
    return Response.json(
      {ok: false, error: 'No valid recipient addresses'},
      {status: 400},
    )
  }

  let result: unknown
  try {
    // Convert single-item array to string (Resend API expects string for single recipient)
    const toValue: string | string[] =
      normalizedTo.length === 1 ? normalizedTo[0]! : normalizedTo

    const resendPayload: {
      from: string
      to: string | string[]
      subject: string
      html: string
      headers: Record<string, string>
      cc?: string[]
      bcc?: string[]
      attachments?: Array<{filename: string; content: string}>
    } = {
      from,
      to: toValue,
      subject,
      html: finalHtml,
      headers: groupHeaders,
    }

    if (cc && cc.length > 0) {
      resendPayload.cc = cc
    }
    if (bcc && bcc.length > 0) {
      resendPayload.bcc = bcc
    }
    if (attachments && attachments.length > 0) {
      resendPayload.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: a.contentBase64,
      }))
    }

    result = await resend.emails.send(resendPayload)
  } catch (err) {
    const message = toErrorMessage(err)
    console.error('[resend] send threw', err)
    return Response.json(
      {ok: false, error: `Resend failed [SEND] - ${message}`},
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
    console.error('[resend] send returned error', resendErr)
    return Response.json(
      {ok: false, error: `Resend failed [SEND] - ${details}`},
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

  return Response.json({ok: true, id}, {status: 200})
}
