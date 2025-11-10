import {cn} from '@/lib/utils'
import {AnchorHTMLAttributes} from 'react'

type LinkProps = {
  dark?: boolean
} & AnchorHTMLAttributes<HTMLAnchorElement>
export const ExternalLink = ({dark = false, ...props}: LinkProps) => {
  return (
    <a
      className={cn(
        'h-12 w-full gap-2 px-2',
        'flex items-center justify-center',
        'rounded-full bg-foreground text-background',
        'hover:bg-[#383838] dark:hover:bg-[#ccc]',
        'transition-colors duration-200 ease-out',
        {'bg-background text-foreground': dark},
      )}
      rel='noopener noreferrer'
      target='_blank'
      {...props}
    />
  )
}
