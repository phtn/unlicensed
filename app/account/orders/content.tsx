'use client'

import {useAccount} from '@/hooks/use-account'
import Link from 'next/link'

export const Content = () => {
  const {orders} = useAccount()
  return (
    <main className=''>
      <ul>
        {orders?.map((order) => (
          <li key={order._id}>
            <Link href={`/account/orders/${order._id}`}>{order._id}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
