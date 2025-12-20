'use client'

import {CourierForm} from '@/app/admin/(routes)/supplier/logistics/courier-form'
import {CourierFormValues} from '@/app/admin/_components/courier-schema'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'

interface EditCourierContentProps {
  id: Id<'couriers'>
}

export const EditCourier = ({id}: EditCourierContentProps) => {
  const router = useRouter()
  const courier = useQuery(
    api.couriers.q.getCourierById,
    id ? {id} : 'skip',
  )

  if (courier === undefined) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Loading courier...</p>
      </div>
    )
  }

  if (courier === null) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Courier not found</p>
      </div>
    )
  }

  // Convert courier data to form values
  const initialValues: CourierFormValues = {
    name: courier.name ?? '',
    code: courier.code ?? '',
    active: courier.active ?? true,
    trackingUrlTemplate: courier.trackingUrlTemplate ?? '',
  }

  const handleUpdated = () => {
    // Navigate back to the courier list after successful update
    router.push('/admin/supplier/logistics')
  }

  return (
    <CourierForm
      key={courier._id}
      courierId={courier._id}
      initialValues={initialValues}
      onUpdated={handleUpdated}
    />
  )
}

