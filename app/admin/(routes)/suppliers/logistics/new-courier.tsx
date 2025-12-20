'use client'

import {Suspense} from 'react'
import {CourierForm} from './courier-form'

export const NewCourier = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourierForm />
    </Suspense>
  )
}

