'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import gsap from 'gsap'
import {useEffect, useRef} from 'react'

interface ChatCommsProps {
  isOpen: boolean
  onCloseComplete?: VoidFunction
}

export const ChatComms = ({isOpen, onCloseComplete}: ChatCommsProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const buttons = gsap.utils.toArray<HTMLElement>('[data-chat-comms-item]')

      gsap.killTweensOf([root, ...buttons])

      if (isOpen) {
        gsap.set(buttons, {willChange: 'transform, opacity'})

        gsap.fromTo(
          buttons,
          {
            autoAlpha: 0,
            gap: 0,
            scale: 0.96,
          },
          {
            autoAlpha: 1,
            gap: 4,
            scale: 1,
            duration: 0.4,
            ease: 'power3.out',
            force3D: true,
            stagger: {
              each: 0.1,
              from: 'start',
            },
            onComplete: () => {
              gsap.set(buttons, {
                clearProps: 'opacity,visibility,transform,willChange',
              })
            },
          },
        )
        return
      }

      gsap.to(buttons, {
        autoAlpha: 0,
        x: 25,
        duration: 0.225,
        ease: 'power2.in',
        stagger: {
          each: 0.025, // open ? index * 15 : (navItems.length - 1 - index) * 45
          from: 'start',
        },
        onComplete: onCloseComplete,
      })
    }, root)

    return () => ctx.revert()
  }, [isOpen, onCloseComplete])

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed right-0 bottom-3 md:bottom-7 flex h-15 w-96 md:w-110 gap-14 md:gap-16 items-center justify-start overflow-visible rounded-s-full rounded-e-full bg-black/10 px-7 text-balance text-white shadow-lg backdrop-blur-sm',
      )}>
      <Button
        data-chat-comms-item
        isIconOnly
        variant='primary'
        size='sm'
        className='relative group bg-white size-6 flex flex-col items-center justify-center overflow-visible text-messenger aspect-square'>
        <Icon name='messenger' className='size-8 drop-shadow-2xs' />
        <span className='opacity-0 font-clash font-medium md:group-hover:opacity-100 absolute -top-8 text-[10px] tracking-tight text-white'>
          Messenger
        </span>
      </Button>
      <Button
        data-chat-comms-item
        isIconOnly
        variant='primary'
        size='sm'
        className='relative group bg-white size-6 flex items-center justify-center overflow-visible text-telegram aspect-square'>
        <Icon name='telegram' className='size-8 drop-shadow-2xs' />
        <p className='opacity-0 font-clash md:group-hover:opacity-100 absolute -top-8 text-[10px] tracking-tighter text-white hover:-translate-y-5 transition-all duration-300'>
          Telegram
        </p>
      </Button>
      <Button
        data-chat-comms-item
        isIconOnly
        variant='primary'
        size='sm'
        className='relative group bg-white size-6 flex items-center justify-center overflow-visible text-whatsapp aspect-square shadow-inner'>
        <Icon name='whatsapp' className='size-10 drop-shadow-2xs' />
        <p className='opacity-0 font-clash md:group-hover:opacity-100 absolute -top-8 text-[10px] tracking-tighter text-white hover:-translate-y-5 transition-all duration-300'>
          WhatsApp
        </p>
      </Button>
      <Button
        data-chat-comms-item
        isIconOnly
        variant='primary'
        size='sm'
        className='bg-white text-dark-table aspect-square'>
        <Icon name='hot' />
        <p className='opacity-0 font-clash md:group-hover:opacity-100 absolute -top-8 text-[10px] tracking-tighter text-white hover:-translate-y-5 transition-all duration-300'>
          SMS
        </p>
      </Button>
    </div>
  )
}
