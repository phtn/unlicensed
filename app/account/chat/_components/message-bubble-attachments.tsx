'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import type {Attachment} from './message-list-types'
import {downloadViaBlob} from './message-list-utils'

interface MessageBubbleAttachmentsProps {
  attachments: Attachment[]
  onImageClick: (attachment: Attachment) => void
  setIsDownloading: (value: boolean) => void
  variant?: 'default' | 'standalone'
}

export function MessageBubbleAttachments({
  attachments,
  onImageClick,
  setIsDownloading,
  variant = 'default',
}: MessageBubbleAttachmentsProps) {
  const bgClass =
    variant === 'standalone'
      ? 'bg-background hover:bg-background/60'
      : 'bg-background/20 hover:bg-background/30'

  return (
    <div className='flex flex-wrap gap-2'>
      {attachments.map((attachment, idx) => {
        const isImage = attachment.fileType.startsWith('image/')
        const isPdf = attachment.fileType === 'application/pdf'

        if (isImage) {
          return (
            <button
              key={idx}
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onImageClick(attachment)
              }}
              className={cn(
                'relative overflow-hidden rounded-lg border border-border/40 transition-colors',
                bgClass,
              )}>
              {attachment.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- chat attachment URLs may be external
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  className='h-24 w-24 object-cover sm:h-28 sm:w-28'
                />
              ) : (
                <div className='flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28'>
                  <Icon
                    name='spinner-dots'
                    className='size-5 text-muted-foreground'
                  />
                </div>
              )}
            </button>
          )
        }

        return (
          <button
            key={idx}
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              if (!attachment.url) return
              downloadViaBlob(
                attachment.url,
                attachment.fileName,
                setIsDownloading,
              )
            }}
            className={cn(
              'flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-border/40 transition-colors sm:h-28 sm:w-28',
              bgClass,
              !attachment.url && 'opacity-60 pointer-events-none',
            )}>
            <Icon name='folder-open' className='size-6 text-primary' />
            <span className='text-[10px] font-medium text-muted-foreground'>
              {isPdf ? 'PDF' : 'FILE'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
