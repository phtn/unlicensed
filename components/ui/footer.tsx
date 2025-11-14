'use client'
import {Icon} from '@/lib/icons'
import {Link} from '@heroui/react'

export const Footer = () => (
  <footer className='border-t border-foreground/20 bg-background/80 transition-colors h-[10lvh]'>
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 transition-colors sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-x-2'>
          <div
            id='unlicensed-logo'
            className='flex items-center justify-center rounded-full leading-none border-[0.33px] aspect-square size-2'>
            <span className='text-teal-400 text-lg drop-shadow-xs'>●</span>
          </div>
          <span className='text-sm font-normal font-fugaz opacity-80'>
            unlicensed
          </span>
        </div>

        <div className='flex items-center space-x-2 opacity-60 text-sm text-color-muted'>
          <Icon name='mushrooms' className='size-3' />
          <span className='font-thin mr-2'>
            Redefining euphoria of true illegal marijuana.
          </span>
        </div>
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
