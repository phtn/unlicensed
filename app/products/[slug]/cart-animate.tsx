'use client'

import {useCallback, useEffect} from 'react'

import {Icon} from '@/lib/icons'
import {useRef, useState} from 'react'
import SettingsPanel from './config-panel'
import ProductCard from './product-card'
//s-58-200 e-1193-129
export const FlyingCart = () => {
  const [animationSettings, setAnimationSettings] = useState({
    showPath: true,
    startCurveX: -58,
    startCurveY: -200,
    endCurveX: 196,
    endCurveY: 130,
    startTiming: 0.4,
  })

  const [cartCount, setCartCount] = useState(0)
  const [cartScaling, setCartScaling] = useState(false)
  const cartRef = useRef<HTMLDivElement>(null)
  const productRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawPath = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !productRef.current || !cartRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Update canvas size to match window
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const productRect = productRef.current.getBoundingClientRect()
    const cartRect = cartRef.current.getBoundingClientRect()

    const startX = productRect.left + productRect.width / 2
    const startY = productRect.top + productRect.height / 2
    const endX = cartRect.left + cartRect.width / 2
    const endY = cartRect.top + cartRect.height / 2

    // Calculate control points with offsets
    let p1x = startX + animationSettings.startCurveX
    let p1y = startY + animationSettings.startCurveY
    let p2x = endX + animationSettings.endCurveX
    let p2y = endY + animationSettings.endCurveY

    // Clamp control points to stay within screen bounds with padding
    const padding = 20
    p1x = Math.max(padding, Math.min(window.innerWidth - padding, p1x))
    p1y = Math.max(padding, Math.min(window.innerHeight - padding, p1y))
    p2x = Math.max(padding, Math.min(window.innerWidth - padding, p2x))
    p2y = Math.max(padding, Math.min(window.innerHeight - padding, p2y))

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw smooth cubic bezier curve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.bezierCurveTo(p1x, p1y, p2x, p2y, endX, endY)
    ctx.stroke()

    // Draw control points
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(startX, startY, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(100, 150, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(p1x, p1y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(100, 150, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(p2x, p2y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(endX, endY, 4, 0, Math.PI * 2)
    ctx.fill()
  }, [
    animationSettings.endCurveX,
    animationSettings.endCurveY,
    animationSettings.startCurveX,
    animationSettings.startCurveY,
  ])

  useEffect(() => {
    if (animationSettings.showPath) {
      drawPath()
      window.addEventListener('resize', drawPath)
      return () => window.removeEventListener('resize', drawPath)
    }
  }, [animationSettings, drawPath])

  const handleAddToCart = useCallback(() => {
    if (!productRef.current || !cartRef.current) return

    const productRect = productRef.current.getBoundingClientRect()
    const cartRect = cartRef.current.getBoundingClientRect()

    const flyingItem = document.createElement('div')
    flyingItem.className = 'fixed pointer-events-none z-50'
    flyingItem.innerHTML = `
      <div class="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">
        ☕
      </div>
    `
    const startX = productRect.left + productRect.width / 2
    const startY = productRect.top + productRect.height / 2
    flyingItem.style.left = startX + 'px'
    flyingItem.style.top = startY + 'px'
    flyingItem.style.transform = 'translate(-50%, -50%)'
    document.body.appendChild(flyingItem)

    const startTime = performance.now()
    const duration = 1000

    const easeInOutCubic = (t: number, control: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = easeInOutCubic(
        progress,
        animationSettings.startTiming,
      )

      // Control points for cubic bezier
      const p0x = startX
      const p0y = startY

      const endX = cartRect.left + cartRect.width / 2
      const endY = cartRect.top + cartRect.height / 2

      // Calculate control points with offsets
      let p1x = startX + animationSettings.startCurveX
      let p1y = startY + animationSettings.startCurveY
      let p2x = endX + animationSettings.endCurveX
      let p2y = endY + 60 + animationSettings.endCurveY

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
        Math.pow(mt, 3) * p0x +
        3 * Math.pow(mt, 2) * t * p1x +
        3 * mt * Math.pow(t, 2) * p2x +
        Math.pow(t, 3) * endX
      const y =
        Math.pow(mt, 3) * p0y +
        3 * Math.pow(mt, 2) * t * p1y +
        3 * mt * Math.pow(t, 2) * p2y +
        Math.pow(t, 3) * endY

      const scale = 1 - easeProgress * 0.7

      flyingItem.style.left = x + 'px'
      flyingItem.style.top = y + 'px'
      flyingItem.style.transform = `translate(-50%, -50%) scale(${scale})`
      flyingItem.style.opacity = String(Math.max(0, 1 - easeProgress * 0.3))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        flyingItem.remove()
        setCartCount((prev) => prev + 1)
        setCartScaling(true)
        setTimeout(() => setCartScaling(false), 800)
      }
    }

    requestAnimationFrame(animate)
  }, [productRef, cartRef, setCartCount, setCartScaling, animationSettings])

  return (
    <div className='w-full h-screen bg-neutral-950 text-white flex overflow-hidden'>
      {/* Canvas for path visualization */}
      {animationSettings.showPath && (
        <canvas
          ref={canvasRef}
          className='fixed inset-0 pointer-events-none z-10'
          style={{width: '100%', height: '100%'}}
        />
      )}

      {/* Sidebar */}
      <div className='w-96 bg-neutral-900 border-r border-neutral-800 overflow-y-auto'>
        <SettingsPanel
          settings={animationSettings}
          onSettingsChangeAction={setAnimationSettings}
        />
      </div>

      {/* Main Content */}
      <div className='flex-1 flex items-center justify-center relative'>
        {/* Cart Icon - Top Right */}
        <div
          ref={cartRef}
          className={`absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-neutral-900 cursor-pointer transition-transform ${
            cartScaling ? 'cart-wobble' : 'scale-100 hover:scale-110'
          }`}
          style={{
            transitionDuration: cartScaling ? '0ms' : '200ms',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
          <Icon name='bag-light' size={24} />
          {cartCount > 0 && (
            <div
              className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform ${
                cartScaling ? 'cart-wobble' : 'scale-100'
              }`}
              style={{
                transitionDuration: cartScaling ? '0ms' : '200ms',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
              {cartCount}
            </div>
          )}
        </div>

        {/* Product Card - Center */}
        <div ref={productRef}>
          <ProductCard onAddToCart={handleAddToCart} />
        </div>
      </div>
    </div>
  )
}
