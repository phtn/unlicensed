import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import Image from 'next/image'
import {ReactNode} from 'react'

export interface Slide {
  id: string
  imageUrl: string
  imageAlt: string
  title: ReactNode
  description: string
  ctaText?: string
  ctaHref: string
  tag?: string
}

export const Slider = ({
  imageUrl,
  // id,
  // tag,
  // title,
  // description,
  // ctaHref,
  // ctaText,
  // product,
  // variantOptions,
}: Slide) => {
  return (
    <div className='relative min-w-full flex-[0_0_100%] md:snap-start md:snap-always'>
      {/*<div className={cn({'mt-10': id === 'rapid-fire'})}>
            {id === 'rapid-fire' ? (
              <Icon
                name='rapid-fire-latest'
                className='hidden h-28 w-auto text-zinc-400'
              />
            ) : (
              <Tag text={tag} />
            )}
            {title}
            <p className='hidden md:flex text-base opacity-70 mb-12 max-w-[38ch] leading-relaxed'>
              {description}
            </p>
            <div className='flex items-center md:gap-4 lg:gap-5 relative z-100'>
              {ctaText && (
                <Button
                  as={Link}
                  href={ctaHref}
                  variant='solid'
                  className='hidden md:flex dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand dark:hover:text-white bg-brand font-polysans font-light hover:text-white text-white px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg hover:opacity-100'>
                  {ctaText}
                </Button>
              )}
              {ctaText && (
                <Button
                  size='lg'
                  as={Link}
                  href={'/lobby/deals'}
                  prefetch
                  onPress={toggle}
                  variant='light'
                  className='hidden border dark:border-dark-gray md:flex items-center gap-2 dark:text-terpenes bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg font-polysans font-light'>
                  <span className='tracking-tight'>Find Deals</span>
                  <Icon
                    name={navigating ? 'spinners-ring' : 'search-magic'}
                    className={cn('size-3 sm:w-4 sm:h-4 dark:text-white', {
                      'sm:size-4': !navigating,
                    })}
                  />
                </Button>
              )}
            </div>
          </div>*/}

      <div className='relative overflow-hidden'>
        <Image
          width={0}
          height={0}
          src={imageUrl}
          alt='Beautiful flower'
          priority
          unoptimized
          className='h-auto w-full object-cover aspect-auto select-none'
        />
      </div>
    </div>
  )
}

export interface SlideButtonProps {
  onPress: VoidFunction
  label: string
  icon: IconName
}

const SliderButton = ({onPress, label, icon}: SlideButtonProps) => {
  return (
    <Button
      isIconOnly
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl',
        'group hover:bg-foreground/5 bg-transparent',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        'focus-visible:outline-none focus-visible:ring-2',
      )}
      onPress={onPress}
      aria-label={label}>
      <Icon name={icon} className='size-4' />
    </Button>
  )
}

export const SliderControls = ({controls}: {controls: SlideButtonProps[]}) => {
  return (
    <div className='flex gap-2'>
      {controls.map((control) => (
        <SliderButton
          key={control.label}
          icon={control.icon}
          label={control.label}
          onPress={control.onPress}
        />
      ))}
    </div>
  )
}
