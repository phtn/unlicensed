'use client'
import {Icon} from '@/lib/icons'
import {Link} from '@heroui/react'

export const Footer = () => (
  <footer className='border-t-4 border-foreground/50 bg-background/80 transition-colors h-[10lvh]'>
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 transition-colors sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-1'>
          <Icon name='unlicensed' className='text-teal-500' />
          <span className='text-sm font-semibold uppercase '>Unlicensed</span>
        </div>

        <p className='text-sm text-color-muted'>
          Experiencing the greatest feeling of illegal marijuana.
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-3 text-color-muted'>
        <Link
          href='/#menu'
          className='text-color-muted hover:text-foreground/80 text-xs'>
          Strain Finder
        </Link>
        <Link
          href='/#finder'
          className='text-color-muted hover:text-foreground/80 text-xs'>
          Terms of Use
        </Link>
        <Link
          href='/privacy'
          className='text-color-muted hover:text-foreground/80 text-xs'>
          Privacy
        </Link>
      </div>
    </div>
  </footer>
)
