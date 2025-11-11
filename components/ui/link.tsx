import {cn} from '@/lib/utils'
import {AnchorHTMLAttributes} from 'react'

type LinkProps = {
  dark?: boolean
  isIconOnly?: boolean
} & AnchorHTMLAttributes<HTMLAnchorElement>
export const ExternalLink = ({
  dark = false,
  isIconOnly = false,
  ...props
}: LinkProps) => {
  return (
    <a
      {...props}
      className={cn(
        'h-fit w-full gap-2 px-2',
        'flex items-center justify-center',
        'rounded-full bg-foreground text-background',
        'hover:bg-[#383838] dark:hover:bg-accent/5',
        'transition-colors duration-200 ease-out',
        {'bg-background text-foreground': dark, 'px-0 p-2': isIconOnly},

        props.className,
      )}
      rel='noopener noreferrer'
      target='_blank'>
      <div className='h-fit'>{props.children}</div>
    </a>
  )
}
