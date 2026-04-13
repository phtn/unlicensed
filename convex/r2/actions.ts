'use node'

import {PutObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {v} from 'convex/values'
import {action, internalAction} from '../_generated/server'
import {getR2Client, getR2Config} from './client'

export const generateR2UploadUrl = action({
  args: {
    key: v.string(),
    contentType: v.string(),
  },
  handler: async (_ctx, args) => {
    const client = getR2Client()
    const {bucketName, publicUrl} = getR2Config()

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: args.key,
      ContentType: args.contentType,
    })

    const uploadUrl = await getSignedUrl(client, command, {expiresIn: 600})
    const url = `${publicUrl.replace(/\/$/, '')}/${args.key}`

    return {uploadUrl, publicUrl: url}
  },
})

export const deleteR2Object = internalAction({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    const client = getR2Client()
    const {bucketName, publicUrl} = getR2Config()

    const base = publicUrl.replace(/\/$/, '')
    if (!args.url.startsWith(base)) {
      console.warn(`URL ${args.url} does not match R2 public URL ${base}`)
      return
    }

    const key = args.url.slice(base.length + 1)
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    )
  },
})
