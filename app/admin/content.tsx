'use client'

import {Loader} from '@/components/expermtl/loader'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'
import {useTransition} from 'react'

export const Content = () => {
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(() => {
      router.replace('/admin/ops')
    })
  }, [router, startTransition])

  return (
    <main className='px-4 w-full'>
      <p>Authenticating...</p>
      <Loader />
    </main>
  )
}
