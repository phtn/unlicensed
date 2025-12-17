'use client'

import React, {forwardRef, useRef} from 'react'

import {cn} from '@/lib/utils'
import {AnimatedBeam} from '../ui/animated-beam'

const Circle = forwardRef<
  HTMLDivElement,
  {className?: string; children?: React.ReactNode}
>(({className, children}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative z-10 flex size-5 opacity-0 items-center mx-14 justify-center rounded-full border-2 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]',
        className,
      )}>
      <span className='text-brand opacity-10'>{children}</span>
    </div>
  )
})

Circle.displayName = 'Circle'

export function Beams() {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)
  const div7Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className='relative flex h-64 w-full items-center justify-center overflow-hidden p-0'
      ref={containerRef}>
      <div className='flex w-full h-fit flex-col justify-between'>
        <div className='flex items-center justify-center gap-x-8 w-full'>
          <Circle ref={div6Ref}>6</Circle>
          <Circle ref={div1Ref}>1</Circle>
          <Circle ref={div3Ref}>3</Circle>
          <Circle ref={div5Ref}>5</Circle>
          <Circle ref={div7Ref}>7</Circle>
          <Circle ref={div2Ref}>2</Circle>
          <Circle ref={div4Ref}>4</Circle>
        </div>
      </div>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-15}
        endYOffset={-10}
        decay={true}
        decayStart={0.8} // Start fading at 50% along the path
        decayEnd={1} // Fully faded at the end
        decayIntensity={0.8}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={25}
        endYOffset={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-15}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        curvature={-5}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={5}
        endYOffset={10}
        reverse
      />
    </div>
  )
}
