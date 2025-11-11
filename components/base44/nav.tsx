import {Icon} from '@/lib/icons'
import {Link} from '@heroui/react'
import {ExternalLink} from '../ui/link'
import {ThemeToggle} from '../ui/theme-toggle'

interface NavProps {
  children?: React.ReactNode
}

export const Nav = ({children}: NavProps) => {
  return (
    <header className='fixed top-0 left-0 right-0 z-100 bg-black backdrop-blur-sm'>
      <div className='max-w-7xl mx-auto px-6 py-3 flex items-center justify-between'>
        <Link
          href={'/'}
          className='flex items-center gap-2 text-sm md:text-base font-space text-gray-200'>
          <Icon
            name='unlicensed'
            className='size-6 text-teal-300 rounded-full'
          />
          <div className='uppercase tracking-tighter lg:tracking-normal font-medium font-sans text-sm'>
            {children ?? 'unlicensed'}
          </div>
        </Link>
        <nav className='flex items-center gap-8'>
          <Link
            href={'#'}
            className='text-sm text-gray-100 hover:text-secondary transition-colors'>
            Shop
          </Link>
          {/*<Link
            href={'#'}
            className='text-sm text-gray-100 hover:text-secondary transition-colors'>
            Library
          </Link>*/}
        </nav>
        <div className='flex items-center gap-1 md:gap-4'>
          <ThemeToggle />

          <ExternalLink className='capitalize bg-black' isIconOnly>
            <Icon name='bag-light' className='size-6 text-teal-400' />
          </ExternalLink>
        </div>
      </div>
    </header>
  )
}
