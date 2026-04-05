'use client'

import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/app/admin/_components/ui/cropper'
import {Alert, AlertDescription, AlertTitle} from '@/components/reui/alert'
import {EdgeSlider} from '@/components/ui/slider'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Input, Textarea as TextArea} from '@heroui/input'
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useMemo, useState} from 'react'


import {LegacyImage as Image} from '@/components/ui/legacy-image'

const ModalContent = Modal.Container

type Area = {x: number; y: number; width: number; height: number}

type SourceReport = {
  fileName: string
  mimeType: string
  sizeBytes: number
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  resizedSizeBytes: number
  resizedMimeType: string
  resizeApplied: boolean
  minDimension: number
  sha256: string
}

type ResizeResult = {
  resizedImageUrl: string
  width: number
  height: number
  sizeBytes: number
  mimeType: string
  wasResized: boolean
}

type GeneratedPreview = {
  blob: Blob
  bytes: number
  cropKey: string
  cropSize: number
  mimeType: string
  url: string
}

type PrimaryImageConverterModalProps = {
  categorySlug?: string | null
  isOpen: boolean
  onConvertedAction?: (result: {storageId: string; url: string | null}) => void
  onOpenChangeAction: (isOpen: boolean) => void
  productBrands?: string[]
  sourceUrl: string | null
  suggestedFileNameStem?: string | null
}

const OUTPUT_SIZE = 1000
const MIN_CROP_SIZE = 300
const MAX_CROP_SIZE = 1000
const MIN_UPLOAD_DIMENSION = 300
const MAX_UPLOAD_DIMENSION = 1000

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

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

const sanitizeFileStem = (value: string) =>
  value.replace(/\.[^/.]+$/, '').trim()

const getFileNameBase = (fileName: string) => {
  const cleaned = fileName.replace(/\.[^/.]+$/, '')
  return cleaned.trim() || 'image'
}

const buildSuggestedFileStem = (
  preferredName: string | null | undefined,
  fileName: string,
) => {
  const preferredBase = sanitizeFileStem(preferredName ?? '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()
  const fallbackBase = getFileNameBase(fileName)
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()

  return `${preferredBase || fallbackBase || 'image'}-sq-${OUTPUT_SIZE}`
}

const getExtensionFromMimeType = (mimeType: string) => {
  const subtype = mimeType.split('/').pop()?.toLowerCase() || 'bin'
  if (subtype === 'jpeg') {
    return 'jpg'
  }

  return subtype.split('+')[0] ?? subtype
}

const mimeSupportsAlpha = (mimeType: string) =>
  /image\/(png|webp|gif|avif)/i.test(mimeType)

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()
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

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })

const hasAllowedUploadDimensions = (width: number, height: number) =>
  width >= MIN_UPLOAD_DIMENSION &&
  width <= MAX_UPLOAD_DIMENSION &&
  height >= MIN_UPLOAD_DIMENSION &&
  height <= MAX_UPLOAD_DIMENSION

const resizeImageForCropper = async (
  image: HTMLImageElement,
  sourceImageUrl: string,
  sourceMimeType: string,
  sourceSizeBytes: number,
): Promise<ResizeResult> => {
  const normalizedSourceMime = sourceMimeType || 'image/jpeg'
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight)

  if (longestEdge <= MAX_UPLOAD_DIMENSION) {
    return {
      resizedImageUrl: sourceImageUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
      sizeBytes: sourceSizeBytes,
      mimeType: normalizedSourceMime,
      wasResized: false,
    }
  }

  const scale = MAX_UPLOAD_DIMENSION / longestEdge
  const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))
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

const normalizeTagValue = (value: string | null | undefined) =>
  value?.trim() ?? ''

const buildInitialTags = (
  categorySlug: string | null | undefined,
  productBrands: string[] | undefined,
) =>
  [
    ...new Set([
      normalizeTagValue(categorySlug),
      ...(productBrands ?? []).map(normalizeTagValue),
    ]),
  ]
    .filter(Boolean)
    .join(', ')
    .replaceAll('-', ' ')

export function PrimaryImageConverterModal({
  categorySlug,
  isOpen,
  onConvertedAction,
  onOpenChangeAction,
  productBrands,
  sourceUrl,
  suggestedFileNameStem,
}: PrimaryImageConverterModalProps) {
  const {user} = useAuthCtx()
  const {uploadFile, isUploading} = useStorageUpload({
    optimizeImages: false,
  })
  const registerUploadedFile = useMutation(api.files.upload.file)
  const authorId = user?.uid ?? 'anonymous-admin'

  const [workingSourceUrl, setWorkingSourceUrl] = useState<string | null>(null)
  const [report, setReport] = useState<SourceReport | null>(null)
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [preview, setPreview] = useState<GeneratedPreview | null>(null)
  const [fileNameStem, setFileNameStem] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loadingSource, setLoadingSource] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (workingSourceUrl) {
        URL.revokeObjectURL(workingSourceUrl)
      }
    }
  }, [workingSourceUrl])

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
    }
  }, [preview?.url])

  useEffect(() => {
    if (isOpen) {
      return
    }

    setWorkingSourceUrl(null)
    setReport(null)
    setZoom(1)
    setCroppedAreaPixels(null)
    setPreview(null)
    setFileNameStem('')
    setTagsInput('')
    setLoadingSource(false)
    setIsGenerating(false)
    setIsSubmitting(false)
    setErrorMessage(null)
    setNotice(null)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!sourceUrl) {
      setErrorMessage('Select a primary image before opening the converter.')
      setNotice(null)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const prepareSourceImage = async () => {
      setLoadingSource(true)
      setErrorMessage(null)
      setNotice('Loading the current primary image...')
      setPreview(null)

      try {
        const response = await fetch(sourceUrl, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load the current primary image.')
        }

        const blob = await response.blob()
        const mimeType = blob.type || 'image/jpeg'
        const sourceFile = new File(
          [blob],
          `${sanitizeFileStem(suggestedFileNameStem ?? 'product-primary') || 'product-primary'}.${getExtensionFromMimeType(mimeType)}`,
          {
            type: mimeType,
            lastModified: Date.now(),
          },
        )
        const localSourceUrl = URL.createObjectURL(sourceFile)
        let processedSourceUrl: string | null = null

        try {
          const image = await loadImage(localSourceUrl)
          const [sha256, resizeResult] = await Promise.all([
            createSha256(sourceFile),
            resizeImageForCropper(
              image,
              localSourceUrl,
              sourceFile.type,
              sourceFile.size,
            ),
          ])

          if (cancelled) {
            if (resizeResult.resizedImageUrl !== localSourceUrl) {
              URL.revokeObjectURL(resizeResult.resizedImageUrl)
            }
            if (!resizeResult.wasResized) {
              URL.revokeObjectURL(localSourceUrl)
            }
            return
          }

          processedSourceUrl = resizeResult.resizedImageUrl
          setWorkingSourceUrl((current) => {
            if (current) {
              URL.revokeObjectURL(current)
            }
            return resizeResult.resizedImageUrl
          })
          setReport({
            fileName: sourceFile.name,
            mimeType: sourceFile.type || 'image/jpeg',
            sizeBytes: sourceFile.size,
            width: resizeResult.width,
            height: resizeResult.height,
            originalWidth: image.naturalWidth,
            originalHeight: image.naturalHeight,
            resizedSizeBytes: resizeResult.sizeBytes,
            resizedMimeType: resizeResult.mimeType,
            resizeApplied: resizeResult.wasResized,
            minDimension: Math.min(resizeResult.width, resizeResult.height),
            sha256,
          })
          setZoom(1)
          setCroppedAreaPixels(null)
          setFileNameStem(
            buildSuggestedFileStem(suggestedFileNameStem, sourceFile.name),
          )
          setTagsInput(buildInitialTags(categorySlug, productBrands))
          setErrorMessage(
            !hasAllowedUploadDimensions(resizeResult.width, resizeResult.height)
              ? `Only images between ${MIN_UPLOAD_DIMENSION}px and ${MAX_UPLOAD_DIMENSION}px on both width and height can be uploaded.`
              : null,
          )
          setNotice(
            resizeResult.wasResized
              ? `Image normalized to ${resizeResult.width}x${resizeResult.height}px before cropping.`
              : 'Image is ready to crop and convert.',
          )

          if (resizeResult.wasResized) {
            URL.revokeObjectURL(localSourceUrl)
          }
        } catch (error) {
          if (!processedSourceUrl) {
            URL.revokeObjectURL(localSourceUrl)
          }
          throw error
        }
      } catch (error) {
        if (cancelled || controller.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to prepare the current primary image.',
        )
        setNotice(null)
      } finally {
        if (!cancelled) {
          setLoadingSource(false)
        }
      }
    }

    void prepareSourceImage()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [categorySlug, isOpen, productBrands, sourceUrl, suggestedFileNameStem])

  const normalizedCrop = useMemo(() => {
    if (!report || !croppedAreaPixels) {
      return null
    }

    return normalizeSquareCrop(croppedAreaPixels, report.width, report.height)
  }, [croppedAreaPixels, report])

  const currentCropKey = useMemo(() => {
    if (!normalizedCrop) {
      return null
    }

    return [
      normalizedCrop.x,
      normalizedCrop.y,
      normalizedCrop.width,
      normalizedCrop.height,
    ].join(':')
  }, [normalizedCrop])

  const previewDirty = Boolean(preview && currentCropKey !== preview.cropKey)

  const cropOverlayText = useMemo(() => {
    if (!croppedAreaPixels) {
      return 'Crop size: --'
    }

    return `${Math.round(croppedAreaPixels.width)} x ${Math.round(croppedAreaPixels.height)}`
  }, [croppedAreaPixels])

  // const cropDetailText = useMemo(() => {
  //   if (!normalizedCrop) {
  //     return `Move and zoom the crop, then generate a ${OUTPUT_SIZE}x${OUTPUT_SIZE} preview.`
  //   }

  //   if (normalizedCrop.width < OUTPUT_SIZE) {
  //     return `Selected square uses ${normalizedCrop.width}x${normalizedCrop.height}px and will upscale to ${OUTPUT_SIZE}x${OUTPUT_SIZE}.`
  //   }

  //   return `Selected square exports natively at ${OUTPUT_SIZE}x${OUTPUT_SIZE}.`
  // }, [normalizedCrop])

  const normalizedBrandTags = useMemo(
    () =>
      [...new Set((productBrands ?? []).map(normalizeTagValue))].filter(
        Boolean,
      ),
    [productBrands],
  )

  const hasValidUploadDimensions = useMemo(
    () =>
      report ? hasAllowedUploadDimensions(report.width, report.height) : false,
    [report],
  )

  const parsedTags = useMemo(
    () =>
      [...new Set(tagsInput.split(/[\n,]/).map((tag) => tag.trim()))].filter(
        Boolean,
      ),
    [tagsInput],
  )

  const generatePreview = useCallback(async () => {
    if (!workingSourceUrl || !normalizedCrop || !currentCropKey) {
      throw new Error('Pick a crop before generating a preview.')
    }

    if (report && !hasAllowedUploadDimensions(report.width, report.height)) {
      throw new Error(
        `Only images between ${MIN_UPLOAD_DIMENSION}px and ${MAX_UPLOAD_DIMENSION}px on both width and height can be uploaded.`,
      )
    }

    setIsGenerating(true)
    setErrorMessage(null)

    try {
      const image = await loadImage(workingSourceUrl)
      const blob = await createPreviewBlob(image, normalizedCrop, OUTPUT_SIZE)

      if (!blob) {
        throw new Error('Failed to generate the 1000x1000 preview.')
      }

      const nextPreview: GeneratedPreview = {
        blob,
        bytes: blob.size,
        cropKey: currentCropKey,
        cropSize: normalizedCrop.width,
        mimeType: blob.type || 'image/jpeg',
        url: URL.createObjectURL(blob),
      }

      setPreview((current) => {
        if (current?.url) {
          URL.revokeObjectURL(current.url)
        }
        return nextPreview
      })
      setNotice(
        normalizedCrop.width < OUTPUT_SIZE
          ? `Preview refreshed. Source crop is ${normalizedCrop.width}x${normalizedCrop.height}px and was scaled to ${OUTPUT_SIZE}x${OUTPUT_SIZE}.`
          : `Preview refreshed at ${OUTPUT_SIZE}x${OUTPUT_SIZE}.`,
      )

      return nextPreview
    } finally {
      setIsGenerating(false)
    }
  }, [currentCropKey, normalizedCrop, report, workingSourceUrl])

  const handleSubmit = useCallback(async () => {
    if (!report) {
      return
    }

    if (!hasAllowedUploadDimensions(report.width, report.height)) {
      setErrorMessage(
        `Only images between ${MIN_UPLOAD_DIMENSION}px and ${MAX_UPLOAD_DIMENSION}px on both width and height can be uploaded.`,
      )
      return
    }

    const sanitizedStem = sanitizeFileStem(fileNameStem)
    if (!sanitizedStem) {
      setErrorMessage('Enter a file name for the converted image.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const nextPreview =
        preview && !previewDirty ? preview : await generatePreview()
      const extension = getExtensionFromMimeType(nextPreview.mimeType)
      const fileName = `${sanitizedStem}.${extension}`
      const file = new File([nextPreview.blob], fileName, {
        type: nextPreview.mimeType || 'application/octet-stream',
        lastModified: Date.now(),
      })
      const {storageId, url} = await uploadFile(file)

      const tags = [
        ...new Set([
          ...parsedTags,
          ...normalizedBrandTags,
          'gallery:optimized',
          `source:${report.sha256}`,
          `size:${OUTPUT_SIZE}:primary:${Date.now()}`,
        ]),
      ]

      const fileRecord = (await registerUploadedFile({
        storageId: storageId as Id<'_storage'>,
        author: authorId,
        format: 'image',
        caption: fileName,
        tags,
        uploadedAt: Date.now(),
      })) as {duplicate: boolean}

      if (fileRecord.duplicate) {
        throw new Error(
          'This converted image matched an existing managed upload. Adjust the crop and try again.',
        )
      }

      setNotice('Converted image uploaded and applied as the new primary.')
      onConvertedAction?.({storageId, url})
      onOpenChangeAction(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to upload the converted image.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    authorId,
    fileNameStem,
    generatePreview,
    normalizedBrandTags,
    onConvertedAction,
    onOpenChangeAction,
    parsedTags,
    preview,
    previewDirty,
    registerUploadedFile,
    report,
    uploadFile,
  ])

  const canGeneratePreview = Boolean(
    workingSourceUrl &&
    normalizedCrop &&
    report &&
    hasValidUploadDimensions &&
    !loadingSource &&
    !isSubmitting,
  )
  const canSubmit = Boolean(
    workingSourceUrl &&
    normalizedCrop &&
    report &&
    hasValidUploadDimensions &&
    sanitizeFileStem(fileNameStem).length > 0 &&
    !loadingSource &&
    !isGenerating &&
    !isUploading &&
    !isSubmitting,
  )

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChangeAction}>
      <ModalContent size='cover' placement='top' scroll='inside' className='overflow-hidden border border-foreground/10 bg-background shadow-2xl'>
        <ModalHeader className='border-b border-foreground/10 pb-4'>
          <div className='space-y-1'>
            <p className='text-xs font-medium uppercase tracking-[0.24em] text-light-brand'>
              Primary Image Converter
            </p>
            <div>
              <h3 className='text-lg font-clash font-normal'>
                Convert Current Primary Image
              </h3>
              <p className='text-sm text-foreground/65 font-normal'>
                Crop the existing lead image, export one optimized {OUTPUT_SIZE}
                x{OUTPUT_SIZE} asset, then replace the current primary.
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className='gap-5 py-5'>
          {errorMessage ? (
            <Alert variant='destructive'>
              <AlertTitle>Converter error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className='grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]'>
            <section className='space-y-4'>
              <div
                className={cn(
                  'relative overflow-hidden rounded-[1.25rem] border bg-background',
                  loadingSource ? 'border-cyan-500/30' : 'border-foreground/10',
                )}>
                {workingSourceUrl ? (
                  <>
                    <Cropper
                      className='h-96 bg-black/60 md:h-120'
                      image={workingSourceUrl}
                      aspectRatio={1}
                      minZoom={-0.3}
                      maxZoom={2}
                      zoom={zoom}
                      onCropChange={setCroppedAreaPixels}
                      onZoomChange={setZoom}>
                      <CropperDescription />
                      <CropperImage />
                      <CropperCropArea className='flex items-end justify-end border-cyan-400 p-1.5'>
                        <span className='rounded-md bg-black/45 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-md'>
                          {cropOverlayText}
                        </span>
                      </CropperCropArea>
                    </Cropper>
                    <div className='border-t border-foreground/10 px-4 py-3'>
                      <div className='mx-auto flex w-full max-w-lg items-center gap-3'>
                        <EdgeSlider
                          min={0.8}
                          max={4}
                          step={0.01}
                          value={[zoom]}
                          onValueChange={(value) =>
                            setZoom(
                              Array.isArray(value) ? (value[0] ?? 1) : value,
                            )
                          }
                          aria-label='Converter crop zoom'
                        />
                        <output className='w-14 text-right text-sm font-medium tabular-nums text-foreground/80'>
                          {zoom.toFixed(2)}x
                        </output>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='flex h-96 flex-col items-center justify-center gap-3 bg-foreground/5 px-6 text-center text-foreground/55 md:h-120'>
                    <div className='flex size-14 items-center justify-center rounded-full bg-foreground/6'>
                      <Icon name='image-open-light' className='size-7' />
                    </div>
                    <div className='space-y-1'>
                      <p className='text-sm font-medium'>
                        {loadingSource
                          ? 'Preparing primary image...'
                          : 'No primary image available'}
                      </p>
                      <p className='text-xs text-foreground/50'>
                        The converter uses the current lead image as its source.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className='grid gap-3 rounded-[1.25rem] border border-foreground/10 bg-background/70 p-4 sm:grid-cols-3'>
                <div className='space-y-1'>
                  <p className='text-[8px] font-medium uppercase tracking-[0.16em] text-foreground/45'>
                    Original
                  </p>
                  <p className='text-sm font-ios text-foreground/85 tracking-tight'>
                    <span>{report ? report.originalWidth : '--'}</span>
                    <span className='text-[8px] px-1'>✕</span>

                    <span>{report ? report.originalHeight : '--'}</span>
                    <span className='text-[9px] px-2'>px</span>
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-[8px] font-medium uppercase tracking-[0.16em] text-foreground/50'>
                    Working Canvas
                  </p>

                  <p className='text-sm font-ios text-foreground/85 tracking-tight'>
                    <span>{report ? report.width : '--'}</span>
                    <span className='text-[8px] px-1'>✕</span>

                    <span>{report ? report.height : '--'}</span>
                    <span className='text-[9px] px-2'>px</span>
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-[8px] font-medium uppercase tracking-[0.16em] text-foreground/50'>
                    Output
                  </p>
                  <p className='text-sm font-ios text-foreground/85 tracking-tight'>
                    <span>{OUTPUT_SIZE}</span>
                    <span className='text-[8px] px-1'>✕</span>
                    <span>{OUTPUT_SIZE}</span>
                    <span className='text-[9px] px-2'>px</span>
                  </p>
                </div>
              </div>
            </section>

            <aside className='space-y-4'>
              <div className='overflow-hidden rounded-[1.25rem] border border-foreground/10 bg-background/80'>
                <div className='flex items-center justify-between border-b border-foreground/10 px-4 py-3'>
                  <div>
                    <p className='text-[8px] font-medium uppercase tracking-[0.16em] text-foreground/50'>
                      Output Preview
                    </p>
                    {notice ? (
                      <div className='text-xs text-cyan-700 dark:text-cyan-200'>
                        {notice}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    size='sm'
                    variant='tertiary'
                    className='rounded-md bg-cyan-500 text-white'
                    isDisabled={!canGeneratePreview}
                    onPress={() => {
                      void generatePreview()
                    }}>
                    <span className=' px-3!'>Generate</span>
                  </Button>
                </div>

                <div className='p-4'>
                  <div className='relative aspect-square overflow-hidden rounded-[1.15rem] border border-foreground/10 bg-foreground/5'>
                    {preview?.url ? (
                      <Image
                        src={preview.url}
                        alt='Converted preview'
                        radius='none'
                        shadow='none'
                        className='size-full object-cover'
                      />
                    ) : (
                      <div className='flex size-full flex-col items-center justify-center gap-2 text-center text-foreground/45'>
                        <Icon
                          name='lightning'
                          className='size-8 text-cyan-500'
                        />
                        <p className='text-sm font-medium'>
                          Generate a preview to inspect the 1000x1000 result.
                        </p>
                      </div>
                    )}

                    {previewDirty ? (
                      <div className='absolute inset-x-3 bottom-3 rounded-lg bg-black/65 px-3 py-2 text-xs text-white backdrop-blur-md'>
                        Crop changed. Refresh the preview before uploading if
                        you want to verify the latest selection.
                      </div>
                    ) : null}
                  </div>

                  <div className='mt-3 flex items-center justify-between text-xs text-foreground/55'>
                    <span className='font-ios'>
                      {preview ? formatBytes(preview.bytes) : 'No preview yet'}
                    </span>
                    <span className='text-emerald-500 font-semibold'>
                      {preview ? `n²` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='space-y-4 rounded-[1.25rem] border border-foreground/10 bg-background/80 p-4'>
                <Input
                  label='File name'
                  labelPlacement='outside'
                  placeholder='converted-primary-sq-1000'
                  value={fileNameStem}
                  onValueChange={setFileNameStem}
                  description='The file extension is added automatically when uploaded.'
                  classNames={{
                    inputWrapper:
                      'rounded-xl border border-foreground/12 bg-background shadow-none',
                  }}
                />

                <TextArea
                  label='Tags'
                  labelPlacement='outside'
                  minRows={3}
                  placeholder='flower, indoor, featured'
                  value={tagsInput}
                  onValueChange={setTagsInput}
                  description='Separate tags with commas or new lines. gallery:optimized is added automatically.'
                  classNames={{
                    inputWrapper:
                      'rounded-xl border border-foreground/12 bg-background shadow-none',
                  }}
                />

                <div className='rounded-xl border border-foreground/10 bg-foreground/3 p-3 text-sm text-foreground/65'>
                  <div className='flex items-center justify-between gap-3'>
                    <span className='font-ios text-xs'>Source file</span>
                    <span className='font-medium text-foreground/80'>
                      {report ? formatBytes(report.sizeBytes) : '--'}
                    </span>
                  </div>
                  <div className='mt-2 flex items-center justify-between gap-3'>
                    <span className='font-ios text-xs'>Working file</span>
                    <span className='font-medium text-foreground/80'>
                      {report ? formatBytes(report.resizedSizeBytes) : '--'}
                    </span>
                  </div>
                  <div className='mt-2 flex items-center justify-between gap-3'>
                    <span className='font-ios text-xs'>Format</span>
                    <span className='font-medium text-foreground/80'>
                      {report?.resizedMimeType ?? report?.mimeType ?? '--'}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </ModalBody>

        <ModalFooter className='border-t border-foreground/10 bg-background/90'>
          <Button variant='tertiary' onPress={() => onOpenChangeAction(false)}>
            Cancel
          </Button>
          <Button
            className='rounded-xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
            isDisabled={!canSubmit}
            onPress={() => {
              void handleSubmit()
            }}>
            Upload and Replace Primary
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
