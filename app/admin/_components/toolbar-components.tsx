import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import Link from 'next/link'

interface ToolbarButtonProps {
  route: string | undefined
  href: string
  label: string
  id?: string
  icon?: IconName
}
export const PrimaryTab = ({
  route,
  href,
  label,
  id,
  icon,
}: ToolbarButtonProps) => {
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
        'flex items-center px-1.5 dark:border-origin border-white dark:bg-zinc-700 bg-light-gray/15 dark:hover:bg-indigo-500 dark:hover:text-white dark:hover:opacity-100 tracking-tight -space-x-1.5 shrink-0',
        {
          'text-indigo-500 dark:text-indigo-100 rounded-none bg-transparent dark:bg-transparent dark:hover:bg-transparent px-0':
            route === 'new',
        },
      )}>
      <span
        className={cn(
          'capitalize underline underline-offset-4 decoration-transparent flex',
          {'decoration-indigo-500': route === id},
        )}>
        {icon && <Icon name={icon} className='size-4' />}
        <span>{label}</span>
      </span>
    </Button>
  )
}
export const SecondaryTab = ({
  route,
  href,
  label,
  id,
  icon,
}: ToolbarButtonProps) => {
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
        'dark:border-origin border-white bg-white dark:bg-transparent hover:bg-light-gray/15 -space-x-1.5',
        {
          'text-blue-500 dark:text-blue-100 rounded-none bg-transparent hover:bg-white dark:hover:bg-transparent -space-x-1.5':
            route === 'badges',
        },
      )}>
      <span
        className={cn(
          'capitalize underline underline-offset-4 decoration-transparent',
          {'decoration-blue-500': route === id},
        )}>
        {icon && <Icon name={icon} className='size-4' />}
        <span>{label}</span>
      </span>
    </Button>
  )
}
