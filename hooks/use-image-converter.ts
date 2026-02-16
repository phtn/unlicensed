import {useCallback, useRef} from 'react'

interface ConversionOptions {
  format: 'avif' | 'webp' | 'jpeg'
  quality?: number
}

interface ConversionResult {
  blob: Blob
  size: number
  format: string
  originalSize: number
  compressionRatio: number
}

interface WorkerConversionRequest {
  id: string
  file: Blob
  format: ConversionOptions['format']
  quality?: number
}

interface WorkerConversionResponse {
  id: string
  blob: Blob
  size: number
  format: string
}

interface WorkerErrorResponse {
  id: string
  error: string
}

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useImageConverter() {
  const workerRef = useRef<Worker | null>(null)

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../public/workers/image-converter.worker.ts', import.meta.url),
      )
    }
    return workerRef.current
  }, [])

  const convertOnMainThread = useCallback(
    async (
      file: File,
      options: ConversionOptions,
    ): Promise<Pick<ConversionResult, 'blob' | 'size' | 'format'>> => {
      const imageBitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        imageBitmap.close()
        throw new Error('Failed to get canvas context')
      }

      ctx.drawImage(imageBitmap, 0, 0)
      imageBitmap.close()

      const mimeType = `image/${options.format}`
      const quality = options.quality ?? 0.8

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(new Error('Canvas conversion failed'))
              return
            }
            resolve(result)
          },
          mimeType,
          quality,
        )
      })

      return {
        blob,
        size: blob.size,
        format: mimeType,
      }
    },
    [],
  )

  const verifyBlob = useCallback(async (blob: Blob) => {
    if (blob.size <= 0) {
      throw new Error('Converted image is empty')
    }
    const imageBitmap = await createImageBitmap(blob)
    imageBitmap.close()
  }, [])

  const convert = useCallback(
    async (
      file: File,
      options: ConversionOptions,
    ): Promise<ConversionResult> => {
      const requestId = createRequestId()

      const workerResult = await new Promise<
        Pick<ConversionResult, 'blob' | 'size' | 'format'>
      >((resolve, reject) => {
        const worker = initWorker()
        let timeoutId: ReturnType<typeof setTimeout> | null = null

        const cleanup = (
          handleMessage: (event: MessageEvent<unknown>) => void,
          handleError: (error: ErrorEvent) => void,
        ) => {
          worker.removeEventListener('message', handleMessage)
          worker.removeEventListener('error', handleError)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }

        const handleMessage = (event: MessageEvent<unknown>) => {
          const data = event.data as
            | WorkerConversionResponse
            | WorkerErrorResponse
            | undefined

          if (!data || data.id !== requestId) {
            return
          }

          cleanup(handleMessage, handleError)

          if ('error' in data) {
            reject(new Error(data.error))
            return
          }

          resolve({
            blob: data.blob,
            size: data.size,
            format: data.format,
          })
        }

        const handleError = (error: ErrorEvent) => {
          cleanup(handleMessage, handleError)
          reject(error)
        }

        worker.addEventListener('message', handleMessage)
        worker.addEventListener('error', handleError)

        timeoutId = setTimeout(() => {
          cleanup(handleMessage, handleError)
          reject(new Error('Image conversion timed out'))
        }, 30000)

        const payload: WorkerConversionRequest = {
          id: requestId,
          file,
          format: options.format,
          quality: options.quality,
        }

        worker.postMessage(payload)
      }).catch(async (workerError) => {
        console.warn(
          'Image worker conversion failed. Falling back to main thread conversion.',
          workerError,
        )
        return convertOnMainThread(file, options)
      })

      await verifyBlob(workerResult.blob)

      return {
        ...workerResult,
        originalSize: file.size,
        compressionRatio: ((file.size - workerResult.size) / file.size) * 100,
      }
    },
    [convertOnMainThread, initWorker, verifyBlob],
  )

  const validateImageFile = useCallback(
    async (file: File): Promise<string | null> => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return 'File must be an image. Please select a valid image file.'
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      if (file.size > maxSize) {
        return `Image is too large. Maximum size is 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }

      // Validate that the file can be processed by the converter
      try {
        const imageBitmap = await createImageBitmap(file)

        // Check minimum dimensions (optional - you can remove this if not needed)
        if (imageBitmap.width < 1 || imageBitmap.height < 1) {
          imageBitmap.close()
          return 'Image dimensions are invalid.'
        }

        imageBitmap.close()
        return null
      } catch (error) {
        console.log(
          (error instanceof Error ? error.message : '') +
            'Valid image formats: jpeg, png, webp, avif, bitmap',
        )
        return 'Valid image formats: jpeg, png, webp, avif, bitmap'
      }
    },
    [],
  )

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  return {convert, validateImageFile, terminate}
}
