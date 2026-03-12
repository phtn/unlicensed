'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useImageConverter} from '@/hooks/use-image-converter'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatRecordingTime} from '@/utils/time'
import {InputProps, Textarea} from '@heroui/react'
import {useMutation} from 'convex/react'
import {
  KeyboardEvent,
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react'
import {useAudioRecorder} from './use-audio-recorder'

interface MessageInputProps {
  receiverProId: string
  senderProId: string
  onMessageSent?: () => void
  onOptimisticMessage?: (
    content: string,
    attachments?: Array<{
      storageId: Id<'_storage'>
      fileName: string
      fileType: string
      fileSize: number
      url: string | null
    }>,
  ) => void
}

interface Attachment {
  storageId: Id<'_storage'>
  fileName: string
  fileType: string
  fileSize: number
  url?: string | null
}

type InputMode = 'text' | 'recording' | 'preview'

export function MessageInput({
  receiverProId,
  senderProId,
  onMessageSent,
  onOptimisticMessage,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewAudioRef = useRef<HTMLAudioElement>(null)
  const sendMessage = useMutation(api.messages.m.sendMessage)
  const getUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const isMobile = useMobile()
  const {
    convert,
    validateImageFile,
    terminate: terminateImageWorker,
  } = useImageConverter()

  const revokeObjectUrl = (url?: string | null) => {
    if (!url) return
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error: recordingError,
  } = useAudioRecorder()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120,
      )}px`
    }
  }, [message])

  // Cleanup image conversion worker
  useEffect(() => {
    return () => {
      terminateImageWorker()
    }
  }, [terminateImageWorker])

  // Auto-focus textarea on desktop when component mounts or input mode changes to text
  useEffect(() => {
    if (!isMobile && inputMode === 'text' && textareaRef.current) {
      // Small delay to ensure the textarea is rendered
      const timeoutId = setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [isMobile, inputMode])

  // Switch to preview mode when recording stops and audio is available
  useEffect(() => {
    if (audioBlob && audioUrl && !isRecording) {
      startTransition(() => {
        setInputMode('preview')
      })
    }
  }, [audioBlob, audioUrl, isRecording])

  const handleStartRecording = async () => {
    startTransition(() => {
      setInputMode('recording')
    })
    await startRecording()
  }

  const handleStopRecording = () => {
    stopRecording()
  }

  const handleCancelRecording = () => {
    resetRecording()
    startTransition(() => {
      setInputMode('text')
    })
    // Refocus on desktop after canceling
    if (!isMobile) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }

  const handleSendAudio = async () => {
    if (!audioBlob || isSending) return

    setIsSending(true)
    try {
      // Get upload URL from Convex storage
      const uploadUrl = await getUploadUrl({})

      // Upload audio file to Convex storage
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {'Content-Type': audioBlob.type || 'audio/webm'},
        body: audioBlob,
      })

      if (!response.ok) {
        throw new Error('Failed to upload audio')
      }

      const {storageId} = await response.json()

      const audioAttachment = {
        storageId,
        fileName: `voice-message-${Date.now()}.webm`,
        fileType: audioBlob.type || 'audio/webm',
        fileSize: audioBlob.size,
      }

      // Optimistic update (URL will be null initially, real query will update it)
      if (onOptimisticMessage) {
        onOptimisticMessage('', [
          {
            ...audioAttachment,
            url: null,
          },
        ])
      }

      // Send message with audio attachment
      // Store duration in seconds in content field for display in conversation list
      await sendMessage({
        receiverId: receiverProId,
        senderId: senderProId,
        content: recordingTime.toString(), // Store duration in seconds
        attachments: [audioAttachment],
      })

      // Reset after sending
      resetRecording()
      startTransition(() => {
        setInputMode('text')
      })
      onMessageSent?.()

      // Refocus on desktop after sending
      if (!isMobile) {
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 100)
      }
    } catch (error) {
      console.error('Error sending audio message:', error)
      alert(error instanceof Error ? error.message : 'Failed to send audio')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const newAttachments: Attachment[] = []
      const maxSizeBytes = 10 * 1024 * 1024 // 10MB

      const replaceFileExtension = (fileName: string, nextExt: string) => {
        const trimmedExt = nextExt.replace(/^\./, '')
        const lastDot = fileName.lastIndexOf('.')
        const newFileName = Date.now().toString().substring(5)
        if (lastDot === -1) {
          return `${newFileName}.${trimmedExt}`
        }
        return `${newFileName}.${trimmedExt}`
      }

      for (const file of Array.from(files)) {
        // Validate file type (images and PDFs)
        const isImage = file.type.startsWith('image/')
        const isPDF = file.type === 'application/pdf'

        if (!isImage && !isPDF) {
          alert(
            `${file.name} is not a supported file type. Please upload images or PDFs.`,
          )
          continue
        }

        // Validate file size (max 10MB)
        if (file.size > maxSizeBytes) {
          alert(`${file.name} is too large. Maximum size is 10MB.`)
          continue
        }

        // Convert images to a more web-friendly format before uploading
        let uploadFile: File = file
        if (isImage) {
          // Explicitly disallow SVG uploads (often unsupported by bitmap-based conversion)
          if (file.type === 'image/svg+xml') {
            alert(
              `${file.name} is not supported. Please upload a PNG, JPG, or WebP.`,
            )
            continue
          }

          const validationError = await validateImageFile(file)
          if (validationError) {
            alert(`${file.name}: ${validationError}`)
            continue
          }

          try {
            const converted = await convert(file, {
              format: 'webp',
              quality: 0.85,
            })
            uploadFile = new File(
              [converted.blob],
              replaceFileExtension(file.name, 'webp'),
              {
                type: 'image/webp',
                lastModified: file.lastModified,
              },
            )

            if (uploadFile.size > maxSizeBytes) {
              alert(
                `${file.name} is too large after conversion. Maximum size is 10MB.`,
              )
              continue
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : 'Unknown error during image conversion'
            alert(`${file.name}: Failed to process this image (${message}).`)
            continue
          }
        }

        // Get upload URL from Convex storage
        const uploadUrl = await getUploadUrl({})

        // Upload file to Convex storage
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {'Content-Type': uploadFile.type},
          body: uploadFile,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const {storageId} = await response.json()

        const previewUrl = URL.createObjectURL(uploadFile)

        newAttachments.push({
          storageId,
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          fileSize: uploadFile.size,
          url: previewUrl,
        })
      }

      setAttachments((prev) => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const toRemove = prev[index]
      if (toRemove) {
        revokeObjectUrl(toRemove.url ?? null)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return

    const messageToSend = message.trim()
    const attachmentsToSend = attachments
    setMessage('')
    setAttachments([])
    setIsSending(true)

    // Optimistic update
    if (onOptimisticMessage) {
      const attachmentsWithUrls = attachmentsToSend.map((att) => ({
        storageId: att.storageId,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        url: att.url ?? null,
      }))
      onOptimisticMessage(
        messageToSend,
        attachmentsWithUrls.length > 0 ? attachmentsWithUrls : undefined,
      )
    }

    try {
      // Prepare attachments without url field (only fields expected by validator)
      const attachmentsForMutation =
        attachmentsToSend.length > 0
          ? attachmentsToSend.map(
              ({storageId, fileName, fileType, fileSize}) => ({
                storageId,
                fileName,
                fileType,
                fileSize,
              }),
            )
          : undefined

      await sendMessage({
        receiverId: receiverProId,
        senderId: senderProId,
        content: messageToSend,
        ...(attachmentsForMutation && {attachments: attachmentsForMutation}),
      })
      onMessageSent?.()
      // Clean up preview object URLs after successful send
      for (const att of attachmentsToSend) {
        revokeObjectUrl(att.url ?? null)
      }

      // Refocus on desktop after sending
      if (!isMobile) {
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 100)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore message and attachments on error
      setMessage(messageToSend)
      setAttachments(attachmentsToSend)
      alert(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsSending(false)
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Recording Mode UI
  if (inputMode === 'recording') {
    return (
      <div className='space-y-2'>
        <div className='flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 sm:gap-3'>
          {/* Recording indicator */}
          <div className='flex shrink-0 items-center gap-2'>
            <div className='size-3 rounded-full bg-red-500 animate-pulse' />
            <span className='text-sm font-medium text-red-600 dark:text-red-400'>
              Recording
            </span>
          </div>

          {/* Timer */}
          <div className='flex min-w-0 flex-1 justify-center'>
            <span className='font-mono text-base tabular-nums text-foreground sm:text-lg'>
              {formatRecordingTime(recordingTime)}
            </span>
          </div>

          {/* Waveform visualization */}
          <div className='hidden h-8 items-center gap-0.5 sm:flex'>
            {Array.from({length: 12}).map((_, i) => (
              <div
                key={i}
                className='w-1 bg-red-500 rounded-full animate-pulse'
                style={{
                  height: `${20 + Math.sin(Date.now() / 200 + i) * 15}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>

        <div className='grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-between'>
          {/* Cancel Button */}
          <button
            type='button'
            onClick={handleCancelRecording}
            className='flex h-11 items-center justify-center rounded-2xl hover:bg-accent transition-colors active:scale-95 touch-manipulation sm:h-auto sm:w-auto sm:rounded-full sm:p-2'>
            <Icon name='x' className='size-5 text-muted-foreground' />
          </button>

          {/* Pause/Resume Button */}
          <button
            type='button'
            onClick={isPaused ? resumeRecording : pauseRecording}
            className='flex h-11 items-center justify-center rounded-2xl bg-muted px-3 transition-colors active:scale-95 touch-manipulation hover:bg-muted/80 sm:h-auto sm:rounded-full sm:p-3'>
            {isPaused ? (
              <Icon name='play-solid' className='size-6 text-foreground' />
            ) : (
              <Icon name='pause-solid' className='size-6 text-foreground' />
            )}
          </button>

          {/* Stop & Preview Button */}
          <button
            type='button'
            onClick={handleStopRecording}
            className='flex h-11 items-center justify-center rounded-2xl bg-red-500 transition-colors active:scale-95 touch-manipulation hover:bg-red-600 sm:h-auto sm:w-auto sm:rounded-full sm:p-2'>
            <Icon name='stop' className='size-5 text-white' />
          </button>
        </div>

        {recordingError && (
          <p className='text-xs text-destructive text-center'>
            {recordingError}
          </p>
        )}
      </div>
    )
  }

  // Preview Mode UI (after recording)
  if (inputMode === 'preview' && audioUrl) {
    return (
      <div className='space-y-2'>
        {/* Audio Preview */}
        <div className='flex items-center gap-2 overflow-hidden rounded-2xl border border-border/40 bg-muted/50 px-3 py-3 sm:gap-3'>
          <audio ref={previewAudioRef} src={audioUrl} className='hidden' />

          {/* Play preview button */}
          <button
            type='button'
            onClick={() => {
              if (previewAudioRef.current) {
                if (previewAudioRef.current.paused) {
                  previewAudioRef.current.play()
                } else {
                  previewAudioRef.current.pause()
                  previewAudioRef.current.currentTime = 0
                }
              }
            }}
            className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors active:scale-95 touch-manipulation hover:bg-primary/20 sm:size-10 sm:rounded-full'>
            <Icon name='play-solid' className='size-5 text-primary' />
          </button>

          {/* Waveform preview */}
          <div className='flex h-8 min-w-0 flex-1 items-center gap-0.5'>
            {Array.from({length: 32}).map((_, i) => {
              const height =
                20 + Math.sin(i * 0.8) * 15 + Math.cos(i * 1.2) * 10
              return (
                <div
                  key={i}
                  className='w-1 bg-indigo-500/40 rounded-full'
                  style={{height: `${height}%`}}
                />
              )
            })}
          </div>

          {/* Duration */}
          <span className='shrink-0 text-sm font-mono tabular-nums text-muted-foreground'>
            {formatRecordingTime(recordingTime)}
          </span>
        </div>

        <div className='grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-between'>
          {/* Cancel Button */}
          <button
            type='button'
            onClick={handleCancelRecording}
            disabled={isSending}
            className='flex h-11 items-center justify-center rounded-2xl hover:bg-accent transition-colors active:scale-95 touch-manipulation disabled:opacity-50 sm:h-auto sm:w-auto sm:rounded-full sm:p-2'>
            <Icon name='x' className='size-5 text-muted-foreground' />
          </button>

          {/* Re-record Button */}
          <button
            type='button'
            onClick={handleStartRecording}
            disabled={isSending}
            className='flex h-11 items-center justify-center gap-2 rounded-2xl bg-muted px-3 transition-colors active:scale-95 touch-manipulation hover:bg-muted/80 disabled:opacity-50 sm:h-auto sm:rounded-full sm:px-4 sm:py-2'>
            <Icon name='refresh' className='size-4 text-muted-foreground' />
            <span className='text-xs text-muted-foreground sm:text-sm'>
              Re-record
            </span>
          </button>

          {/* Send Button */}
          <button
            type='button'
            onClick={handleSendAudio}
            disabled={isSending}
            className='flex h-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-colors active:scale-95 touch-manipulation shadow-md hover:bg-primary/90 disabled:opacity-50 sm:h-auto sm:w-auto sm:rounded-full sm:p-2'>
            {isSending ? (
              <div className='size-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
            ) : (
              <Icon name='arrow-up' className='size-5' />
            )}
          </button>
        </div>
      </div>
    )
  }

  // Default Text Input Mode
  return (
    <div className='space-y-2'>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className='flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className='group relative shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/20'>
              {attachment.fileType.startsWith('image/') && attachment.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- chat attachment URLs may be external
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  className='h-18 w-18 object-cover sm:h-20 sm:w-20'
                />
              ) : (
                <div className='flex h-18 w-18 items-center justify-center sm:h-20 sm:w-20'>
                  <Icon
                    name='folder-open'
                    className='size-6 text-muted-foreground'
                  />
                </div>
              )}
              <button
                type='button'
                onClick={() => handleRemoveAttachment(index)}
                className='absolute top-1 right-1 p-1 rounded-full bg-background/70 hover:bg-background transition-colors'>
                <Icon name='x' className='size-3 text-muted-foreground' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className='flex items-end gap-1.5 sm:gap-2'>
        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*,application/pdf'
          multiple
          onChange={handleFileSelect}
          className='hidden'
        />
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || uploading}
          className='flex size-11 shrink-0 items-center justify-center rounded-2xl hover:bg-accent transition-colors active:scale-95 touch-manipulation disabled:opacity-50 sm:size-10 sm:rounded-full'>
          {uploading ? (
            <div className='size-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
          ) : (
            <Icon
              name='add-circle'
              className='size-7 text-muted-foreground sm:size-8'
            />
          )}
        </button>

        {/* Text Input Area */}
        <div className='flex-1 relative'>
          <div className='relative flex items-end rounded-2xl bg-muted/50 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20'>
            <Textarea
              ref={textareaRef}
              value={message}
              radius='none'
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder='Type a message...'
              disabled={isSending || uploading}
              rows={isMobile ? 2 : 3}
              className='touch-manipulation'
              classNames={{
                ...chatInputClassNames,
                innerWrapper: 'ps-2!',
              }}
              // className={cn(
              //   'w-full resize-none bg-transparent px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base',
              //   'placeholder:text-muted-foreground/60',
              //   'focus:outline-none',
              //   'max-h-30 overflow-y-auto',
              //   'touch-manipulation',
              // )}
            />
          </div>
        </div>

        {/* Microphone Button (show when no text) */}
        {!message.trim() && attachments.length === 0 && (
          <button
            type='button'
            onClick={handleStartRecording}
            disabled={isSending || uploading}
            className='flex size-11 shrink-0 items-center justify-center rounded-2xl hover:bg-accent transition-colors active:scale-95 touch-manipulation disabled:opacity-50 sm:size-10 sm:rounded-full'>
            <Icon
              name='wave-circle'
              className='size-7 text-muted-foreground sm:size-8'
            />
          </button>
        )}

        {/* Send Button (show when there's content) */}
        {(message.trim() || attachments.length > 0) && (
          <button
            type='button'
            onClick={handleSend}
            disabled={
              (!message.trim() && attachments.length === 0) ||
              isSending ||
              uploading
            }
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-2xl transition-all touch-manipulation active:scale-95 sm:size-10 sm:rounded-full',
              (message.trim() || attachments.length > 0) &&
                !isSending &&
                !uploading
                ? 'bg-dark-gray text-primary-foreground dark:bg-white dark:text-dark-table hover:bg-brand/90'
                : 'bg-sidebar text-foreground/30 cursor-not-allowed',
            )}>
            {isSending ? (
              <div className='size-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
            ) : (
              <Icon name='arrow-up-fat' className='size-5' />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
export const searchInputClassNames: InputProps['classNames'] = {
  label: 'mb-5 pl-1 opacity-80 tracking-widest uppercase text-xs font-brk',
  input:
    'text-blue-500 dark:text-white text-base font-medium font-okxs placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
  inputWrapper:
    'shadow-none border rounded-xl border-dark-table/40 dark:border-black/10 bg-alum/10 dark:bg-black/60 data-focus:border-dark-table dark:data-hover:border-dark-table p-2 outline-none min-h-14 md:min-h-16 w-full',
  innerWrapper: 'ps-8',
}
export const chatInputClassNames: InputProps['classNames'] = {
  label: 'mb-5 pl-1 opacity-80 tracking-widest uppercase text-xs font-brk',
  input:
    'text-blue-500 dark:text-white text-base font-medium font-okxs placeholder:text-dark-table/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
  inputWrapper:
    'border shadow-none rounded-xl border-dark-table/40 dark:border-black/10 bg-sidebar dark:bg-black/60 dark:hover:bg-black/40 dark:data-focus-visible:bg-white data-focus:border-dark-table dark:data-hover:border-dark-table p-2 outline-none min-h-14 md:min-h-16 w-full',
  innerWrapper: 'ps-2',
}
