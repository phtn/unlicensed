'use client'

import {Icon} from '@/lib/icons'
import {downloadViaBlob} from './message-list-utils'

interface ImageModalProps {
  url: string
  fileName: string
  isDownloading: boolean
  setIsDownloading: (value: boolean) => void
  onClose: () => void
}

export function ImageModal({
  url,
  fileName,
  isDownloading,
  setIsDownloading,
  onClose,
}: ImageModalProps) {
  return (
    <div
      className='fixed inset-0 z-500 bg-black/80'
      role='dialog'
      aria-modal='true'
      onClick={onClose}>
      <div className='absolute top-4 right-4 flex items-center gap-2'>
        <button
          type='button'
          disabled={isDownloading}
          onClick={(e) => {
            e.stopPropagation()
            downloadViaBlob(url, fileName, setIsDownloading)
          }}
          className='p-2 rounded-full bg-background/20 hover:bg-background/30 text-white transition-colors'>
          {isDownloading ? (
            <div className='size-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
          ) : (
            <Icon name='download' className='size-5' />
          )}
        </button>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className='p-2 rounded-full bg-background/20 hover:bg-background/30 text-white transition-colors'>
          <Icon name='x' className='size-5' />
        </button>
      </div>
      <div className='h-full w-full flex items-center justify-center p-4'>
        <img
          src={url}
          alt={fileName}
          className='max-h-[92vh] max-w-[92vw] object-contain rounded-lg'
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}