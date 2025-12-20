'use client'

import {Suspense} from 'react'
import {StaffForm} from './staff-form'

export const NewStaff = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StaffForm />
    </Suspense>
  )
}

