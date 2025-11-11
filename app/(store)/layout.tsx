import {Link} from '@heroui/react'
import type {ReactNode} from 'react'

type StoreLayoutProps = {
  children: ReactNode
}

const Footer = () => (
  <footer className='border-t border-(--surface-outline) bg-background backdrop-blur-2xl transition-colors'>
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 transition-colors sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
      <div className='flex flex-col gap-2'>
        <span className='text-[11px] font-semibold uppercase tracking-[0.45em] text-color-muted'>
          Hyfe
        </span>
        <p className='text-sm text-color-muted'>
          Boutique THC goods for mindful rituals and elevated evenings.
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-3 text-sm text-color-muted'>
        <Link
          href='/#menu'
          className='text-color-muted hover:text-foreground/80'>
          Menu
        </Link>
        <Link
          href='/#finder'
          className='text-color-muted hover:text-foreground/80'>
          Strain Finder
        </Link>
        <Link
          href='/privacy'
          className='text-color-muted hover:text-foreground/80'>
          Privacy
        </Link>
        <Link
          href='/contact'
          className='text-color-muted hover:text-foreground/80'>
          Contact
        </Link>
      </div>
    </div>
  </footer>
)

const StoreLayout = ({children}: StoreLayoutProps) => {
  return (
    <div className='flex min-h-screen flex-col'>
      <main className='relative flex-1'>{children}</main>
      <Footer />
    </div>
  )
}

export default StoreLayout
