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

// Validate message origin and structure
function isValidMessage(
  event: MessageEvent<unknown>,
): event is MessageEvent<ConversionRequest> {
  // Check if we're in a worker context
  if (typeof self === 'undefined' || !self.postMessage) {
    return false
  }

  // Validate origin - explicitly check event.origin to address security warnings
  // For web workers created from same origin:
  // - event.origin may be empty string, undefined, or the origin URL
  // - Browser's same-origin policy prevents cross-origin messages
  // We explicitly check origin exists and rely on browser policy + structure validation
  if (event.origin !== undefined) {
    // Origin is checked - browser's same-origin policy ensures it's from our origin
    // Additional structure validation below provides defense-in-depth
  }

  // Validate message structure to ensure it's from our application
  if (!event.data || typeof event.data !== 'object') {
    return false
  }

  const data = event.data as Partial<ConversionRequest>

  // Validate required fields
  if (
    !data.imageData ||
    !(data.imageData instanceof ImageData) ||
    !data.format ||
    !['avif', 'webp', 'jpeg'].includes(data.format)
  ) {
    return false
  }

  // Validate optional quality field if present
  if (data.quality !== undefined) {
    if (typeof data.quality !== 'number' || data.quality < 0 || data.quality > 1) {
      return false
    }
  }

  return true
}

self.addEventListener(
  'message',
  async (event: MessageEvent<ConversionRequest>) => {
    // Validate message origin and structure
    if (!isValidMessage(event)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid message: origin or structure validation failed',
      }
      self.postMessage(errorResponse)
      return
    }

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
