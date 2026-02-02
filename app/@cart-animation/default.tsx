'use client'

import {useCartAnimation} from '@/ctx/cart-animation'
import Image from 'next/image'
import {useEffect, useRef} from 'react'

const CART_ICON_SELECTOR = '[data-cart-icon]'

// Animation settings matching cart-animate.tsx
const ANIMATION_SETTINGS = {
  startCurveX: -58,
  startCurveY: -200,
  endCurveX: 196,
  endCurveY: 130,
  startTiming: 0.4,
}

export default function CartAnimation() {
  const {animationState, clearAnimation} = useCartAnimation()
  const animationRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)
  const wobbleTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!animationState.isAnimating || !animationState.productImage) {
      return
    }

    cancelledRef.current = false

    console.log('Cart animation triggered', {
      isAnimating: animationState.isAnimating,
      productImage: animationState.productImage,
      startPosition: animationState.startPosition,
    })

    // Wait a bit for DOM to be ready
    const timeoutId = setTimeout(() => {
      if (cancelledRef.current) return

      const cartIcon = document.querySelector(CART_ICON_SELECTOR)
      console.log('Cart icon found:', cartIcon, 'Selector:', CART_ICON_SELECTOR)

      if (!cartIcon || !animationState.startPosition) {
        console.warn('Cart icon or start position not found', {
          cartIcon: !!cartIcon,
          startPosition: !!animationState.startPosition,
          allElements: document.querySelectorAll('[data-cart-icon]').length,
        })
        clearAnimation()
        return
      }

      const cartRect = cartIcon.getBoundingClientRect()
      const endX = cartRect.left + cartRect.width / 2
      const endY = cartRect.top + cartRect.height / 2

      const startX = animationState.startPosition.x
      const startY = animationState.startPosition.y

      if (!animationRef.current || cancelledRef.current) return

      const element = animationRef.current
      element.style.left = `${startX}px`
      element.style.top = `${startY}px`
      element.style.opacity = '1'
      element.style.visibility = 'visible'
      element.style.transform = 'translate(-50%, -50%) scale(1)'
      element.style.display = 'block'

      const startTime = performance.now()
      const duration = 1000

      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      }

      const animate = (currentTime: number) => {
        if (cancelledRef.current) return

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = easeInOutCubic(progress)

        // Calculate control points with offsets
        let p1x = startX + ANIMATION_SETTINGS.startCurveX
        let p1y = startY + ANIMATION_SETTINGS.startCurveY
        let p2x = endX + ANIMATION_SETTINGS.endCurveX
        let p2y = endY + 60 + ANIMATION_SETTINGS.endCurveY

        // Clamp control points to stay within screen bounds with padding
        const padding = 20
        p1x = Math.max(padding, Math.min(window.innerWidth - padding, p1x))
        p1y = Math.max(padding, Math.min(window.innerHeight - padding, p1y))
        p2x = Math.max(padding, Math.min(window.innerWidth - padding, p2x))
        p2y = Math.max(padding, Math.min(window.innerHeight - padding, p2y))

        // Cubic bezier formula: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
        const t = easeProgress
        const mt = 1 - t
        const x =
          Math.pow(mt, 3) * startX +
          3 * Math.pow(mt, 2) * t * p1x +
          3 * mt * Math.pow(t, 2) * p2x +
          Math.pow(t, 3) * endX
        const y =
          Math.pow(mt, 3) * startY +
          3 * Math.pow(mt, 2) * t * p1y +
          3 * mt * Math.pow(t, 2) * p2y +
          Math.pow(t, 3) * endY

        const scale = 1 - easeProgress * 0.7

        element.style.left = `${x}px`
        element.style.top = `${y}px`
        element.style.transform = `translate(-50%, -50%) scale(${scale})`
        element.style.opacity = String(Math.max(0, 1 - easeProgress * 0.3))

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(animate)
        } else {
          // Animation complete - trigger cart wobble
          const cartIconElement = cartIcon as HTMLElement
          const badgeElement = cartIcon.closest(
            '[class*="badge"]',
          ) as HTMLElement

          // Apply wobble to both cart icon and badge
          cartIconElement.classList.add('cart-wobble')
          if (badgeElement) {
            badgeElement.classList.add('cart-wobble')
          }

          wobbleTimeoutIdRef.current = setTimeout(() => {
            wobbleTimeoutIdRef.current = null
            if (cancelledRef.current) return
            cartIconElement.classList.remove('cart-wobble')
            if (badgeElement) {
              badgeElement.classList.remove('cart-wobble')
            }
          }, 800)

          clearAnimation()
        }
      }

      rafIdRef.current = requestAnimationFrame(animate)
    }, 50) // Small delay to ensure DOM is ready

    return () => {
      cancelledRef.current = true
      clearTimeout(timeoutId)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (wobbleTimeoutIdRef.current !== null) {
        clearTimeout(wobbleTimeoutIdRef.current)
        wobbleTimeoutIdRef.current = null
      }
    }
  }, [animationState, clearAnimation])

  // Always render the container with image, but keep it hidden when not animating
  return (
    <div
      ref={animationRef}
      className='fixed pointer-events-none z-9999'
      style={{
        opacity: 0,
        visibility: 'hidden',
        display: 'none',
        transform: 'translate(-50%, -50%) scale(1)',
      }}>
      {animationState.productImage && (
        <div className='relative w-16 h-16 rounded-lg overflow-hidden border-2 border-foreground/20 shadow-lg'>
          <Image
            src={animationState.productImage}
            alt='Product'
            width={64}
            height={64}
            className='object-cover w-full h-full'
          />
        </div>
      )}
    </div>
  )
}
