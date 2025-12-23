'use client'

import {useEffect} from 'react'

const SCREEN_WIDTH_COOKIE = 'x-screen-width'
const SCREEN_HEIGHT_COOKIE = 'x-screen-height'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

/**
 * Sets screen dimensions in cookies so server-side middleware can access them
 */
function setScreenDimensionsCookie() {
  if (typeof window === 'undefined') return

  const width = window.innerWidth
  const height = window.innerHeight

  const expires = new Date()
  expires.setTime(expires.getTime() + COOKIE_MAX_AGE * 1000)

  const cookieOptions = `expires=${expires.toUTCString()}; path=/; SameSite=Strict${
    location.protocol === 'https:' ? '; Secure' : ''
  }`

  document.cookie = `${SCREEN_WIDTH_COOKIE}=${width}; ${cookieOptions}`
  document.cookie = `${SCREEN_HEIGHT_COOKIE}=${height}; ${cookieOptions}`
}

/**
 * Client component that tracks screen dimensions and stores them in cookies
 * This allows server-side middleware to access screen dimensions
 */
export function ScreenDimensionsTracker() {
  useEffect(() => {
    // Set initial dimensions
    setScreenDimensionsCookie()

    // Update on resize (debounced)
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        setScreenDimensionsCookie()
      }, 250) // Debounce resize events
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  return null
}

