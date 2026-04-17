import {Icon} from '@/lib/icons'
import Link from 'next/link'

export function NewFooter() {
  return (
    <footer className='px-4 py-8 dark:border-neutral-800 sm:px-6 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row'>
        <div className='flex items-center space-x-2 font-clash'>
          <Icon name='rapid-fire-logo' className='size-5 text-foreground/80' />
          <div className='flex items-center text-sm font-cv text-foreground space-x-1.5'>
            <span className='text-[13px]'>©</span>{' '}
            <span>{new Date().getFullYear()}</span> <span>RapidFire</span>
          </div>
        </div>
        <nav
          className='flex flex-wrap font-clash font-normal items-center justify-center gap-6'
          aria-label='Footer navigation'>
          <Link
            href='/about'
            className='text-sm text-foreground/70 hover:text-foreground'>
            About
          </Link>
          <Link
            href='/docs'
            className='text-sm text-foreground/70 hover:text-foreground'>
            FAQ
          </Link>
          <Link
            href='/purchase-agreement'
            className='text-sm text-foreground/70 hover:text-foreground'>
            Agreement
          </Link>
          <Link
            href='/privacy-policy'
            className='text-sm text-foreground/70 hover:text-foreground'>
            Privacy
          </Link>
          <Link
            href='/terms-of-use'
            className='text-sm text-foreground/70 hover:text-foreground'>
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}
