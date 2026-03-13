import {getTemplatePreview} from '@/lib/resend/templates/render-preview'
import {readFile} from 'fs/promises'
import {NextResponse} from 'next/server'
import {join} from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PREVIEWS_FILE = join(process.cwd(), 'public', 'email-previews.json')

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Failed to render template'
}

export async function GET(
  req: Request,
  {params}: {params: Promise<{id: string}>},
) {
  try {
    const {id} = await params
    if (!id) {
      return NextResponse.json({error: 'Missing template id'}, {status: 400})
    }

    const url = new URL(req.url)
    const useLiveRender =
      url.searchParams.get('live') === '1' ||
      url.searchParams.get('live') === 'true'
    const templateProps = url.searchParams.get('templateProps') ?? undefined

    // Use live render (render-preview.ts) when requested, so template/defaultProps updates are visible
    if (!useLiveRender) {
      try {
        const raw = await readFile(PREVIEWS_FILE, 'utf8')
        const preloaded = JSON.parse(raw) as Record<
          string,
          {html: string; subject: string}
        >
        const preview = preloaded[id]
        if (preview && typeof preview.html === 'string') {
          return NextResponse.json(preview)
        }
      } catch {
        // No file or invalid: fall back to live render
      }
    }

    const preview = await getTemplatePreview(id, templateProps)
    if (!preview) {
      return NextResponse.json({error: 'Template not found'}, {status: 404})
    }

    if (typeof preview.html !== 'string') {
      return NextResponse.json(
        {error: 'Template produced no HTML'},
        {status: 500},
      )
    }

    return NextResponse.json(preview)
  } catch (err) {
    console.error('[resend/templates] getTemplatePreview error:', err)
    return NextResponse.json({error: toErrorMessage(err)}, {status: 500})
  }
}
