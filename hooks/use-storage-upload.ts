'use client'

import {useCallback, useState} from 'react'
import {useConvex, useMutation} from 'convex/react'
import {api} from '@/convex/_generated/api'

type UploadResult = {
  storageId: string
  url: string | null
}

type UseStorageUploadOptions = {
  optimizeImages?: boolean
  maxImageDimension?: number
  imageQuality?: number
}

const DEFAULT_MAX_IMAGE_DIMENSION = 1600
const DEFAULT_IMAGE_QUALITY = 0.82

const shouldOptimizeImage = (file: File) =>
  file.type.startsWith('image/') &&
  file.type !== 'image/gif' &&
  file.type !== 'image/svg+xml'

const replaceFileExtension = (fileName: string, extension: string) => {
  const basename = fileName.replace(/\.[^/.]+$/, '')
  return `${basename}.${extension}`
}

const optimizeImageFile = async (
  file: File,
  {
    imageQuality = DEFAULT_IMAGE_QUALITY,
    maxImageDimension = DEFAULT_MAX_IMAGE_DIMENSION,
  }: Pick<UseStorageUploadOptions, 'imageQuality' | 'maxImageDimension'>,
): Promise<File> => {
  if (!shouldOptimizeImage(file)) {
    return file
  }

  const imageBitmap = await createImageBitmap(file)

  try {
    const longestEdge = Math.max(imageBitmap.width, imageBitmap.height)
    const scale =
      longestEdge > maxImageDimension
        ? maxImageDimension / longestEdge
        : 1
    const width = Math.max(1, Math.round(imageBitmap.width * scale))
    const height = Math.max(1, Math.round(imageBitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', {alpha: true})
    if (!context) {
      return file
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(imageBitmap, 0, 0, width, height)

    const optimizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', imageQuality)
    })

    if (!optimizedBlob) {
      return file
    }

    if (optimizedBlob.size >= file.size) {
      return file
    }

    return new File(
      [optimizedBlob],
      replaceFileExtension(file.name, 'webp'),
      {
        type: 'image/webp',
        lastModified: file.lastModified,
      },
    )
  } finally {
    imageBitmap.close()
  }
}

export const useStorageUpload = (options: UseStorageUploadOptions = {}) => {
  const convex = useConvex()
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const [isUploading, setIsUploading] = useState(false)
  const optimizeImages = options.optimizeImages !== false
  const maxImageDimension =
    options.maxImageDimension ?? DEFAULT_MAX_IMAGE_DIMENSION
  const imageQuality = options.imageQuality ?? DEFAULT_IMAGE_QUALITY

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      setIsUploading(true)
      try {
        let fileToUpload = file

        if (optimizeImages) {
          try {
            fileToUpload = await optimizeImageFile(file, {
              imageQuality,
              maxImageDimension,
            })
          } catch (error) {
            console.warn(
              'Image optimization failed. Uploading the original file instead.',
              error,
            )
          }
        }

        const uploadUrl = await generateUploadUrl()
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': fileToUpload.type || 'application/octet-stream',
          },
          body: fileToUpload,
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
    [convex, generateUploadUrl, imageQuality, maxImageDimension, optimizeImages],
  )

  return {
    uploadFile,
    isUploading,
  }
}






