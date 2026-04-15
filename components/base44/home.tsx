import {cn} from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export const NewHome = () => {
  return (
    <section className='relative bg-linear-to-b bg-background dark:bg-black 2xl:min-h-screen'>
      <div className='relative w-full overflow-hidden bg-background portrait:h-[98lvh] h-[86lvh] sm:h-[44vh] md:h-[50vh] lg:h-[58vh] xl:h-[75vh] 2xl:h-screen'>
        <Image
          priority
          width={1168}
          height={1536}
          quality={75}
          sizes={'100vw'}
          fetchPriority='high'
          src='https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1776263247/b-mobile-all_89eccf.webp'
          // src='https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1775501423/banner-mobile_uycmyn.webp'
          alt='Rapid Fire featured cannabis products'
          className='object-cover h-full sm:hidden w-full'
        />
        <Image
          priority
          width={2752}
          height={1536}
          quality={75}
          fetchPriority='high'
          // src='https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1776262556/b-desktop-e-2_be2f00.png'
          // src='https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1776262934/b-desktop-r_8bd131.png'
          src='https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1776262865/b-desktop-all-e_a17c8e.png'
          // src='https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1775501618/banner-desktop_gs5xzr.png'
          alt='Rapid Fire featured cannabis products'
          className='hidden object-cover sm:block h-full w-full'
        />
      </div>

      <div
        className={cn(
          'absolute left-1/2 z-10 -translate-x-1/2 border border-white/80 bg-white px-8 md:px-12 py-2 text-lg font-clash font-semibold uppercase text-brand hover:border-light-brand hover:bg-brand hover:text-white sm:px-8 sm:py-3 lg:text-xl',
          'bottom-40 sm:bottom-36 md:bottom-24 lg:bottom-22 xl:bottom-24 2xl:bottom-28',
        )}>
        <Link id='shop-now' href='/lobby/category'>
          <span className=' whitespace-nowrap'>Shop Now</span>
        </Link>
      </div>
    </section>
  )
}
