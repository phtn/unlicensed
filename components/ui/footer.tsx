'use client'
import {Icon} from '@/lib/icons'
import {Link} from '@heroui/react'

export const Footer = () => (
  <footer className='border-t border-foreground/20 bg-slate-300/30 transition-colors '>
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 transition-colors sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
      <div className='flex flex-col gap-2'>
        <div className='h-10 flex items-center gap-x-2'>
          <Icon
            name='rapid-fire'
            className='h-28 w-auto aspect-auto text-brand'
          />
        </div>

        <div className='flex items-center space-x-1 opacity-60 text-sm text-color-muted leading-none'>
          <span className='text-xl opacity-50'>●</span>
          <span className='font-thin'>
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
          href='/legal/terms-of-use'
          className='text-color-muted hover:text-foreground/80 text-xs'>
          Terms of Use
        </Link>
        <Link
          href='/legal/privacy-policy'
          className='text-color-muted hover:text-foreground/80 text-xs'>
          Privacy Policy
        </Link>
        <Link
          href='/legal/purchase-agreement'
          className='text-color-muted hover:text-foreground/80 text-xs'>
          Purchase Agreement
        </Link>
      </div>
    </div>
  </footer>
)
