'use client'

import {Typewrite} from '@/components/expermtl/typewrite'
import {useRouter} from 'next/navigation'
import {startTransition, useEffect, useState, type ReactNode} from 'react'

const RFAC_COOKIE_NAME = 'rf-ac'

/**
 * Check if rfac cookie is set (client-side)
 */
function hasRfacCookie(): boolean {
  if (typeof document === 'undefined') return false

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name] = cookie.trim().split('=')
    if (name === RFAC_COOKIE_NAME) {
      return true
    }
  }
  return false
}

interface RouteProtectionProps {
  children: ReactNode
}

export function RouteProtection({children}: RouteProtectionProps) {
  const router = useRouter()
  const [hasAccess] = useState(() => {
    if (typeof window === 'undefined') return false
    return hasRfacCookie()
  })

  useEffect(() => {
    // If cookie is not set, redirect to root
    if (!hasAccess) {
      startTransition(() => {
        router.replace('/')
      })
    }
  }, [hasAccess, router])

  // If cookie is not set, show loading while redirecting
  if (!hasAccess) {
    return (
      <div className='fixed inset-0 z-9998 flex items-center justify-center bg-zinc-950'>
        <div className='text-white/50 font-brk tracking-widest'>
          <Typewrite initialDelay={0} speed={15} text='AUTHENTICATING' />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
