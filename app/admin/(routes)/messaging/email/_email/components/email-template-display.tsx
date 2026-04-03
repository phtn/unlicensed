'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {Icon} from '@/lib/icons'
import {EMAIL_TEMPLATE_OPTIONS} from '@/lib/resend/templates/registry'
import {Button, Input} from '@/lib/heroui'
import {AnimatePresence, motion} from 'motion/react'
import Link from 'next/link'
import {parseAsString, useQueryState} from 'nuqs'
import {type KeyboardEvent, useCallback, useEffect, useState} from 'react'
import {toast} from 'react-hot-toast'
import z from 'zod'

export type EmailTemplateDisplayProps = {
  /** When this changes, the preview is refetched so template/render updates are shown. */
  previewRefreshKey?: string | number
}

export const EmailTemplateDisplay = ({
  previewRefreshKey,
}: EmailTemplateDisplayProps = {}) => {
  const [previewId, setPreviewId] = useQueryState(
    'preview',
    parseAsString.withDefault(''),
  )
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewSubject, setPreviewSubject] = useState<string>('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [refreshCount, setRefreshCount] = useState(0)
  const [testEmail, setTestEmail] = useState('')
  const [sendTestLoading, setSendTestLoading] = useState(false)
  const trimmedTestEmail = testEmail.trim()
  const isTestEmailValid =
    trimmedTestEmail.length > 0 && z.email().safeParse(trimmedTestEmail).success
  const showTestEmailError = trimmedTestEmail.length > 0 && !isTestEmailValid
  const canSendTestEmail =
    !previewLoading &&
    !sendTestLoading &&
    isTestEmailValid &&
    !!previewHtml &&
    !!previewSubject

  const clearPreview = useCallback(() => {
    setPreviewId(null)
    setPreviewHtml(null)
    setPreviewError(null)
  }, [setPreviewId])

  const refreshPreview = useCallback(() => {
    setRefreshCount((c) => c + 1)
  }, [])

  const sendTestEmail = useCallback(async () => {
    const email = testEmail.trim()
    if (!email) return
    if (!z.email().safeParse(email).success) {
      toast.error('Enter a valid email address')
      return
    }
    if (!previewHtml || !previewSubject) return
    setSendTestLoading(true)
    try {
      const res = await fetch('/api/resend/test', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          to: email,
          subject: previewSubject,
          html: previewHtml,
        }),
      })
      const data = (await res.json()) as {ok?: boolean; error?: string}
      if (res.ok && data.ok) {
        toast.success('Test email sent')
      } else {
        toast.error(data?.error ?? 'Failed to send test email')
      }
    } catch {
      toast.error('Failed to send test email')
    } finally {
      setSendTestLoading(false)
    }
  }, [testEmail, previewHtml, previewSubject])

  const handleTestEmailKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      if (!trimmedTestEmail || sendTestLoading || previewLoading) return
      void sendTestEmail()
    },
    [previewLoading, sendTestEmail, sendTestLoading, trimmedTestEmail],
  )

  useEffect(() => {
    if (!previewId) {
      queueMicrotask(() => {
        setPreviewHtml(null)
        setPreviewSubject('')
        setPreviewError(null)
      })
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setPreviewLoading(true)
      setPreviewError(null)
      setPreviewHtml(null)
    })

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 15000)

    const url = `/api/resend/templates/${encodeURIComponent(previewId)}?live=1&t=${refreshCount}-${String(previewRefreshKey ?? '')}`
    fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (res) => {
        if (cancelled) return null
        const text = await res.text()
        let data: {html?: string; subject?: string; error?: string}
        try {
          data = JSON.parse(text) as {
            html?: string
            subject?: string
            error?: string
          }
        } catch {
          if (!cancelled)
            setPreviewError(
              res.ok ? 'Invalid response' : 'Failed to load template',
            )
          return null
        }
        if (!res.ok) {
          if (!cancelled)
            setPreviewError(data?.error ?? 'Failed to load template')
          return null
        }
        return data
      })
      .then((data) => {
        if (cancelled || !data) return
        if (typeof data.html === 'string') {
          setPreviewHtml(data.html)
          setPreviewSubject(
            typeof data.subject === 'string' ? data.subject : '',
          )
          setPreviewVersion((v) => v + 1)
        } else if (!cancelled) {
          setPreviewError('No preview content returned')
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof Error && err.name === 'AbortError') {
          setPreviewError('Preview took too long. Please try again.')
        } else {
          setPreviewError('Failed to load template')
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
        if (!cancelled) setPreviewLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [previewId, previewRefreshKey, refreshCount])

  const previewOption = EMAIL_TEMPLATE_OPTIONS.find((o) => o.id === previewId)

  return (
    <div className='min-h-screen overflow-scroll'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-120 h-120 bg-brand/5 rounded-full blur-3xl' />
      </div>

      <main className='relative px-2 sm:px-3 lg:px-4'>
        <AnimatePresence mode='wait'>
          {previewId ? (
            <motion.div
              key='preview'
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className='space-y-4'>
              <div className='flex items-center justify-between w-full'>
                <Button
                  as={Link}
                  href='/admin/messaging/email?tabId=templates'
                  variant='tertiary'
                  size='sm'
                  className='gap-2'
                  onPress={clearPreview}>
                  <Icon name='chevron-left' className='size-4' />
                  Back to Templates
                </Button>
                <div>
                  <SectionHeader
                    title={
                      <div className='flex items-center space-x-2'>
                        <span>
                          {(previewOption?.label ?? previewId) + ' Template'}
                        </span>{' '}
                        <Icon
                          name={previewLoading ? 'spinners-ring' : 'refresh'}
                          className='size-6 text-brand'
                          onClick={refreshPreview}
                        />
                      </div>
                    }
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <Input
                    id='test-email'
                    size='sm'
                    type='email'
                    placeholder='Send test to…'
                    value={testEmail}
                    onValueChange={setTestEmail}
                    onKeyDown={handleTestEmailKeyDown}
                    isDisabled={previewLoading}
                    isInvalid={showTestEmailError}
                    errorMessage={
                      showTestEmailError
                        ? 'Enter a valid email address'
                        : undefined
                    }
                    autoComplete='email'
                    spellCheck='false'
                  />
                  <Button
                    size='sm'
                    isIconOnly
                    variant='primary'
                    aria-label='Send test email'
                    onPress={sendTestEmail}
                    isDisabled={!canSendTestEmail}>
                    {sendTestLoading ? (
                      <Icon name='spinners-ring' className='size-4' />
                    ) : (
                      <Icon name='send-fill' className='size-4' />
                    )}
                  </Button>
                </div>
              </div>

              <div className='rounded-2xl border border-background/15 dark:bg-background overflow-hidden shadow-lg'>
                {previewLoading && (
                  <div className='flex items-center justify-center py-24 gap-3 text-muted-foreground'>
                    <Icon name='spinners-ring' className='size-5' />
                    Loading preview…
                  </div>
                )}
                {previewError && (
                  <div className='py-12 text-center text-destructive'>
                    {previewError}
                  </div>
                )}
                {!previewLoading && !previewError && previewHtml && (
                  <iframe
                    key={`${previewId}-${previewVersion}`}
                    title={`Preview: ${previewOption?.label ?? previewId}`}
                    srcDoc={previewHtml}
                    className='w-full min-h-[85vh] border-0 bg-white dark:bg-slate-900'
                    sandbox='allow-same-origin allow-scripts'
                  />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key='list'
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className='space-y-4 overflow-scroll'>
              <SectionHeader
                title='Preview templates'
                description={`${EMAIL_TEMPLATE_OPTIONS.length} templates`}
              />

              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {EMAIL_TEMPLATE_OPTIONS.map((opt, index) => (
                  <Link
                    key={opt.id}
                    href={`/admin/messaging/email?tabId=templates&preview=${opt.id}`}
                    prefetch>
                    <motion.div
                      initial={{opacity: 0, y: 16}}
                      animate={{opacity: 1, y: 0}}
                      transition={{delay: index * 0.03}}
                      className='group relative cursor-pointer'>
                      <div className='absolute inset-0 bg-linear-to-r from-cyan-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                      <div className='relative dark:bg-background bg-greyed/10 backdrop-blur-xl border border-greyed/15 rounded-2xl p-4 hover:border-zinc-700/50 transition-all duration-300'>
                        <div className='flex items-start gap-3'>
                          <Icon
                            name='email'
                            className='size-5 text-cyan-600 dark:text-cyan-400/80'
                          />
                          <div className='min-w-0 flex-1'>
                            <h3 className='text-sm font-semibold truncate tracking-wide'>
                              {opt.label}
                            </h3>
                            <p className='text-xs opacity-80 mt-0.5 truncate'>
                              {opt.defaultSubject}
                            </p>
                          </div>
                          <Icon
                            name='arrow-right'
                            className='size-4 opacity-50 group-hover:opacity-100 shrink-0'
                          />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
