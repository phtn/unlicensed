'use client'

import {useCallback, useState} from 'react'
import {useConvex, useMutation} from 'convex/react'
import {api} from '@/convex/_generated/api'

type UploadResult = {
  storageId: string
  url: string | null
}

export const useStorageUpload = () => {
  const convex = useConvex()
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      setIsUploading(true)
      try {
        const uploadUrl = await generateUploadUrl()
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        })

        if (!response.ok) {
          throw new Error('Failed to upload file.')
        }

        const {storageId} = (await response.json()) as {storageId: string}

        const url =
          (await convex.query(api.uploads.getStorageUrl, {storageId})) ?? null

        return {storageId, url}
      } finally {
        setIsUploading(false)
      }
    },
    [convex, generateUploadUrl],
  )

  return {
    uploadFile,
    isUploading,
  }
}

