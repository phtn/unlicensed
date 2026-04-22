'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'

import Link from 'next/link'
import {ReactNode, Suspense, type PropsWithChildren} from 'react'

interface MainTab {
  href: string
  children?: ReactNode
}

export const MainTab = ({href, children}: MainTab) => {
  return (
    <Link
      href={href}
      prefetch={href !== 'auto'}
      className='group flex min-w-0 items-center gap-2 md:gap-4'
    >
      {children}
    </Link>
  )
}

interface ToolbarButtonProps {
  href: string
  label: string
  id?: string
  icon?: IconName
}

export const ToolbarWrapper = ({children}: PropsWithChildren) => {
  return (
    <div className='flex h-auto min-h-12 w-full min-w-0 items-center justify-between overflow-x-auto text-base md:h-11 md:min-h-0 md:overflow-visible'>
      {children}
    </div>
  )
}

const PrimaryTabInner = ({href, label, id, icon}: ToolbarButtonProps) => {
  const [tabId] = useAdminTabId()
  const isActive = tabId === id

  return (
    <Link
      id={id ?? label}
      href={href}
      prefetch
      className={cn(
        'text-sm flex items-center rounded-md px-2 py-1 md:px-2.5 md:p-2 dark:border-origin focus:bg-transparent active:bg-sidebar/40 border-white dark:bg-sidebar bg-light-gray/25 dark:hover:bg-indigo-500 dark:hover:text-white dark:hover:opacity-100 tracking-tight space-x-1.5 shrink-0',
        {
          'text-indigo-500 dark:text-indigo-100 rounded-none bg-transparent dark:bg-transparent dark:hover:bg-transparent px-0':
            tabId === 'new',
        },
      )}
    >
      <span
        className={cn(
          'capitalize underline underline-offset-4 decoration-transparent flex',
          {'decoration-indigo-500': isActive},
        )}
      >
        {icon && (
          <Icon
            name={icon}
            className='hidden md:flex size-4.5 mr-1 opacity-90'
          />
        )}
        {/*<span className='portrait:font-brk portrait:text-xs portrait:-tracking-widest'>*/}
        <span>{label}</span>
      </span>
    </Link>
  )
}

export const PrimaryTab = (props: ToolbarButtonProps) => {
  return (
    <Suspense fallback={<div className='w-16 h-8' />}>
      <PrimaryTabInner {...props} />
    </Suspense>
  )
}

const SecondaryTabInner = ({href, label, id, icon}: ToolbarButtonProps) => {
  const [tabId] = useAdminTabId()
  const isActive = tabId === id

  return (
    <Link
      id={id ?? label}
      href={href}
      prefetch
      className={cn(
        'shrink-0 p-1 md:p-2 text-sm dark:border-origin focus:bg-transparent active:bg-sidebar/40 border-white bg-white dark:bg-transparent hover:bg-foreground/8 -space-x-1.5',
        {
          'text-blue-500 dark:text-blue-100 rounded-none bg-transparent hover:bg-white dark:hover:bg-transparent -space-x-1.5':
            tabId === 'badges',
        },
      )}
    >
      <div
        className={cn(
          'capitalize flex items-center underline underline-offset-4 decoration-transparent',
          {'decoration-blue-500': isActive},
        )}
      >
        {icon && (
          <Icon name={icon} className='hidden md:flex size-5 mr-1 opacity-70' />
        )}
        {/*<span className='portrait:font-brk portrait:text-xs portrait:-tracking-widest'>*/}
        <span>{label}</span>
      </div>
    </Link>
  )
}

export const SecondaryTab = (props: ToolbarButtonProps) => {
  return (
    <Suspense fallback={<div className='w-fit md:w-16 h-8' />}>
      <SecondaryTabInner {...props} />
    </Suspense>
  )
}

export const ToolbarButtonWrapper = ({children}: PropsWithChildren) => {
  return (
    <div className='flex min-w-0 items-center gap-1 overflow-x-auto text-base md:gap-4 md:overflow-visible'>
      {children}
    </div>
  )
}
