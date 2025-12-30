'use client'

import {AccessDenied} from '@/app/admin/_components/ui/access-denied'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import {AnimatePresence, motion} from 'motion/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {startTransition, useCallback} from 'react'
import {withViewTransition} from '../utils'

interface EmailTemplateListProps {
  templates: Array<Doc<'emailSettings'>> | undefined
}

export const EmailTemplateList = ({templates}: EmailTemplateListProps) => {
  const {user} = useAuthCtx()
  const router = useRouter()

  // const emailSettings = useQuery(api.emailSettings.q.listEmailSettings)
  const u = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {firebaseId: user.uid} : 'skip',
  )

  const isAdmin = u !== undefined

  const navigateToNew = useCallback(() => {
    withViewTransition(() => {
      startTransition(() => {
        router.push('/admin/messaging/email?tabId=new')
      })
    })
  }, [router])

  if (!!isAdmin && !isAdmin) {
    return <AccessDenied />
  }

  if (templates === undefined) {
    return (
      <div className='flex items-center justify-center absolute top-1/2 left-1/2 portrait:-translate-x-1/2'>
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className='flex items-center gap-3 opacity-50'>
          <Icon name='spinners-ring' className='size-5' />
          Loading email settings...
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-120 h-120 bg-purple-500/5 rounded-full blur-3xl' />
      </div>

      <main className='relative px-2 sm:px-3 lg:px-4'>
        <AnimatePresence mode='wait'>
          {templates.length === 0 ? (
            <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -20}}
              className='rounded-3xl h-[calc(100lvh-140px)] md:h-auto md:rounded-3xl bg-slate-100 dark:bg-dark-table/60 border border-foreground/20 sm:px-8 sm:pt-8 transition-colors p-4'>
              {/*<div className='w-12 h-12 rounded-xl bg-linear-to-br from-cyan-600/10 to-purple-200/10 border border-foreground/20 flex items-center justify-center shrink-0'></div>*/}
              <div className='flex items-center space-x-4'>
                <Icon
                  name='email'
                  className='size-8 md:size-24 -rotate-6 opacity-60'
                />
                <SectionHeader
                  title='Email Templates'
                  description='Manage your email templates here.'>
                  <Button
                    size='sm'
                    isIconOnly
                    radius='full'
                    color='primary'
                    onPress={navigateToNew}
                    className='bg-foreground dark:text-dark-gray border-0'>
                    <Icon name='plus' className='size-5' />
                  </Button>
                </SectionHeader>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className='space-y-4'>
              {templates.map((template, index) => (
                <Link
                  key={template._id}
                  href={`/admin/messaging/email/${template._id}`}
                  prefetch>
                  <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: index * 0.05}}
                    className='group relative cursor-pointer'>
                    <div className='absolute inset-0 bg-linear-to-r from-cyan-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                    <div className='relative dark:bg-background bg-greyed/10 backdrop-blur-xl border border-greyed/15 rounded-4xl p-5 hover:border-zinc-700/50 transition-all duration-300'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex items-start gap-4 flex-1'>
                          <div className='w-12 h-12 rounded-xl bg-linear-to-br from-cyan-600/10 to-purple-200/10 border border-foreground/20 flex items-center justify-center shrink-0'>
                            <Icon
                              name='arrow-swap'
                              className='size-5 rotate-45'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-3 mb-1'>
                              <h3 className='text-base font-semibold truncate'>
                                {template.title || 'Untitled Template'}
                              </h3>
                              <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-100/50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-600/50 dark:border-cyan-500/30'>
                                {template.intent || 'general'}
                              </span>
                              <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 dark:border-purple-500/30'>
                                {template.type || 'default'}
                              </span>
                            </div>
                            <p className='text-sm opacity-80 truncate my-3 font-space'>
                              <span className='font-light tracking-tighter mr-1.5'>
                                Subject:
                              </span>
                              {template.subject || 'No subject defined'}
                            </p>
                            <div className='flex items-center gap-4 text-xs opacity-80 font-figtree'>
                              <span className='flex items-center gap-1.5'>
                                <Icon name='email' className='size-3' />
                                {template.from?.[0] || 'No sender'}
                              </span>
                              <span className='flex items-center gap-1.5'>
                                <Icon name='user' className='size-3' />
                                {(template.to?.length ?? 0) +
                                  (template.cc?.length ?? 0) +
                                  (template.bcc?.length ?? 0)}{' '}
                                recipients
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
