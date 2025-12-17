'use client'

import {formatPrice} from '@/utils/formatPrice'
import {Card, CardBody, Divider} from '@heroui/react'

interface RewardsSummaryProps {
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export function RewardsSummary({
  subtotal,
  tax,
  shipping,
  total,
}: RewardsSummaryProps) {
  return (
    <div className='lg:sticky lg:top-24 h-fit'>
      <Card>
        <CardBody className='space-y-4 p-8'>
          <div className='flex items-center justify-between'>
            <h2 className='text-3xl font-semibold font-bone'>
              Rewards Multiplier
            </h2>
            <span className='text-4xl text-featured font-semibold font-bone'>
              x2
            </span>
          </div>

          <Divider />
          <div className='flex justify-between text-lg font-semibold font-space'>
            <span>Total</span>
            <span>${formatPrice(total)}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
