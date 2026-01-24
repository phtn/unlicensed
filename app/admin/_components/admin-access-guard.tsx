'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {useFirebaseAuthUser} from '@/hooks/use-firebase-auth-user'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {type ReactNode, useEffect, useMemo, useTransition} from 'react'
import {uuidv7} from 'uuidv7'

type AdminAccessGuardProps = {
  children: ReactNode
}

export function AdminAccessGuard({children}: AdminAccessGuardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const {user, isLoading: authLoading} = useFirebaseAuthUser()

  const staff = useQuery(
    api.staff.q.getStaffByEmail,
    user?.email ? {email: user.email} : 'skip',
  )

  const authResolved = !authLoading
  const staffResolved = staff !== undefined

  const isAdmin = useMemo(() => {
    if (!staff) return false
    if (!staff.active) return false
    return staff.accessRoles.includes('admin')
  }, [staff])

  const shouldRedirectHome = useMemo(() => {
    if (!authResolved) return false
    if (!user) return true
    if (!staffResolved) return false
    return !isAdmin
  }, [authResolved, isAdmin, staffResolved, user])

  useEffect(() => {
    if (!shouldRedirectHome) return
    startTransition(() => {
      router.replace('/')
    })
  }, [router, shouldRedirectHome, startTransition])

  // Hold rendering until we can make a correct decision (prevents "flash" of admin UI).
  if (!authResolved || (user && !staffResolved)) {
    return (
      <main className='p-6 w-full'>
        <p className='font-polysans font-semibold'>
          Halt Gate
          <span className='font-brk font-light px-4'>ID:{uuidv7()}</span>
        </p>
        <Loader />
      </main>
    )
  }

  // If we're redirecting, keep UI minimal.
  if (shouldRedirectHome || isPending) {
    return (
      <main className='px-4 w-full'>
        <p>Redirecting...</p>
        <Loader />
      </main>
    )
  }

  return <>{children}</>
}
