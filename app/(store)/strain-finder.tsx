import {Icon} from '@/lib/icons'
import {Button, Chip, Link} from '@heroui/react'
import NextLink from 'next/link'
import {StoreCategory} from '../types'

interface Props {
  categories: StoreCategory[]
}

export const StrainFinderMini = ({categories}: Props) => {
  return (
    <section
      id='finder'
      className='mx-auto w-full max-w-7xl pt-20 px-2 sm:px-4'>
      <div className='rounded-[36px] bg-slate-200 dark:bg-dark-table/50 border border-foreground/20 sm:px-12 sm:py-16 transition-colors px-6 py-10'>
        <div className='grid gap-12 lg:grid-cols-5 lg:items-center'>
          <div className='space-y-10 lg:col-span-3'>
            <Chip
              variant='flat'
              className='w-fit rounded-full px-2 py-1.5 text-sm font-medium uppercase tracking-wider bg-foreground text-accent'>
              Strain Finder
            </Chip>
            <h2 className='text-3xl font-bold text-foreground tracking-tight sm:text-4xl max-w-[24ch] font-polysans py-12 sm:py-1'>
              Describe the <span className='text-effects'>feeling</span> you’re
              after. We&apos;ll design your tasting flight.
            </h2>
            <p className='hidden md:flex text-base opacity-60 max-w-[54ch]'>
              Dial in your desired experience, preferred flavor notes, and
              potency level. Our guided strain finder crafts a trio of
              recommendations matched to your vibe.
            </p>
            <div className='hidden _flex flex-wrap gap-3 text-sm'>
              {[
                'Mood-based curation',
                'Terpene-forward suggestions',
                'Supports micro & macro dosing',
              ].map((vibe, i) => (
                <span
                  key={i}
                  className='bg-white/70 border border-foreground/15 text-black rounded-full px-4 py-2 tracking-tight'>
                  {vibe}
                </span>
              ))}
            </div>
            <Button
              as={NextLink}
              size='lg'
              href='/strain-finder'
              radius='full'
              variant='solid'
              disableRipple
              className='bg-transparent text-sm font-semibold uppercase tracking-[0.35em]'>
              <div className='flex items-center justify-start space-x-10'>
                <div className='w-12 h-12 mr-2 border border-black rounded-full flex items-center justify-between'></div>
                <span className='px-4 text-lg font-light font-polysans'>
                  Start the Finder
                </span>
              </div>
            </Button>
          </div>
          <div className='hidden md:grid gap-4 sm:grid-cols-2 lg:col-span-2'>
            {categories.map((category) => (
              <Link
                href={`/category/${category.slug}`}
                key={category.slug}
                className='group relative overflow-hidden rounded-3xl border border-foreground/10 dark:bg-(--surface-highlight) bg-slate-500/15 p-5 transition hover:-translate-y-1 hover:bg-panel/60'>
                <div className='flex flex-col gap-3'>
                  <span className='text-xs uppercase font-fugaz font-semibold opacity-60 dark:text-light-gray text-dark-gray'>
                    {category.slug}
                  </span>

                  <p className='text-sm dark:text-muted-foreground max-w-[40ch] line-clamp-2 text-dark-gray'>
                    {category.description}
                  </p>
                </div>
                <span className='absolute right-4 top-4 text-xs font-semibold text-color-muted transition group-hover:text-foreground dark:text-brand text-dark-gray'>
                  <Icon name='chevron-right' className='size-4' />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
