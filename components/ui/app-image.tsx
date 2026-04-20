'use client'

import {
  getImageLoadingClasses,
  getImageSourceKey,
  resolveImageLoadStatus,
} from '@/components/ui/image-loading'
import NextImage, {type ImageProps} from 'next/image'
import {useState} from 'react'

export type AppImageProps = ImageProps & {
  skeletonClassName?: string
}

export default function AppImage({
  className,
  onError,
  onLoad,
  skeletonClassName,
  src,
  alt,
  ...props
}: AppImageProps) {
  const srcKey = getImageSourceKey(src)
  const [loadedSrcKey, setLoadedSrcKey] = useState<string | null>(null)
  const [errorSrcKey, setErrorSrcKey] = useState<string | null>(null)
  const status = resolveImageLoadStatus(srcKey, loadedSrcKey, errorSrcKey)

  return (
    <NextImage
      {...props}
      alt={alt}
      src={src}
      data-loading-status={status}
      className={getImageLoadingClasses(status, className, skeletonClassName)}
      onLoad={(event) => {
        setLoadedSrcKey(srcKey)
        setErrorSrcKey((current) => (current === srcKey ? null : current))
        onLoad?.(event)
      }}
      onError={(event) => {
        setErrorSrcKey(srcKey)
        setLoadedSrcKey((current) => (current === srcKey ? null : current))
        onError?.(event)
      }}
    />
  )
}

export {AppImage}
