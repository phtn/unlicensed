'use client'

import {Loader} from '@/components/expermtl/loader'
import {useFirebaseAuthUser} from '@/hooks/use-firebase-auth-user'
import {useRouter} from 'next/navigation'
import {startTransition, useEffect, type ReactNode} from 'react'

type UserRequiredGuardProps = {
  children: ReactNode
}

/**
 * Redirects to /lobby when there is no Firebase user session.
 * Use on routes that require a signed-in user (e.g. /account).
 */
export function UserRequiredGuard({children}: UserRequiredGuardProps) {
  const router = useRouter()
  const {user, isLoading} = useFirebaseAuthUser()

  useEffect(() => {
    if (isLoading) return
    if (user) return
    startTransition(() => {
      router.replace('/lobby')
    })
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className='fixed inset-0 z-9998 flex items-center justify-center bg-zinc-950'>
        <Loader className='scale-50' />
      </div>
    )
  }

  if (!user) {
    return (
      <div className='fixed inset-0 z-9998 flex items-center justify-center bg-zinc-950'>
        <Loader className='scale-50' />
      </div>
    )
  }

  return <>{children}</>
}
