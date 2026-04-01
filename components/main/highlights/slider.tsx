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
      <div className='relative overflow-hidden h-screen '>
        <Image
          width={0}
          height={0}
          src={imageUrl}
          alt='Beautiful flower'
          priority
          unoptimized
          className='h-auto w-full md:object-cover aspect-auto select-none'
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
