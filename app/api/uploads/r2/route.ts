import {PutObjectCommand} from '@aws-sdk/client-s3'
import {NextResponse} from 'next/server'

import {getR2Client, getR2Config} from '@/convex/r2/client'

export const runtime = 'nodejs'

const sanitizePathSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9/_-]/g, '-').replace(/\/+/g, '/').replace(/^\/|\/$/g, '')

const getFileExtension = (file: File) => {
  const nameExtension = file.name.split('.').pop()?.trim().toLowerCase()
  if (nameExtension) {
    return nameExtension
  }

  const mimeSubtype = file.type.split('/').pop()?.toLowerCase()
  if (!mimeSubtype) {
    return 'bin'
  }

  if (mimeSubtype === 'jpeg') {
    return 'jpg'
  }

  return mimeSubtype.split('+')[0] ?? mimeSubtype
}

const buildR2Key = (prefix: string, file: File) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  const extension = getFileExtension(file)
  const sanitizedPrefix = sanitizePathSegment(prefix || 'uploads') || 'uploads'

  return `${sanitizedPrefix}/${timestamp}-${random}.${extension}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const fileEntry = formData.get('file')
    const keyPrefixEntry = formData.get('keyPrefix')

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({error: 'Missing upload file.'}, {status: 400})
    }

    const keyPrefix =
      typeof keyPrefixEntry === 'string' ? keyPrefixEntry : 'uploads'

    const client = getR2Client()
    const {bucketName, publicUrl} = getR2Config()
    const key = buildR2Key(keyPrefix, fileEntry)
    const body = new Uint8Array(await fileEntry.arrayBuffer())
    const contentType = fileEntry.type || 'application/octet-stream'

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )

    const url = `${publicUrl.replace(/\/$/, '')}/${key}`

    return NextResponse.json({
      storageId: url,
      url,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload file to R2.'

    return NextResponse.json({error: message}, {status: 500})
  }
}
