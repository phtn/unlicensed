'use client'

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/app/admin/_components/ui/cropper'
import {EdgeSlider} from '@/components/ui/slider'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image as HeroImage} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'

type Area = {x: number; y: number; width: number; height: number}

type ImageMetadataReport = {
  fileName: string
  mimeType: string
  sizeBytes: number
  sizeHuman: string
  resizedMimeType: string
  resizedSizeBytes: number
  resizedSizeHuman: string
  lastModified: string
  originalWidth: number
  originalHeight: number
  width: number
  height: number
  resizeApplied: boolean
  resizeScalePercent: string
  aspectRatio: string
  megapixels: string
  orientation: 'Landscape' | 'Portrait' | 'Square'
  minDimension: number
  hasPotentialAlpha: boolean
  sha256: string
}

type CropPreview = {
  size: number
  url: string
  bytes: number
  mimeType: string
  blob: Blob
}

type PreparedConvexUpload = {
  previewSize: number
  fileName: string
  file: File
  mimeType: string
  sizeBytes: number
  storageId?: string
  storageUrl?: string | null
  duplicate?: boolean
  fileRecordId?: string
}

const MIN_CROP_SIZE = 400
const MAX_CROP_SIZE = 1000
const RESIZE_TARGET_HEIGHT = 1000
const PREVIEW_SIZES = [1000, 800, 600, 400]

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3)
  const value = bytes / 1024 ** exponent
  const precision = exponent === 0 ? 0 : 2
  return `${value.toFixed(precision)} ${units[exponent]}`
}

const getFileNameBase = (fileName: string) => {
  const cleaned = fileName.replace(/\.[^/.]+$/, '')
  return cleaned.trim() || 'image'
}

const sanitizeFileStem = (value: string) =>
  value.replace(/\.[^/.]+$/, '').trim()

const getExtensionFromMimeType = (mimeType: string) => {
  const subtype = mimeType.split('/').pop()?.toLowerCase() || 'bin'
  if (subtype === 'jpeg') {
    return 'jpg'
  }

  return subtype.split('+')[0] ?? subtype
}

const formatAspectRatio = (width: number, height: number) => {
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

const getOrientation = (width: number, height: number) => {
  if (width === height) {
    return 'Square'
  }

  return width > height ? 'Landscape' : 'Portrait'
}

const mimeSupportsAlpha = (mimeType: string) =>
  /image\/(png|webp|gif|avif)/i.test(mimeType)

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () =>
      reject(new Error('Failed to load image')),
    )
    image.src = src
  })

const createSha256 = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const normalizeSquareCrop = (
  crop: Area,
  imageWidth: number,
  imageHeight: number,
): Area => {
  const candidateSize = Math.round(Math.min(crop.width, crop.height))
  const size = clamp(candidateSize, MIN_CROP_SIZE, MAX_CROP_SIZE)

  const centerX = crop.x + crop.width / 2
  const centerY = crop.y + crop.height / 2

  const maxX = Math.max(0, imageWidth - size)
  const maxY = Math.max(0, imageHeight - size)

  return {
    x: clamp(Math.round(centerX - size / 2), 0, maxX),
    y: clamp(Math.round(centerY - size / 2), 0, maxY),
    width: size,
    height: size,
  }
}

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })

const createPreviewBlob = async (
  image: HTMLImageElement,
  crop: Area,
  outputSize: number,
) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  canvas.width = outputSize
  canvas.height = outputSize

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  const webpBlob = await canvasToBlob(canvas, 'image/webp', 0.86)
  if (webpBlob) {
    return webpBlob
  }

  return canvasToBlob(canvas, 'image/jpeg', 0.86)
}

type ResizeResult = {
  resizedImageUrl: string
  width: number
  height: number
  sizeBytes: number
  mimeType: string
  wasResized: boolean
}

const resizeImageForCropper = async (
  image: HTMLImageElement,
  sourceImageUrl: string,
  sourceMimeType: string,
  sourceSizeBytes: number,
): Promise<ResizeResult> => {
  const normalizedSourceMime = sourceMimeType || 'image/jpeg'

  if (image.naturalHeight <= RESIZE_TARGET_HEIGHT) {
    return {
      resizedImageUrl: sourceImageUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
      sizeBytes: sourceSizeBytes,
      mimeType: normalizedSourceMime,
      wasResized: false,
    }
  }

  const targetHeight = RESIZE_TARGET_HEIGHT
  const targetWidth = Math.round(
    (image.naturalWidth * targetHeight) / image.naturalHeight,
  )
  const resizeCanvas = document.createElement('canvas')
  const resizeContext = resizeCanvas.getContext('2d')

  if (!resizeContext) {
    throw new Error('Failed to initialize image resize canvas.')
  }

  resizeCanvas.width = targetWidth
  resizeCanvas.height = targetHeight
  resizeContext.imageSmoothingEnabled = true
  resizeContext.imageSmoothingQuality = 'high'
  resizeContext.drawImage(image, 0, 0, targetWidth, targetHeight)

  const outputMimeType = mimeSupportsAlpha(normalizedSourceMime)
    ? 'image/webp'
    : 'image/jpeg'

  const resizedBlob = await canvasToBlob(resizeCanvas, outputMimeType, 0.9)

  if (!resizedBlob) {
    throw new Error('Failed to encode resized image.')
  }

  return {
    resizedImageUrl: URL.createObjectURL(resizedBlob),
    width: targetWidth,
    height: targetHeight,
    sizeBytes: resizedBlob.size,
    mimeType: resizedBlob.type || outputMimeType,
    wasResized: true,
  }
}

export const ImageOptimizer = () => {
  const {user} = useAuthCtx()
  const {uploadFile, isUploading} = useStorageUpload()
  const registerUploadedFile = useMutation(api.files.upload.file)
  const authorId = user?.uid ?? 'anonymous-admin'

  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)
  const [report, setReport] = useState<ImageMetadataReport | null>(null)
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [previews, setPreviews] = useState<CropPreview[]>([])
  const [selectedPreviewSizes, setSelectedPreviewSizes] = useState<number[]>([])
  const [uploadedPreviewSizes, setUploadedPreviewSizes] = useState<number[]>([])
  const [customFileNameBySize, setCustomFileNameBySize] = useState<
    Record<number, string>
  >({})
  const [tagsInput, setTagsInput] = useState('')
  const [preparedUploads, setPreparedUploads] = useState<
    PreparedConvexUpload[]
  >([])
  const [isImageDataCollapsed, setIsImageDataCollapsed] = useState(false)
  const [isDropzoneActive, setIsDropzoneActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [generating, setGenerating] = useState(false)

  const persistedUploadedPreviewSizes = useQuery(
    api.files.upload.existingPreviewSizes,
    report ? {author: authorId, sourceHash: report.sha256} : 'skip',
  )
  const allUploadedPreviewSizes = useMemo(
    () =>
      [
        ...new Set([
          ...(persistedUploadedPreviewSizes ?? []),
          ...uploadedPreviewSizes,
        ]),
      ]
        .filter((size) => Number.isFinite(size))
        .sort((a, b) => b - a),
    [persistedUploadedPreviewSizes, uploadedPreviewSizes],
  )

  const revokePreviewUrls = useCallback((items: CropPreview[]) => {
    for (const item of items) {
      URL.revokeObjectURL(item.url)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl)
      }
      revokePreviewUrls(previews)
    }
  }, [sourceImageUrl, previews, revokePreviewUrls])

  useEffect(() => {
    if (allUploadedPreviewSizes.length === 0) {
      return
    }

    const uploadedSet = new Set(allUploadedPreviewSizes)
    setSelectedPreviewSizes((previous) =>
      previous.filter((size) => !uploadedSet.has(size)),
    )
  }, [allUploadedPreviewSizes])

  const processSelectedFile = useCallback(
    async (selectedFile: File) => {
      setIsDropzoneActive(false)
      setLoadingReport(true)
      setError(null)
      setNotice(null)

      const nextSourceUrl = URL.createObjectURL(selectedFile)
      let resizedImageUrl: string | null = null

      try {
        const image = await loadImage(nextSourceUrl)
        const [sha256, resizeResult] = await Promise.all([
          createSha256(selectedFile),
          resizeImageForCropper(
            image,
            nextSourceUrl,
            selectedFile.type,
            selectedFile.size,
          ),
        ])

        resizedImageUrl = resizeResult.resizedImageUrl
        const width = resizeResult.width
        const height = resizeResult.height
        const minDimension = Math.min(width, height)
        const resizeScalePercent = `${((height / image.naturalHeight) * 100).toFixed(2)}%`

        setReport({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'unknown',
          sizeBytes: selectedFile.size,
          sizeHuman: formatBytes(selectedFile.size),
          resizedMimeType: resizeResult.mimeType,
          resizedSizeBytes: resizeResult.sizeBytes,
          resizedSizeHuman: formatBytes(resizeResult.sizeBytes),
          lastModified: new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(selectedFile.lastModified),
          originalWidth: image.naturalWidth,
          originalHeight: image.naturalHeight,
          width,
          height,
          resizeApplied: resizeResult.wasResized,
          resizeScalePercent,
          aspectRatio: formatAspectRatio(width, height),
          megapixels: ((width * height) / 1_000_000).toFixed(2),
          orientation: getOrientation(width, height),
          minDimension,
          hasPotentialAlpha: mimeSupportsAlpha(selectedFile.type),
          sha256,
        })

        setZoom(1)
        setCroppedAreaPixels(null)

        setPreviews((previous) => {
          revokePreviewUrls(previous)
          return []
        })
        setSelectedPreviewSizes([])
        setUploadedPreviewSizes([])
        setCustomFileNameBySize({})
        setTagsInput('')
        setPreparedUploads([])

        setSourceImageUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous)
          }
          return resizeResult.resizedImageUrl
        })

        if (resizeResult.wasResized) {
          URL.revokeObjectURL(nextSourceUrl)
          setNotice(
            `Image resized to ${width}x${height}px (height capped at ${RESIZE_TARGET_HEIGHT}px) before cropping.`,
          )
        } else {
          setNotice(
            `Image height is already <= ${RESIZE_TARGET_HEIGHT}px, so cropping uses the original size.`,
          )
        }

        if (minDimension < MIN_CROP_SIZE) {
          setError(
            `Resized image is too small for square crop. Minimum required is ${MIN_CROP_SIZE}x${MIN_CROP_SIZE}px.`,
          )
        }
      } catch {
        if (resizedImageUrl && resizedImageUrl !== nextSourceUrl) {
          URL.revokeObjectURL(resizedImageUrl)
        }
        URL.revokeObjectURL(nextSourceUrl)
        setError('Unable to read this image. Please choose another file.')
      } finally {
        setLoadingReport(false)
      }
    },
    [revokePreviewUrls],
  )

  const onFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (!selectedFile) {
        return
      }

      await processSelectedFile(selectedFile)
      event.target.value = ''
    },
    [processSelectedFile],
  )

  const onCropChange = useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const generatePreviews = useCallback(async () => {
    if (!sourceImageUrl || !report || !croppedAreaPixels) {
      return
    }

    if (report.minDimension < MIN_CROP_SIZE) {
      setError(
        `Resized image is too small for square crop. Minimum required is ${MIN_CROP_SIZE}x${MIN_CROP_SIZE}px.`,
      )
      return
    }

    setGenerating(true)
    setError(null)
    setNotice(null)

    try {
      const image = await loadImage(sourceImageUrl)
      const normalizedCrop = normalizeSquareCrop(
        croppedAreaPixels,
        report.width,
        report.height,
      )

      const normalizedSize = normalizedCrop.width
      const generatedSizes = PREVIEW_SIZES.filter(
        (size) => size <= normalizedSize,
      )
      const uniqueSizes = [...new Set([normalizedSize, ...generatedSizes])]
        .filter((size) => size >= MIN_CROP_SIZE && size <= MAX_CROP_SIZE)
        .sort((a, b) => b - a)

      const nextPreviews: CropPreview[] = []
      for (const size of uniqueSizes) {
        const blob = await createPreviewBlob(image, normalizedCrop, size)
        if (!blob) {
          continue
        }

        nextPreviews.push({
          size,
          url: URL.createObjectURL(blob),
          bytes: blob.size,
          mimeType: blob.type || 'image/jpeg',
          blob,
        })
      }

      setPreviews((previous) => {
        revokePreviewUrls(previous)
        return nextPreviews
      })
      setSelectedPreviewSizes([])
      setCustomFileNameBySize({})
      setPreparedUploads([])

      setNotice(
        `Crop normalized to ${normalizedSize}x${normalizedSize}px (square, constrained to ${MIN_CROP_SIZE}-${MAX_CROP_SIZE}px).`,
      )
    } catch {
      setError('Failed to generate crop previews. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [sourceImageUrl, report, croppedAreaPixels, revokePreviewUrls])

  const canGenerate = Boolean(
    sourceImageUrl &&
    report &&
    croppedAreaPixels &&
    report.minDimension >= MIN_CROP_SIZE &&
    !loadingReport,
  )

  const cropSelectionText = useMemo(() => {
    if (!croppedAreaPixels) {
      return 'No crop selected'
    }

    const selectedWidth = Math.round(croppedAreaPixels.width)
    const selectedHeight = Math.round(croppedAreaPixels.height)
    const normalizedSize = clamp(
      Math.round(Math.min(croppedAreaPixels.width, croppedAreaPixels.height)),
      MIN_CROP_SIZE,
      MAX_CROP_SIZE,
    )

    return `Selected: ${selectedWidth}x${selectedHeight}px, normalized output: ${normalizedSize}x${normalizedSize}px`
  }, [croppedAreaPixels])

  const cropSizeOverlayText = useMemo(() => {
    if (!croppedAreaPixels) {
      return 'Crop size: --'
    }

    const selectedWidth = Math.round(croppedAreaPixels.width)
    const selectedHeight = Math.round(croppedAreaPixels.height)
    return `${selectedWidth} x ${selectedHeight}`
  }, [croppedAreaPixels])

  const fileRef = useRef<HTMLInputElement>(null)

  const handleBrowse = () => {
    fileRef.current?.click()
  }

  const clearSelectedImage = useCallback(() => {
    setSourceImageUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return null
    })

    setPreviews((previous) => {
      revokePreviewUrls(previous)
      return []
    })
    setSelectedPreviewSizes([])
    setUploadedPreviewSizes([])
    setCustomFileNameBySize({})
    setTagsInput('')
    setPreparedUploads([])

    setReport(null)
    setCroppedAreaPixels(null)
    setZoom(1)
    setError(null)
    setNotice(null)
    setGenerating(false)

    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }, [revokePreviewUrls])

  const togglePreviewSelection = useCallback(
    (size: number) => {
      if (allUploadedPreviewSizes.includes(size)) {
        return
      }

      setSelectedPreviewSizes((previous) =>
        previous.includes(size)
          ? previous.filter((item) => item !== size)
          : [...previous, size],
      )
    },
    [allUploadedPreviewSizes],
  )

  const selectAllPreviews = useCallback(() => {
    setSelectedPreviewSizes(
      previews
        .map((preview) => preview.size)
        .filter((size) => !allUploadedPreviewSizes.includes(size)),
    )
  }, [previews, allUploadedPreviewSizes])

  const clearPreviewSelection = useCallback(() => {
    setSelectedPreviewSizes([])
  }, [])

  const parsedTags = useMemo(
    () =>
      [...new Set(tagsInput.split(',').map((tag) => tag.trim()))].filter(
        Boolean,
      ),
    [tagsInput],
  )

  const selectedUploadableCount = useMemo(
    () =>
      selectedPreviewSizes.filter(
        (size) => !allUploadedPreviewSizes.includes(size),
      ).length,
    [selectedPreviewSizes, allUploadedPreviewSizes],
  )

  const selectedUploadableSizes = useMemo(
    () =>
      [...selectedPreviewSizes]
        .filter((size) => !allUploadedPreviewSizes.includes(size))
        .sort((a, b) => b - a),
    [selectedPreviewSizes, allUploadedPreviewSizes],
  )

  const updateCustomFileName = useCallback((size: number, value: string) => {
    setCustomFileNameBySize((previous) => {
      const next = {...previous}
      const sanitized = sanitizeFileStem(value)

      if (!sanitized) {
        delete next[size]
      } else {
        next[size] = sanitized
      }

      return next
    })
  }, [])

  const preparedTotalBytes = useMemo(
    () => preparedUploads.reduce((total, item) => total + item.sizeBytes, 0),
    [preparedUploads],
  )

  const uploadSelectedToConvex = useCallback(async () => {
    if (!report || selectedPreviewSizes.length === 0) {
      return
    }

    const selectedSizeSet = new Set(selectedPreviewSizes)
    const selectedPreviews = previews.filter(
      (preview) =>
        selectedSizeSet.has(preview.size) &&
        !allUploadedPreviewSizes.includes(preview.size),
    )

    if (selectedPreviews.length === 0) {
      setNotice('Selected preview sizes are already uploaded.')
      return
    }

    const fileNameBase = getFileNameBase(report.fileName)
    const filesToUpload = selectedPreviews.map((preview) => {
      const extension = getExtensionFromMimeType(preview.mimeType)
      const overrideName = sanitizeFileStem(
        customFileNameBySize[preview.size] ?? '',
      )
      const fileStem =
        overrideName || `${fileNameBase}-sq-${preview.size}x${preview.size}`
      const fileName = `${fileStem}.${extension}`
      const file = new File([preview.blob], fileName, {
        type: preview.mimeType || 'application/octet-stream',
        lastModified: Date.now(),
      })

      return {
        previewSize: preview.size,
        fileName,
        file,
        mimeType: file.type,
        sizeBytes: file.size,
      }
    })

    setPreparedUploads(filesToUpload)
    setError(null)
    setNotice(
      `Uploading ${filesToUpload.length} preview${filesToUpload.length === 1 ? '' : 's'} to Convex...`,
    )

    try {
      const uploadedItems: PreparedConvexUpload[] = []
      for (const item of filesToUpload) {
        const {storageId, url} = await uploadFile(item.file)
        const autoTags = [
          `source:${report.sha256}`,
          `size:${item.previewSize}`,
          'gallery:optimized',
        ]
        const tags = [...new Set([...parsedTags, ...autoTags])]
        const fileRecord = (await registerUploadedFile({
          storageId: storageId as Id<'_storage'>,
          author: authorId,
          format: 'image',
          caption: item.fileName,
          tags,
          uploadedAt: Date.now(),
        })) as {duplicate: boolean; recordId: string}

        uploadedItems.push({
          ...item,
          storageId,
          storageUrl: url ?? null,
          duplicate: fileRecord.duplicate,
          fileRecordId: fileRecord.recordId,
        })
      }

      setPreparedUploads(uploadedItems)
      const uploadedSizes = uploadedItems.map((item) => item.previewSize)
      const uploadedSet = new Set(uploadedSizes)
      setUploadedPreviewSizes((previous) => [
        ...new Set([...previous, ...uploadedSizes]),
      ])
      setSelectedPreviewSizes((previous) =>
        previous.filter((size) => !uploadedSet.has(size)),
      )
      const duplicateCount = uploadedItems.filter(
        (item) => item.duplicate,
      ).length
      const insertedCount = uploadedItems.length - duplicateCount
      setNotice(
        duplicateCount > 0
          ? `Upload finished. ${insertedCount} new file${insertedCount === 1 ? '' : 's'} added, ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} skipped.`
          : `Uploaded ${uploadedItems.length} preview${uploadedItems.length === 1 ? '' : 's'} to Convex.`,
      )
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload selected previews to Convex.'
      setError(message)
    }
  }, [
    report,
    selectedPreviewSizes,
    previews,
    allUploadedPreviewSizes,
    customFileNameBySize,
    uploadFile,
    parsedTags,
    registerUploadedFile,
    authorId,
  ])

  const onDropZoneDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!isDropzoneActive) {
        setIsDropzoneActive(true)
      }
    },
    [isDropzoneActive],
  )

  const onDropZoneDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setIsDropzoneActive(false)
      }
    },
    [],
  )

  const onDropZoneDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDropzoneActive(false)
      const droppedFile = event.dataTransfer.files?.[0]
      if (!droppedFile) {
        return
      }

      await processSelectedFile(droppedFile)
    },
    [processSelectedFile],
  )

  const defaultFileNameBase = useMemo(
    () => getFileNameBase(report?.fileName ?? 'image'),
    [report?.fileName],
  )

  const renderPreviewCard = useCallback(
    (preview: CropPreview) => {
      const isSelected = selectedPreviewSizes.includes(preview.size)
      const isUploaded = allUploadedPreviewSizes.includes(preview.size)

      return (
        <button
          type='button'
          key={preview.size}
          onClick={() => togglePreviewSelection(preview.size)}
          disabled={isUploaded}
          className={cn(
            'relative overflow-hidden rounded-b-md rounded-t-3xl border-2 transition-colors',
            isUploaded
              ? 'cursor-not-allowed border-emerald-700/60 bg-emerald-900/20 opacity-70'
              : isSelected
                ? 'border-teal-400 bg-teal-400'
                : 'border-sidebar bg-sidebar',
          )}>
          <article>
            {isUploaded && (
              <span className='absolute top-2 left-2 z-20 rounded-full bg-emerald-800/80 px-2 py-0.5 text-[10px] font-medium text-white'>
                Uploaded
              </span>
            )}
            {isSelected && !isUploaded && (
              <span className='absolute top-2 right-2 z-20 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white'>
                <Icon name='check-fill' />
              </span>
            )}
            <HeroImage
              src={preview.url}
              alt={`Cropped ${preview.size}px preview`}
              className='aspect-square w-full object-cover'
            />
            <div className='flex items-start justify-between p-2 text-xs'>
              <p className='font-brk'>
                {preview.size} x {preview.size}
              </p>
              <div className='space-y-0.5 text-right'>
                <p className='opacity-70'>{formatBytes(preview.bytes)}</p>
                <p className='opacity-70'>
                  {preview.mimeType.split('/').pop()}
                </p>
              </div>
            </div>
          </article>
        </button>
      )
    },
    [selectedPreviewSizes, allUploadedPreviewSizes, togglePreviewSelection],
  )

  return (
    <div className='grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]'>
      <section className='space-y-4'>
        <div
          className={cn(
            'rounded-lg border border-sidebar transition-colors',
            isDropzoneActive && 'border-teal-400 bg-teal-400/10',
          )}
          onDragOver={onDropZoneDragOver}
          onDragLeave={onDropZoneDragLeave}
          onDrop={onDropZoneDrop}>
          {!sourceImageUrl ? (
              <div className='h-160 bg-sidebar flex items-center justify-center flex-col text-base opacity-70'>
              <Icon name='chute' className='size-20' />
                <p>Dropzone</p>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='relative'>
                <Button
                  isIconOnly
                  size='sm'
                  radius='full'
                  color='danger'
                  variant='solid'
                  onPress={clearSelectedImage}
                  className='absolute bg-dark-table -top-3 -right-3 z-20 hover:opacity-100'
                  aria-label='Clear selected image'>
                  <Icon name='x' />
                </Button>

                <Cropper
                  className='h-160 rounded-md bg-origin/30'
                  image={sourceImageUrl}
                  aspectRatio={1}
                  minZoom={1}
                  maxZoom={4}
                  zoom={zoom}
                  onCropChange={onCropChange}
                  onZoomChange={setZoom}>
                  <CropperDescription />
                  <CropperImage />
                  <CropperCropArea className='border-teal-400 flex items-end justify-end p-1'>
                    <span className='rounded-md bg-black/20 backdrop-blur-2xl px-2 py-1 text-[10px] font-brk font-medium text-white'>
                      {cropSizeOverlayText}
                    </span>
                  </CropperCropArea>
                </Cropper>
              </div>

              <div className='mx-auto flex w-full max-w-md items-center gap-2'>
                <EdgeSlider
                  min={1}
                  max={4}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(value) =>
                    setZoom(Array.isArray(value) ? (value[0] ?? 1) : value)
                  }
                  aria-label='Crop zoom'
                />
                <output className='w-12 text-right text-sm font-medium tabular-nums'>
                  {zoom.toFixed(1)}x
                </output>
              </div>
            </div>
          )}
        </div>
        <SectionCard>
          <div className='flex items-center justify-between'>
            <div className=''>
              <label htmlFor='image-selector' className='mb-2 block'>
                <SectionTitle>Image Cropper</SectionTitle>
              </label>
              {!sourceImageUrl && (
                <input
                  id='image-selector'
                  ref={fileRef}
                  type='file'
                  accept='image/*'
                  className='hidden _block w-full cursor-pointer rounded-md border border-white/20 bg-black/25 p-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-origin file:px-3 file:py-1.5 file:text-sm file:font-medium'
                  onChange={onFileChange}
                />
              )}
              <SectionDesc>
                {cropSelectionText
                  ? cropSelectionText
                  : 'Resized to max 1000 px height, then cropped as square.'}
              </SectionDesc>
            </div>

            {!sourceImageUrl ? (
              <Button
                radius='none'
                color='primary'
                variant='solid'
                onPress={handleBrowse}
                className='rounded-md bg-dark-table'>
                Select Image
              </Button>
            ) : (
              <Button
                radius='none'
                color='primary'
                variant='solid'
                onPress={generatePreviews}
                isDisabled={!canGenerate}
                className='rounded-md bg-dark-table'
                isLoading={generating}>
                Generate Previews
              </Button>
            )}
          </div>
        </SectionCard>
      </section>

      <aside className='space-y-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1'>
        <SectionCard>
          <div className='flex items-center justify-between gap-2'>
            <SectionTitle>Image Data</SectionTitle>
            <Button
              size='sm'
              radius='none'
              isIconOnly
              variant='flat'
              className='rounded-md bg-transparent'
              onPress={() => setIsImageDataCollapsed((previous) => !previous)}>
              {isImageDataCollapsed ? (
                <Icon name='chevron-down' className='size-3' />
              ) : (
                <Icon name='chevron-down' className='rotate-90 size-3' />
              )}
            </Button>
          </div>

          {!isImageDataCollapsed && (
            <>
              {loadingReport && (
                <SectionDesc>Reading image metadata...</SectionDesc>
              )}
              {!loadingReport && !report && (
                <SectionDesc>
                  No image selected. Metadata will appear here before
                  optimization.
                </SectionDesc>
              )}
              {report && (
                <dl className='mt-3 space-y-2 text-sm'>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>File name</dt>
                    <dd className='break-all'>{report.fileName}</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Source MIME</dt>
                    <dd>{report.mimeType}</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Source size</dt>
                    <dd>
                      {report.sizeHuman} ({report.sizeBytes.toLocaleString()}{' '}
                      bytes)
                    </dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Resized MIME</dt>
                    <dd>{report.resizedMimeType}</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Resized size</dt>
                    <dd>
                      {report.resizedSizeHuman} (
                      {report.resizedSizeBytes.toLocaleString()} bytes)
                    </dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Last modified</dt>
                    <dd>{report.lastModified}</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Source dims</dt>
                    <dd>
                      {report.originalWidth}x{report.originalHeight}px
                    </dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Resized dims</dt>
                    <dd>
                      {report.width}x{report.height}px
                    </dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Resize scale</dt>
                    <dd>{report.resizeScalePercent}</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Aspect ratio</dt>
                    <dd>{report.aspectRatio}</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Megapixels</dt>
                    <dd>{report.megapixels} MP</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Orientation</dt>
                    <dd>{report.orientation}</dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Alpha channel</dt>
                    <dd>
                      {report.hasPotentialAlpha ? 'Possible' : 'Not expected'}
                    </dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>SHA-256</dt>
                    <dd className='break-all font-mono text-xs leading-relaxed truncate'>
                      {report.sha256}
                    </dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Crop constraints</dt>
                    <dd>
                      max {RESIZE_TARGET_HEIGHT}px height, square (
                      {MIN_CROP_SIZE}px to {MAX_CROP_SIZE}px)
                    </dd>
                  </div>
                  <div className='grid grid-cols-[9rem_1fr] gap-2'>
                    <dt className='opacity-60'>Resize applied</dt>
                    <dd>{report.resizeApplied ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              )}
              {notice && (
                <p className='mt-3 text-xs text-emerald-600'>{notice}</p>
              )}
              {error && <p className='mt-3 text-xs text-danger'>{error}</p>}
            </>
          )}
        </SectionCard>

        <SectionCard>
          <div className='flex items-center justify-between gap-2'>
            <SectionTitle>Cropped Size Previews</SectionTitle>
            {previews.length > 0 && (
              <p className='text-xs opacity-70'>
                {selectedUploadableCount} ready ·{' '}
                {allUploadedPreviewSizes.length} uploaded
              </p>
            )}
          </div>

          {!previews.length ? (
            <p className='mt-3 text-sm opacity-70'>
              Generate previews to see optimized square crops at multiple sizes.
            </p>
          ) : (
            <div className='mt-3 space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    radius='none'
                    variant='solid'
                    color='primary'
                    onPress={selectAllPreviews}
                    className='rounded-md bg-dark-table'>
                    Select All
                  </Button>

                  <Button
                    size='sm'
                    radius='none'
                    variant='solid'
                    color='primary'
                    onPress={uploadSelectedToConvex}
                    isDisabled={
                      selectedUploadableCount === 0 || !report || isUploading
                    }
                    isLoading={isUploading}
                    className='rounded-md bg-dark-table'>
                    Upload &nbsp;&middot;&nbsp; {selectedUploadableCount}
                  </Button>
                </div>
                <Button
                  size='sm'
                  radius='none'
                  variant='flat'
                  onPress={clearPreviewSelection}
                  isDisabled={selectedPreviewSizes.length === 0}
                  className='rounded-md'>
                  Clear
                </Button>
              </div>

              <div className='space-y-3 rounded-md border border-sidebar bg-sidebar/40 p-3'>
                <div className='space-y-1'>
                  <label htmlFor='preview-tags' className='text-xs opacity-70'>
                    Tags (comma separated)
                  </label>
                  <input
                    id='preview-tags'
                    type='text'
                    value={tagsInput}
                    onChange={(event) => setTagsInput(event.target.value)}
                    placeholder='homepage, hero, launch'
                    className='w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm outline-none focus:border-teal-400'
                  />
                  <p className='text-[11px] opacity-55'>
                    Auto tags include source hash, preview size, and{' '}
                    `gallery:optimized`.
                  </p>
                </div>

                {selectedUploadableSizes.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-xs opacity-70'>
                      File names for selected previews (no extension):
                    </p>
                    <div className='grid gap-2'>
                      {selectedUploadableSizes.map((size) => (
                        <label
                          key={size}
                          className='grid grid-cols-[82px_1fr] items-center gap-2 text-xs'>
                          <span className='font-brk opacity-75'>
                            {size} x {size}
                          </span>
                          <input
                            type='text'
                            value={customFileNameBySize[size] ?? ''}
                            onChange={(event) =>
                              updateCustomFileName(size, event.target.value)
                            }
                            placeholder={`${defaultFileNameBase}-sq-${size}x${size}`}
                            className='w-full rounded-md border border-white/20 bg-black/25 px-3 py-1.5 text-xs outline-none focus:border-teal-400'
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  {previews.map((preview) => renderPreviewCard(preview))}
                </div>
                <div className='grid grid-cols-1 gap-3'>
                  {previews.map((preview) => renderPreviewCard(preview))}
                </div>
              </div>

              <div className='rounded-md border border-sidebar bg-sidebar/40 p-3'>
                <p className='text-xs opacity-70'>
                  {preparedUploads.length > 0
                    ? `${preparedUploads.length} file${preparedUploads.length === 1 ? '' : 's'} in queue (${formatBytes(preparedTotalBytes)} total).`
                    : 'Select previews, then click "Upload" to push them to Convex storage.'}
                </p>
                {preparedUploads.length > 0 && (
                  <div className='mt-2 grid gap-2'>
                    {preparedUploads.map((prepared) => (
                      <div
                        key={prepared.previewSize}
                        className='grid grid-cols-[1fr_auto] items-start gap-2 text-xs'>
                        <div className='min-w-0'>
                          <p className='truncate font-brk'>
                            {prepared.fileName}
                          </p>
                          {prepared.storageId && (
                            <p className='truncate opacity-70'>
                              storageId: {prepared.storageId}
                            </p>
                          )}
                          {prepared.fileRecordId && (
                            <p className='truncate opacity-70'>
                              fileId: {prepared.fileRecordId}
                            </p>
                          )}
                          {prepared.duplicate && (
                            <p className='text-[11px] text-amber-500'>
                              Duplicate detected. Existing gallery record
                              reused.
                            </p>
                          )}
                        </div>
                        <p className='text-right opacity-70'>
                          {formatBytes(prepared.sizeBytes)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SectionCard>
        <div className='h-44 w-full' />
      </aside>
    </div>
  )
}

const SectionCard = ({children}: PropsWithChildren) => (
  <section className='rounded-lg bg-sidebar/20 shadow-px border border-sidebar p-4'>
    {children}
  </section>
)
const SectionTitle = ({children}: PropsWithChildren) => (
  <h2 className='text-base font-okxs'>{children}</h2>
)

const SectionDesc = ({children}: PropsWithChildren) => (
  <p className='mt-2 text-sm opacity-60'>{children} </p>
)
