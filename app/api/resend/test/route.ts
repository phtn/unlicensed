import {createClient} from '@/lib/resend'
import {uuidv7} from 'uuidv7'
import {z} from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const testEmailSchema = z.object({
  to: z.email('Invalid email').min(1, 'Recipient email is required'),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
})

const toErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ok: false, error: 'Invalid JSON body'}, {status: 400})
  }

  const parsed = testEmailSchema.safeParse(body)
  if (!parsed.success) {
    const first =
      parsed.error.flatten().fieldErrors.to?.[0] ??
      parsed.error.flatten().fieldErrors.subject?.[0] ??
      parsed.error.flatten().fieldErrors.html?.[0] ??
      'Invalid request'
    return Response.json({ok: false, error: first}, {status: 400})
  }

  const {to, subject, html} = parsed.data
  const from = process.env.RESEND_FROM ?? 'hello@rapidfirenow.com'
  const resend = createClient()

  const headers: Record<string, string> = {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High',
    Importance: 'high',
    'X-Entity-Ref-ID': uuidv7(),
  }

  let result: unknown
  try {
    result = await resend.emails.send({
      from: `Rapid Fire <${from}>`,
      to: to.trim(),
      subject,
      html,
      headers,
    })
  } catch (err) {
    console.error('[resend/test] send threw', err)
    return Response.json({ok: false, error: toErrorMessage(err)}, {status: 502})
  }

  const err =
    typeof result === 'object' && result !== null && 'error' in result
      ? (result as {error?: unknown}).error
      : null
  if (err) {
    console.error('[resend/test] send returned error', err)
    const msg = err instanceof Error ? err.message : 'Resend failed'
    return Response.json({ok: false, error: msg}, {status: 502})
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
