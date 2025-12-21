'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

export const Content = () => {
  // const adminStats = useQuery(api.orders.q.getAdminStats)
  // const chartData = useQuery(api.orders.q.getAdminChartData)

  // const defaultStats = {
  //   salesTodayCents: 0,
  //   salesThisWeekCents: 0,
  //   salesThisMonthCents: 0,
  //   totalRevenueCents: 0,
  //   pendingOrdersCount: 0,
  //   cancelledOrdersCount: 0,
  //   ongoingDeliveriesCount: 0,
  //   deliveredOrdersCount: 0,
  //   totalOrdersCount: 0,
  //   totalUsersCount: 0,
  //   totalProductsCount: 0,
  //   averageOrderValueCents: 0,
  // }

  // const {on: fullTable, toggle: toggleFullTable} = useToggle()
  //
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
