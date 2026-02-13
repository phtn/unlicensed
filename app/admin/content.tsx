'use client'

import {Loader} from '@/components/expermtl/loader'
import {useRouter} from 'next/navigation'
import {useEffect, useTransition} from 'react'

export const Content = () => {
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(() => {
      router.replace('/admin/ops')
    })
  }, [router, startTransition])

  return (
    <main className='p-4 w-full md:h-screen flex md:items-center '>
      <Loader />
    </main>
  )
}
