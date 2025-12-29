'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
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
      prefetch={href !== ''}
      className='flex items-center space-x-1 md:space-x-4 group'>
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
    <div className='flex text-base items-center justify-between h-12 md:h-14 w-full'>
      {children}
    </div>
  )
}

const PrimaryTabInner = ({href, label, id, icon}: ToolbarButtonProps) => {
  const [tabId] = useAdminTabId()
  const isActive = tabId === id

  return (
    <Button
      id={id ?? label}
      as={Link}
      size='sm'
      prefetch
      href={href}
      disableRipple
      disableAnimation
      variant='bordered'
      className={cn(
        'text-sm flex items-center p-1 md:p-2 dark:border-origin focus:bg-transparent active:bg-sidebar/40 border-white dark:bg-sidebar bg-light-gray/25 dark:hover:bg-indigo-500 dark:hover:text-white dark:hover:opacity-100 tracking-tight space-x-1.5 shrink-0',
        {
          'text-indigo-500 dark:text-indigo-100 rounded-none bg-transparent dark:bg-transparent dark:hover:bg-transparent px-0':
            tabId === 'new',
        },
      )}>
      <span
        className={cn(
          'capitalize underline underline-offset-4 decoration-transparent flex',
          {'decoration-indigo-500': isActive},
        )}>
        {icon && (
          <Icon name={icon} className='hidden md:flex size-5 mr-1 opacity-80' />
        )}
        <span>{label}</span>
      </span>
    </Button>
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
    <Button
      id={id ?? label}
      as={Link}
      href={href}
      prefetch
      variant='bordered'
      disableRipple
      disableAnimation
      size='sm'
      className={cn(
        ' p-1 md:p-2 text-sm dark:border-origin focus:bg-transparent active:bg-sidebar/40 border-white bg-white dark:bg-transparent hover:bg-foreground/25 -space-x-1.5',
        {
          'text-blue-500 dark:text-blue-100 rounded-none bg-transparent hover:bg-white dark:hover:bg-transparent -space-x-1.5':
            tabId === 'badges',
        },
      )}>
      <div
        className={cn(
          'capitalize flex items-center underline underline-offset-4 decoration-transparent',
          {'decoration-blue-500': isActive},
        )}>
        {icon && (
          <Icon name={icon} className='hidden md:flex size-5 mr-1 opacity-70' />
        )}
        <span className='font-medium'>{label}</span>
      </div>
    </Button>
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
    <div className='flex items-center space-x-0 md:space-x-4 text-base'>
      {children}
    </div>
  )
}
