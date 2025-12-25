'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

export const Content = () => {
  const router = useRouter()
  const {user} = useAuthCtx()

  const staff = useQuery(
    api.staff.q.getStaffByEmail,
    user?.email ? {email: user.email} : 'skip',
  )
  const isAdmin =
    staff?.accessRoles.includes('admin') ||
    staff?.accessRoles.includes('manager')

  useEffect(() => {
    if (isAdmin) {
      return router.replace('/admin/ops')
    }
    return () => {
      router.replace('/')
    }
  }, [isAdmin, router])

  return (
    <main className='px-4 w-full'>
      <p>Authenticating...</p>
      <Loader />
    </main>
  )
}
