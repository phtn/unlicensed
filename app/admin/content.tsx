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
    <main className='p-4 w-full h-96 md:h-screen flex items-center'>
      <Loader className='scale-30' />
    </main>
  )
}
