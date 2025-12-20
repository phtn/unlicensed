'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {CourierList} from './courier-list'
import {EditCourier} from './edit-courier'
import {NewCourier} from './new-courier'

const LogisticsContentInner = () => {
  const couriers = useQuery(api.couriers.q.listCouriers)
  const [tabId, , id] = useAdminTabId()

  switch (tabId) {
    case 'new':
      return <NewCourier />
    case 'edit':
      if (!id) {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <CourierList couriers={couriers} />
          </Suspense>
        )
      }
      return <EditCourier id={id as unknown as Id<'couriers'>} />
    default:
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <CourierList couriers={couriers} />
        </Suspense>
      )
  }
}

export const Content = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogisticsContentInner />
    </Suspense>
  )
}
