import {startTransition} from 'react'

export const withViewTransition = (fn: () => void) => {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown
  }
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(fn)
  } else {
    fn()
  }
}

export const withViewTransitionAndTransition = (fn: () => void) => {
  withViewTransition(() => {
    startTransition(fn)
  })
}

export const downloadViaBlob = async (
  url: string,
  fileName: string,
  setIsDownloading?: (value: boolean) => void,
) => {
  setIsDownloading?.(true)
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Download failed (${res.status})`)
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  } catch (error) {
    console.error('Error downloading attachment:', error)
    alert(
      error instanceof Error
        ? error.message
        : 'Failed to download attachment',
    )
  } finally {
    setIsDownloading?.(false)
  }
}