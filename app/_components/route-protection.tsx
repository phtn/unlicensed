'use client'

import {Typewrite} from '@/components/expermtl/typewrite'
import {usePinAccess} from '@/ctx/pin-access'
import {useRouter} from 'next/navigation'
import {startTransition, useEffect, useState, type ReactNode} from 'react'

interface RouteProtectionProps {
  children: ReactNode
}

export function RouteProtection({children}: RouteProtectionProps) {
  const {isAuthenticated} = usePinAccess()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(() => true)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
  }, [isMounted])

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      startTransition(() => {
        router.replace('/')
      })
    }
  }, [isMounted, isAuthenticated, router])

  // Show loading state while checking authentication
  if (!isMounted) {
    return (
      <div className='fixed inset-0 z-9998 flex items-center justify-center bg-zinc-950'>
        <div className='text-white/50 font-brk tracking-widest'>
          <Typewrite text='One moment' />
        </div>
      </div>
    )
  }

  // If not authenticated, show nothing while redirecting
  if (!isAuthenticated) {
    return (
      <div className='fixed inset-0 z-9998 flex items-center justify-center bg-zinc-950'>
        <div className='text-white/50 font-brk tracking-widest'>
          <Typewrite initialDelay={0} speed={20} text='Redirecting' />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
