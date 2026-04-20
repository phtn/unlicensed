import {cn} from '@/lib/utils'

export type ImageLoadStatus = 'loading' | 'loaded' | 'error'

export const getImageSourceKey = (src: unknown) => {
  if (typeof src === 'string') {
    return src
  }

  if (
    src &&
    typeof src === 'object' &&
    'src' in src &&
    typeof (src as {src?: unknown}).src === 'string'
  ) {
    return (src as {src: string}).src
  }

  return ''
}

export const getImageLoadingClasses = (
  status: ImageLoadStatus,
  ...classNames: Array<string | undefined>
) =>
  cn(
    ...classNames,
    status !== 'loaded' &&
      'bg-foreground/8 dark:bg-white/6 [color:transparent]',
    status === 'loading' && 'animate-pulse',
  )

export const resolveImageLoadStatus = (
  srcKey: string,
  loadedSrcKey: string | null,
  errorSrcKey: string | null,
): ImageLoadStatus => {
  if (!srcKey) {
    return 'error'
  }

  if (loadedSrcKey === srcKey) {
    return 'loaded'
  }

  if (errorSrcKey === srcKey) {
    return 'error'
  }

  return 'loading'
}
