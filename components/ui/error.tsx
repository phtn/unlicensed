'use client'

import ShimmerText from '@/components/expermtl/shimmer'
import {Icon, type IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  ViewTransition,
} from 'react'
import {flushSync} from 'react-dom'

interface ErrorProps {
  error: Error & {digest?: string}
  reset: () => void
  name: string
}

interface ErrorInsight {
  category: string
  icon: IconName
  description: string
  suggestion: string
  accentClass: string
}

type DocumentWithStartViewTransition = Document & {
  startViewTransition?: (callback: () => void) => {ready: Promise<unknown>}
}

export function ErrorComp({error, reset, name}: ErrorProps) {
  const errorInsight = useMemo((): ErrorInsight => {
    const message = error?.message?.toLowerCase() || ''
    const errorName = error?.name?.toLowerCase() || ''

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return {
        category: 'Network Error',
        icon: 'globe-light',
        description: 'Unable to connect to the server or load resources.',
        suggestion: 'Check your internet connection and try again.',
        accentClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      }
    }

    if (message.includes('404') || message.includes('not found')) {
      return {
        category: 'Not Found',
        icon: 'question',
        description: "The requested page or resource doesn't exist.",
        suggestion: 'Verify the URL or navigate back to a known page.',
        accentClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      }
    }

    if (message.includes('500') || message.includes('server error')) {
      return {
        category: 'Server Error',
        icon: 'server',
        description: 'Something went wrong on our end.',
        suggestion: 'This is usually temporary. Please try again in a moment.',
        accentClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      }
    }

    if (errorName.includes('typeerror') || message.includes('undefined')) {
      return {
        category: 'Application Error',
        icon: 'alert-triangle',
        description: 'An unexpected error occurred in the application.',
        suggestion:
          'Try refreshing the page or contact support if the issue persists.',
        accentClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      }
    }

    return {
      category: 'Something went wrong',
      icon: 'alert-circle',
      description: 'An unexpected error has occurred.',
      suggestion: 'Please try again or contact support for assistance.',
      accentClass: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400',
    }
  }, [error])

  const [isResetPending, startResetTransition] = useTransition()
  const [showDetails, setShowDetails] = useState(false)

  const handleReset = useCallback(() => {
    startResetTransition(() => {
      reset()
    })
  }, [reset])

  const toggleDetails = useCallback(async () => {
    const doc = document as DocumentWithStartViewTransition

    if (typeof doc.startViewTransition !== 'function') {
      setShowDetails((prev) => !prev)
      return
    }

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        setShowDetails((prev) => !prev)
      })
    })

    await transition.ready
  }, [])

  return (
    <div className='min-h-[50vh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8'>
      <style>
        {`::view-transition-old(error-details),::view-transition-new(error-details){animation:none;mix-blend-mode:normal;}`}
      </style>

      <div className='w-full max-w-lg md:max-w-3xl'>
        {/* Main Card */}
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl',
            'bg-white dark:bg-zinc-900',
            'border border-neutral-200 dark:border-zinc-800',
            'shadow-sm dark:shadow-none',
          )}>
          {/* Subtle gradient accent */}
          <div
            className={cn(
              'absolute inset-x-0 top-0 h-px',
              'bg-linear-to-r from-transparent via-neutral-300 dark:via-zinc-700 to-transparent',
            )}
          />

          <div className="absolute w-full top-0 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />

          <div className='p-6 sm:p-8'>
            {/* Icon + Category */}
            <div className='flex items-start gap-4 mb-6'>
              <div
                className={cn(
                  'flex items-center justify-center',
                  'size-12 md:size-14 rounded-2xl shrink-0',
                  errorInsight.accentClass,
                )}>
                <Icon name={errorInsight.icon} className='size-5 md:size-6' />
              </div>

              <div className='min-w-0 flex-1'>
                <ShimmerText
                  surface='dark'
                  variant='default'
                  text={errorInsight.category}
                  container='items-start justify-start -mt-2'
                  className='text-lg md:text-2xl font-bone font-semibold text-neutral-900/50 dark:text-zinc-100/50 justify-start w-fit'></ShimmerText>

                <p className='-mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed'>
                  {errorInsight.description}
                </p>
              </div>
            </div>

            {/* Suggestion */}
            <div
              className={cn(
                'rounded-xl p-4 mb-6',
                'bg-neutral-50 dark:bg-zinc-800/50',
                'border border-neutral-100 dark:border-zinc-800',
              )}>
              <p className='text-sm text-neutral-600 dark:text-zinc-300'>
                {errorInsight.suggestion}
              </p>
            </div>

            {/* Route info */}
            <div className='flex items-center gap-2 mb-6'>
              <span className='text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium'>
                Route
              </span>
              <code
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-mono',
                  'bg-neutral-100 dark:bg-zinc-950',
                  'text-neutral-700 dark:text-zinc-300',
                )}>
                {name}
              </code>
            </div>

            {/* Actions */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
              <button
                type='button'
                onClick={handleReset}
                disabled={isResetPending}
                className={cn(
                  'inline-flex items-center justify-center gap-2',
                  'h-11 px-5 rounded-xl',
                  'text-sm font-medium',
                  'bg-neutral-900 dark:bg-white',
                  'text-white dark:text-zinc-900',
                  'hover:bg-neutral-800 dark:hover:bg-zinc-100',
                  'active:scale-[0.98] transition-all duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                )}>
                {isResetPending ? (
                  <>
                    <svg
                      className='size-4 animate-spin'
                      viewBox='0 0 24 24'
                      fill='none'>
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='3'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                      />
                    </svg>
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <Icon name='refresh' className='size-4' />
                    <span>Try again</span>
                  </>
                )}
              </button>

              <button
                type='button'
                onClick={toggleDetails}
                className={cn(
                  'inline-flex items-center justify-center gap-2',
                  'h-11 px-5 rounded-xl',
                  'text-sm font-medium',
                  'bg-transparent',
                  'text-neutral-600 dark:text-neutral-400',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'active:scale-[0.98] transition-all duration-150',
                )}>
                <Icon
                  name='chevron-down'
                  className={cn(
                    'size-4 transition-transform duration-200',
                    showDetails && 'rotate-180',
                  )}
                />
                <span>{showDetails ? 'Hide details' : 'View details'}</span>
              </button>
            </div>
          </div>

          {/* Expandable Details Section */}
          <ViewTransition name='error-details' enter='vt-enter' exit='vt-exit'>
            {showDetails ? (
              <div
                key='details'
                className='[view-transition-name:error-details]'
                style={{viewTransitionName: 'error-details'}}>
                <div
                  className={cn(
                    'border-t border-neutral-100 dark:border-neutral-800',
                    'bg-neutral-50/50 dark:bg-neutral-900/50',
                    'p-6 sm:p-8',
                  )}>
                  <div className='space-y-4'>
                    {/* Error Name */}
                    <div>
                      <label className='block text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5'>
                        Error
                      </label>
                      <p className='text-sm font-mono text-neutral-800 dark:text-neutral-200'>
                        {error?.name || 'Unknown'}
                      </p>
                    </div>

                    {/* Message */}
                    <div>
                      <label className='block text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5'>
                        Message
                      </label>
                      <p className='text-sm text-neutral-700 dark:text-neutral-300 wrap-break-words'>
                        {error?.message || 'No message available'}
                      </p>
                    </div>

                    {/* Digest */}
                    {error?.digest ? (
                      <div>
                        <label className='block text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5'>
                          Digest
                        </label>
                        <code className='text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all'>
                          {error.digest}
                        </code>
                      </div>
                    ) : null}

                    {/* Stack Trace */}
                    <div>
                      <label className='block text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5'>
                        Stack Trace
                      </label>
                      <div
                        className={cn(
                          'rounded-lg p-3 overflow-auto max-h-64',
                          'bg-neutral-100 dark:bg-neutral-800',
                          'border border-neutral-200 dark:border-neutral-700',
                        )}>
                        <pre className='text-xs font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre wrap-break-words leading-relaxed'>
                          {error?.stack || 'No stack trace available'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </ViewTransition>
        </div>

        {/* Subtle footer hint */}
        <p className='mt-4 text-center text-xs text-neutral-400 dark:text-neutral-600'>
          If this issue persists, please contact support
        </p>
      </div>
    </div>
  )
}
