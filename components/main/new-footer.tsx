import {Icon} from '@/lib/icons'
import Link from 'next/link'

export function NewFooter() {
  return (
    <footer className='border-t border-neutral-200 px-4 py-8 dark:border-neutral-800 sm:px-6 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row'>
        <div className='flex items-center space-x-1 font-clash'>
          <Icon
            name='rapid-fire-logo'
            className='size-5 text-neutral-500 dark:text-neutral-400'
          />
          <span className='text-sm font-cv text-neutral-500 dark:text-neutral-400'>
            ©{new Date().getFullYear()} RapidFire
          </span>
        </div>
        <nav
          className='flex flex-wrap font-clash font-normal items-center justify-center gap-6'
          aria-label='Footer navigation'>
          <Link
            href='/about'
            className='text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white'>
            About
          </Link>
          <Link
            href='/docs'
            className='text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white'>
            FAQs
          </Link>
          <Link
            href='/purchase-agreement'
            className='text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white'>
            Agreement
          </Link>
          <Link
            href='/privacy-policy'
            className='text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white'>
            Privacy
          </Link>
          <Link
            href='/terms-of-use'
            className='text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white'>
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}
