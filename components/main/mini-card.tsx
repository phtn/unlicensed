import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import Link from 'next/link'
import {useState} from 'react'

export interface MiniCardProps {
  id: string
  title: string
  description: string
  icon: IconName
  href?: string
}

export const MiniCard = ({id, title, description, icon}: MiniCardProps) => {
  return (
    <li
      key={id}
      className='text-white bg-brand flex flex-col group hover:bg-black p-8 rounded-xs'>
      <Icon
        name={icon}
        className='size-8 opacity-80 group-hover:text-white'
        aria-hidden
      />
      <h3 className='mt-2 text-lg font-cv font-semibold text-white dark:text-neutral-800'>
        {title}
      </h3>
      <p className='mt-1 text-sm opacity-80 group-hover:opacity-100'>
        {description}
      </p>
    </li>
  )
}

export const MiniCardV2 = ({
  id,
  title,
  description,
  icon,
  dark,
  href,
}: MiniCardProps & {dark?: boolean}) => {
  const [clicked, setClicked] = useState(false)
  return (
    <Link
      onClick={() => setClicked(!clicked)}
      prefetch='auto'
      href={href as string}
      className='cursor-pointer'>
      <div
        key={id}
        className={cn(
          'flex items-center space-x-6 text-white! bg-brand group p-5 rounded-xs portrait:min-h-28!',
          {'bg-black dark:bg-sidebar': dark},
        )}>
        <Icon
          name={clicked ? 'spinners-ring' : icon}
          className='size-10'
          aria-hidden
        />
        <div className=''>
          <h3 className='text-lg md:text-xl font-cv font-semibold text-white'>
            {title}
          </h3>
          <p className='mt-1 text-sm opacity-80 group-hover:opacity-100'>
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}
