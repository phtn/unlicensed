'use client'

import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react'

interface AssistantMessageInputProps {
  onSendMessage: (content: string) => Promise<void>
  isLoading: boolean
  onMessageSent?: () => void
  value?: string
  onValueChange?: (value: string) => void
}

export function AssistantMessageInput({
  onSendMessage,
  isLoading,
  onMessageSent,
  value,
  onValueChange,
}: AssistantMessageInputProps) {
  const isMobile = useMobile()
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : message

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120,
      )}px`
    }
  }, [currentValue])

  const handleSend = async () => {
    if (!currentValue.trim() || isLoading) return

    const messageToSend = currentValue.trim()
    if (isControlled) {
      onValueChange?.('')
    } else {
      setMessage('')
    }

    await onSendMessage(messageToSend)
    onMessageSent?.()

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      if (!isMobile) {
        textareaRef.current.focus()
      }
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
      handleOnBlur()
    }
  }

  const handleOnBlur = useCallback(() => {
    if (!isMobile) {
      textareaRef.current?.focus()
    }
  }, [isMobile])

  return (
    <div className='flex items-end gap-2'>
      {/* Text Input Area */}
      <div className='flex-1 relative'>
        <div className='relative flex items-end rounded-2xl border border-foreground/10 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all'>
          <textarea
            ref={textareaRef}
            value={currentValue}
            onChange={(e) => {
              const next = e.target.value
              if (isControlled) {
                onValueChange?.(next)
              } else {
                setMessage(next)
              }
            }}
            onKeyDown={handleKeyPress}
            placeholder='Ask about Protap...'
            onBlur={handleOnBlur}
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full resize-none bg-transparent px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none',
              'max-h-[120px] overflow-y-auto',
              'touch-manipulation',
            )}
            style={{
              minHeight: '44px',
            }}
          />
        </div>
      </div>

      {/* Send Button */}
      <button
        type='button'
        onClick={handleSend}
        disabled={!currentValue.trim() || isLoading}
        className={cn(
          'p-2.5 md:p-2 rounded-full transition-all shrink-0 touch-manipulation active:scale-95',
          currentValue.trim() && !isLoading
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}>
        {isLoading ? (
          <div className='size-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
        ) : (
          <Icon name='arrow-right' className='size-5 -rotate-90' />
        )}
      </button>
    </div>
  )
}
