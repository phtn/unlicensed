import {Button, Chip} from '@heroui/react'
import NextLink from 'next/link'
import {StoreCategory} from '../types'

interface Props {
  categories: StoreCategory[]
}

export const StrainFinderMini = ({categories}: Props) => {
  return (
    <section
      id='finder'
      className='mx-auto w-full max-w-7xl pt-36 px-4 sm:px-6 lg:px-8'>
      <div className='rounded-[36px] bg-background border border-foreground/20 sm:px-12 sm:py-16 transition-colors p-12'>
        <div className='grid gap-12 lg:grid-cols-5 lg:items-center'>
          <div className='space-y-10 lg:col-span-3'>
            <Chip
              variant='flat'
              className='w-fit rounded-full px-2 py-1.5 text-sm font-medium uppercase tracking-wider bg-foreground text-accent'>
              Strain Finder
            </Chip>
            <h2 className='text-3xl font-semibold text-foreground tracking-tight sm:text-4xl max-w-[22ch]'>
              Tell us how you want to{' '}
              <span className='font-space text-teal-400'>feel</span>. We’ll
              build your tasting flight.
            </h2>
            <p className='text-base opacity-60 max-w-[54ch]'>
              Dial in your desired experience, preferred flavor notes, and
              potency level. Our guided strain finder crafts a trio of
              recommendations matched to your vibe.
            </p>
            <div className='flex flex-wrap gap-3 text-sm'>
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
              href='/quiz'
              radius='full'
              variant='solid'
              className='cta-button w-fit px-8 py-5 text-sm font-semibold uppercase tracking-[0.35em] hover:brightness-110'>
              Start the Finder
            </Button>
          </div>
          <div className='grid gap-4 sm:grid-cols-2 lg:col-span-2'>
            {categories.map((category) => (
              <div
                key={category.slug}
                className='group relative overflow-hidden rounded-3xl border border-foreground/10 bg-(--surface-highlight) p-5 transition hover:-translate-y-1 hover:bg-panel/60'>
                <div className='flex flex-col gap-3'>
                  <span className='text-xs uppercase tracking-wide font-semibold opacity-60'>
                    {category.slug}
                  </span>

                  <p className='text-sm text-color-muted'>
                    {category.description}
                  </p>
                </div>
                <span className='absolute right-4 top-4 text-xs font-semibold text-color-muted transition group-hover:text-foreground'>
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
