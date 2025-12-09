interface ConversionRequest {
  imageData: ImageData
  format: 'avif' | 'webp' | 'jpeg'
  quality?: number
}

interface ConversionResponse {
  blob: Blob
  size: number
  format: string
}

interface ErrorResponse {
  error: string
}

self.addEventListener(
  'message',
  async (event: MessageEvent<ConversionRequest>) => {
    try {
      const {imageData, format, quality = 0.8} = event.data

      // Create an OffscreenCanvas (available in workers)
      const canvas = new OffscreenCanvas(imageData.width, imageData.height)
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Put the image data onto the canvas
      ctx.putImageData(imageData, 0, 0)

      // Convert to desired format
      const mimeType = `image/${format}`
      const blob = await canvas.convertToBlob({
        type: mimeType,
        quality,
      })

      const response: ConversionResponse = {
        blob,
        size: blob.size,
        format: mimeType,
      }

      // Blobs are automatically cloned when passed via postMessage
      // They are not transferable (only ArrayBuffer, MessagePort, ImageBitmap are transferable)
      self.postMessage(response)
    } catch (error) {
      const errorResponse: ErrorResponse = {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
      self.postMessage(errorResponse)
    }
  },
)

export {}
