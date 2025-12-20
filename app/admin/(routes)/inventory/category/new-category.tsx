'use client'

import {Suspense} from 'react'
import {CategoryForm} from './category-form'

export const NewCategory = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoryForm />
    </Suspense>
  )
}
