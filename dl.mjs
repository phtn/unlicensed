import * as dotenv from 'dotenv'
import {writeFileSync, mkdirSync} from 'fs'
import {join} from 'path'
import {nonWebp} from './nonwebp.mjs'

dotenv.config({path: '.env.local'})

// const client = new ConvexHttpClient(process.env['NEXT_PUBLIC_CONVEX_URL'])

// const files = await client.query(api.files.listNonWebp)

const outputDir = 'non-webp'
mkdirSync(outputDir, {recursive: true})

for (const file of nonWebp) {
  if (!file.url) {
    console.log(`Skipping ${file.storageId} — no URL available`)
    continue
  }

  const response = await fetch(file.url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const filename = file.storageId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filepath = join(outputDir, filename)
  writeFileSync(filepath, buffer)
  console.log(`Downloaded: ${filepath} (${file.contentType ?? 'unknown type'})`)
}
