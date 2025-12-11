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

  const convert = useCallback(
    async (
      file: File,
      options: ConversionOptions,
    ): Promise<ConversionResult> => {
      return new Promise((resolve, reject) => {
        const worker = initWorker()

        // Load the image file
        const reader = new FileReader()

        reader.onload = async (e: ProgressEvent<FileReader>) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            if (!arrayBuffer) {
              throw new Error('Failed to read file')
            }

            // Create an image bitmap from the file
            const blob = new Blob([arrayBuffer], {type: file.type})
            const imageBitmap = await createImageBitmap(blob)

            // Create a canvas to extract ImageData
            const canvas = document.createElement('canvas')
            canvas.width = imageBitmap.width
            canvas.height = imageBitmap.height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              throw new Error('Failed to get canvas context')
            }

            ctx.drawImage(imageBitmap, 0, 0)
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            )

            // Set up worker message handler
            const handleMessage = (event: MessageEvent) => {
              if ('error' in event.data) {
                reject(new Error(event.data.error))
              } else {
                const result: ConversionResult = {
                  ...event.data,
                  originalSize: file.size,
                  compressionRatio:
                    ((file.size - event.data.size) / file.size) * 100,
                }
                resolve(result)
              }
              worker.removeEventListener('message', handleMessage)
            }

            const handleError = (error: ErrorEvent) => {
              reject(error)
              worker.removeEventListener('error', handleError)
            }

            worker.addEventListener('message', handleMessage)
            worker.addEventListener('error', handleError)

            // Send to worker
            worker.postMessage({
              imageData,
              format: options.format,
              quality: options.quality,
            })
          } catch (error) {
            reject(error)
          }
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsArrayBuffer(file)
      })
    },
    [initWorker],
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
        const blob = new Blob([file], {type: file.type})
        const imageBitmap = await createImageBitmap(blob)

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
