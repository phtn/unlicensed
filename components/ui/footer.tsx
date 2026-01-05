'use client'
import {Icon} from '@/lib/icons'
import {Link} from '@heroui/react'

export const Footer = () => (
  <footer className='border-t border-foreground/20 bg-black'>
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
      <div className='flex flex-col gap-2'>
        <div className='h-10 flex items-center gap-x-2'>
          <Icon
            name='rapid-fire'
            className='h-40 md:h-32 w-auto aspect-auto dark:text-light-gray text-light-gray'
          />
        </div>

        <div className='hidden items-center space-x-1 opacity-60 text-sm text-light-gray leading-none'>
          <span className='text-xl opacity-50'>●</span>
          <span className='font-thin'>
            Redefining euphoria of true selection of marijuana.
          </span>
        </div>
      </div>
      <div className='flex flex-wrap justify-center items-center gap-3'>
        <Link
          href='/legal/terms-of-use'
          className='text-light-gray hover:text-foreground/80 text-xs'>
          Terms of Use
        </Link>
        <span className='opacity-20'>●</span>
        <Link
          href='/legal/privacy-policy'
          className='text-light-gray hover:text-foreground/80 text-xs'>
          Privacy Policy
        </Link>
        <span className='opacity-20'>●</span>
        <Link
          href='/legal/purchase-agreement'
          className='text-light-gray hover:text-foreground/80 text-xs'>
          Purchase Agreement
        </Link>
      </div>
    </div>
  </footer>
)
