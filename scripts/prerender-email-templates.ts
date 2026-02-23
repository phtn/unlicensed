/**
 * Pre-renders all Resend email templates to HTML so the preview API can serve
 * them without running @react-email/render inside Next.js (which can hang).
 * Run with: bun run scripts/prerender-email-templates.ts
 * Optional: run after build so production serves pre-rendered previews.
 */
import {mkdir, writeFile} from 'fs/promises'
import {join} from 'path'
import {getTemplatePreview} from '../lib/resend/templates/render-preview'
import {EMAIL_TEMPLATE_OPTIONS} from '../lib/resend/templates/registry'

const OUT_DIR = join(process.cwd(), 'public')
const OUT_FILE = join(OUT_DIR, 'email-previews.json')

async function main() {
  const results: Record<string, {html: string; subject: string}> = {}

  for (const opt of EMAIL_TEMPLATE_OPTIONS) {
    process.stderr.write(`Rendering ${opt.id}...`)
    try {
      const preview = await getTemplatePreview(opt.id)
      if (preview) {
        results[opt.id] = preview
        process.stderr.write(' ok\n')
      } else {
        process.stderr.write(' skip (no preview)\n')
      }
    } catch (err) {
      process.stderr.write(` error: ${err instanceof Error ? err.message : err}\n`)
    }
  }

  await mkdir(OUT_DIR, {recursive: true})
  await writeFile(OUT_FILE, JSON.stringify(results, null, 0), 'utf8')
  console.log(`Wrote ${Object.keys(results).length} templates to ${OUT_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
