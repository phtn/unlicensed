'use client'

import {
  getImageLoadingClasses,
  getImageSourceKey,
  resolveImageLoadStatus,
} from '@/components/ui/image-loading'
import {Avatar} from '@heroui/react'
import {type ComponentProps, useState} from 'react'

export type HeroAvatarImageProps = ComponentProps<typeof Avatar.Image> & {
  skeletonClassName?: string
}

export const HeroAvatarImage = ({
  className,
  onError,
  onLoad,
  skeletonClassName,
  src,
  ...props
}: HeroAvatarImageProps) => {
  const srcKey = getImageSourceKey(src)
  const [loadedSrcKey, setLoadedSrcKey] = useState<string | null>(null)
  const [errorSrcKey, setErrorSrcKey] = useState<string | null>(null)
  const status = resolveImageLoadStatus(srcKey, loadedSrcKey, errorSrcKey)

  return (
    <Avatar.Image
      {...props}
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
